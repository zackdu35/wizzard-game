/**
 * MOTEUR DE JEU - LA MAIN DU SORCIER
 * Gère la logique des cartes, du deck et de l'évaluation des mains.
 */

/**
 * Génère un deck complet de 52 cartes.
 * @returns {Array} Un array d'objets Card.
 */
function generateDeck() {
    const suits = ["gryffindor", "hufflepuff", "ravenclaw", "slytherin"];
    const deck = [];

    let id = 0;
    // Les rangs vont de 2 à 14 (As = 14)
    for (const suit of suits) {
        for (let rank = 2; rank <= 14; rank++) {
            deck.push({
                id: id++,
                suit: suit,
                rank: rank,
                baseDamage: rank,
                // Labels pour l'affichage ultérieur
                name: getRankName(rank),
                suitLabel: getSuitLabel(suit)
            });
        }
    }
    return deck;
}

/**
 * Retourne le nom lisible d'un rang.
 */
function getRankName(rank) {
    if (rank <= 10) return rank.toString();
    return t(`ranks.${rank}`);
}

/**
 * Retourne le label d'une enseigne.
 */
function getSuitLabel(suit) {
    return t(`suits.${suit}`);
}

/**
 * Mélange un deck en utilisant l'algorithme de Fisher-Yates.
 * @param {Array} deck 
 */
function shuffle(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

/**
 * Évalue la main sélectionnée (1 à 5 cartes) et calcule les dégâts.
 * @param {Array} selectedCards 
 * @param {Array} ownedBlessings Un array d'IDs de bénédictions possédées.
 * @returns {Object} { comboName: string, damage: number }
 */
function evaluateHand(selectedCards, ownedBlessings = []) {
    if (selectedCards.length === 0) return { comboName: t('combos.silence'), damage: 0 };

    // Tri des cartes par rang pour faciliter les détections
    const sorted = [...selectedCards].sort((a, b) => a.rank - b.rank);
    const ranks = sorted.map(c => c.rank);
    const suits = sorted.map(c => c.suit);

    // Calcul de la somme des dégâts de base des cartes individuelles
    const cardsSum = selectedCards.reduce((acc, card) => acc + card.baseDamage, 0);

    // Initialisation des variables de détection
    const counts = {};
    ranks.forEach(r => counts[r] = (counts[r] || 0) + 1);
    const freq = Object.values(counts).sort((a, b) => b - a);

    const isFlush = new Set(suits).size === 1 && selectedCards.length === 5;

    // Détection de suite (5 cartes consécutives)
    let isStraight = false;
    if (selectedCards.length === 5) {
        // Cas classique
        if (ranks[4] - ranks[0] === 4 && new Set(ranks).size === 5) {
            isStraight = true;
        }
        // Cas de l'As (14) utilisé comme 1 (non demandé spécifiquement mais bonne pratique)
        // Note: Ici l'As est 14, donc la suite A-2-3-4-5 serait [2,3,4,5,14]
        if (!isStraight && ranks[0] === 2 && ranks[1] === 3 && ranks[2] === 4 && ranks[3] === 5 && ranks[4] === 14) {
            isStraight = true;
        }
    }

    // Définition des scores de base et multiplicateurs (Valeurs équilibrées type Roguelike)
    // Définition des scores de base et multiplicateurs
    let comboName = "Incantation";
    let baseCombo = 10;

    // --- LOGIQUE DE DÉTECTION (du plus fort au plus faible) ---

    // 1. Quinte Flush Royale
    if (isFlush && isStraight && ranks[0] === 10) {
        comboName = "La Main du Sorcier";
        baseCombo = 2000;
    }
    // 2. Quinte Flush
    else if (isFlush && isStraight) {
        comboName = "Quinte Ensorcelée";
        baseCombo = 600;
    }
    // 3. Carré
    else if (freq[0] === 4) {
        comboName = "Quatre Maisons";
        baseCombo = 400;
    }
    // 4. Full House
    else if (freq[0] === 3 && freq[1] === 2) {
        comboName = "Convocation Complète";
        baseCombo = 175;
    }
    // 5. Couleur
    else if (isFlush) {
        comboName = "Harmonie de Maison";
        baseCombo = 125;
        // ARTEFACT : Potion Polyjuice (+30 dégâts de base pour Harmonie de Maison)
        if (ownedBlessings.includes("eau_vive")) {
            baseCombo += 30;
        }
    }
    // 6. Suite
    else if (isStraight) {
        comboName = "Séquence Enchantée";
        baseCombo = 100;
    }
    // 7. Brelan
    else if (freq[0] === 3) {
        comboName = "Trinité Magique";
        baseCombo = 80;
    }
    // 8. Double Paire
    else if (freq[0] === 2 && freq[1] === 2) {
        comboName = "Double Sortilège";
        baseCombo = 40;
    }
    // 9. Paire
    else if (freq[0] === 2) {
        comboName = "Duo Enchanté";
        baseCombo = 20;
    }
    // 10. Carte Haute (Incantation)
    else {
        comboName = "Incantation";
    }

    // --- MAP NAMES TO TRANSLATIONS ---
    const comboKeys = {
        "La Main du Sorcier": "royal_flush",
        "Quinte Ensorcelée": "straight_flush",
        "Quatre Maisons": "four_of_a_kind",
        "Convocation Complète": "full_house",
        "Harmonie de Maison": "flush",
        "Séquence Enchantée": "straight",
        "Trinité Magique": "three_of_a_kind",
        "Double Sortilège": "two_pair",
        "Duo Enchanté": "pair",
        "Incantation": "high_card"
    };

    if (comboKeys[comboName]) {
        comboName = t(`combos.${comboKeys[comboName]}`);
    }

    // Formule: damage = Base du combo + Somme des cartes
    const totalDamage = cardsSum + baseCombo;

    return {
        comboName: comboName,
        damage: totalDamage,
        baseCombo: baseCombo,
        cardsSum: cardsSum
    };
}

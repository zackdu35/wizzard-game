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
    if (selectedCards.length === 0) return { comboName: t('combos.silence'), damage: 0, comboCardIds: new Set() };

    // Tri des cartes par rang pour faciliter les détections
    const sorted = [...selectedCards].sort((a, b) => a.rank - b.rank);
    const ranks = sorted.map(c => c.rank);
    const suits = sorted.map(c => c.suit);

    // Initialisation des variables de détection
    const counts = {};
    ranks.forEach(r => counts[r] = (counts[r] || 0) + 1);
    const freq = Object.values(counts).sort((a, b) => b - a);

    const isFlush = new Set(suits).size === 1 && selectedCards.length === 5;

    // Détection de suite (5 cartes consécutives)
    let isStraight = false;
    if (selectedCards.length === 5) {
        if (ranks[4] - ranks[0] === 4 && new Set(ranks).size === 5) {
            isStraight = true;
        }
        if (!isStraight && ranks[0] === 2 && ranks[1] === 3 && ranks[2] === 4 && ranks[3] === 5 && ranks[4] === 14) {
            isStraight = true;
        }
    }

    let comboName = "Incantation";
    let baseCombo = 10;
    let comboCardIds = new Set();

    // --- LOGIQUE DE DÉTECTION (du plus fort au plus faible) ---

    // 1. Quinte Flush Royale — toutes les 5 cartes
    if (isFlush && isStraight && ranks[0] === 10) {
        comboName = "La Main du Sorcier";
        baseCombo = 2000;
        comboCardIds = new Set(selectedCards.map(c => c.id));
    }
    // 2. Quinte Flush — toutes les 5 cartes
    else if (isFlush && isStraight) {
        comboName = "Quinte Ensorcelée";
        baseCombo = 600;
        comboCardIds = new Set(selectedCards.map(c => c.id));
    }
    // 3. Carré — les 4 cartes du même rang
    else if (freq[0] === 4) {
        comboName = "Quatre Maisons";
        baseCombo = 400;
        const quadRank = +Object.keys(counts).find(r => counts[r] === 4);
        comboCardIds = new Set(selectedCards.filter(c => c.rank === quadRank).map(c => c.id));
    }
    // 4. Full House — toutes les 5 cartes (3+2)
    else if (freq[0] === 3 && freq[1] === 2) {
        comboName = "Convocation Complète";
        baseCombo = 175;
        comboCardIds = new Set(selectedCards.map(c => c.id));
    }
    // 5. Couleur — toutes les 5 cartes
    else if (isFlush) {
        comboName = "Harmonie de Maison";
        baseCombo = 125;
        if (ownedBlessings.includes("eau_vive")) {
            baseCombo += 30;
        }
        comboCardIds = new Set(selectedCards.map(c => c.id));
    }
    // 6. Suite — toutes les 5 cartes
    else if (isStraight) {
        comboName = "Séquence Enchantée";
        baseCombo = 100;
        comboCardIds = new Set(selectedCards.map(c => c.id));
    }
    // 7. Brelan — les 3 cartes du même rang
    else if (freq[0] === 3) {
        comboName = "Trinité Magique";
        baseCombo = 80;
        const tripleRank = +Object.keys(counts).find(r => counts[r] === 3);
        comboCardIds = new Set(selectedCards.filter(c => c.rank === tripleRank).map(c => c.id));
    }
    // 8. Double Paire — les 4 cartes des 2 paires
    else if (freq[0] === 2 && freq[1] === 2) {
        comboName = "Double Sortilège";
        baseCombo = 40;
        const pairRanks = Object.keys(counts).filter(r => counts[r] === 2).map(Number);
        comboCardIds = new Set(selectedCards.filter(c => pairRanks.includes(c.rank)).map(c => c.id));
    }
    // 9. Paire — les 2 cartes de la paire
    else if (freq[0] === 2) {
        comboName = "Duo Enchanté";
        baseCombo = 20;
        const pairRank = +Object.keys(counts).find(r => counts[r] === 2);
        comboCardIds = new Set(selectedCards.filter(c => c.rank === pairRank).map(c => c.id));
    }
    // 10. Carte Haute — seulement la carte la plus haute
    else {
        comboName = "Incantation";
        const highestCard = sorted[sorted.length - 1];
        comboCardIds = new Set([highestCard.id]);
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

    // Seules les cartes du combo comptent pour les dégâts
    const comboCardsOnly = selectedCards.filter(c => comboCardIds.has(c.id));
    const cardsSum = comboCardsOnly.reduce((acc, card) => acc + card.baseDamage, 0);
    const totalDamage = cardsSum + baseCombo;

    return {
        comboName: comboName,
        damage: totalDamage,
        baseCombo: baseCombo,
        cardsSum: cardsSum,
        comboCardIds: comboCardIds
    };
}

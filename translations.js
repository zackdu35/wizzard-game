const translations = {
    fr: {
        ui: {
            title: "La Main du Sorcier - Roguelike Poker",
            galleons: "",
            wizard_hp: "",
            discards: "",
            spells: "",
            cast_spell: "ATTAQUE",
            discard: "DÉFAUSSE",
            grimoire_title: "Grimoire des Sortilèges",
            grimoire_subtitle: "Les sorts et leur puissance destructrice",
            close_grimoire: "Fermer le Grimoire",
            victory: "VICTOIRE !",
            defeat: "DÉFAITE...",
            enemy_defeated: "L'adversaire est vaincu.",
            new_adventure: "NOUVELLE AVENTURE",
            sanctuary_title: "DIAGON ALLEY",
            continue_adventure: "CONTINUER L'AVENTURE",
            enemy_atk: "Sort offensif : ",
            pts: "pts",
            mult: "Mult",
            owned: "POSSÉDÉ",
            buy: "ACHETER",
            damage: "Dégâts",
            title_name: "LA MAIN DU SORCIER",
            title_subtitle: "Roguelike Poker",
            new_game: "NOUVELLE PARTIE",
            continue_game: "CONTINUER",
            select_difficulty: "CHOISISSEZ VOTRE DESTINÉE",
            difficulty_apprenti: "Apprenti",
            difficulty_elite: "Sorcier d'Élite",
            difficulty_arcanes: "Maître des Arcanes",
            desc_apprenti: "Pour les jeunes sorciers. PV et défausses augmentés, ennemis affaiblis.",
            desc_elite: "L'expérience classique. Équilibrée et redoutable.",
            desc_arcanes: "Pour les téméraires. Moins de PV, ennemis surpuissants.",
            back: "RETOUR",
            quit_confirm: "Abandonner la partie et retourner au menu ?",
            quit_yes: "OUI",
            quit_no: "NON"
        },
        combos: {
            royal_flush: "La Main du Sorcier",
            straight_flush: "Quinte Ensorcelée",
            four_of_a_kind: "Quatre Maisons",
            full_house: "Convocation Complète",
            flush: "Harmonie de Maison",
            straight: "Séquence Enchantée",
            three_of_a_kind: "Trinité Magique",
            two_pair: "Double Sortilège",
            pair: "Duo Enchanté",
            high_card: "Incantation",
            silence: "Silence"
        },
        combo_desc: {
            royal_flush: "Quinte Flush Royale (10 au Directeur)",
            straight_flush: "Quinte Flush (5 cartes consécutives même Maison)",
            four_of_a_kind: "Carré (4 cartes de même rang)",
            full_house: "Full House (3 + 2 cartes)",
            flush: "Couleur (5 cartes même Maison)",
            straight: "Suite (5 cartes consécutives)",
            three_of_a_kind: "Brelan (3 cartes de même rang)",
            two_pair: "Double Paire (2 + 2 cartes)",
            pair: "Paire (2 cartes de même rang)",
            high_card: "Carte Haute"
        },
        ranks: {
            11: "Préfet",
            12: "Prodige",
            13: "Professeur",
            14: "Directeur"
        },
        suits: {
            gryffindor: "Gryffondor",
            hufflepuff: "Poufsouffle",
            ravenclaw: "Serdaigle",
            slytherin: "Serpentard"
        },
        blessings: {
            grace: { name: "Baguette de Sureau", desc: "+1 Défausse maximum par combat." },
            multiplication: { name: "Pierre Philosophale", desc: "Gagnez +5 Galleons supplémentaires par victoire." },
            eau_vive: { name: "Potion Polyjuice", desc: "Le sortilège 'Harmonie de Maison' (Couleur) inflige +30 dégâts de base." },
            cape_invisibilite: { name: "Cape d'Invisibilité", desc: "+15 PV maximum et soigne 15 PV." },
            retourneur_temps: { name: "Retourneur de Temps", desc: "+2 Défausses maximum par combat." },
            carte_maraudeur: { name: "Carte du Maraudeur", desc: "Le sortilège 'Duo Enchanté' (Paire) inflige +20 dégâts de base." },
            vif_or: { name: "Vif d'Or", desc: "+5% de chance de coup critique par carte." },
            choixpeau: { name: "Choixpeau Magique", desc: "Le sortilège 'Convocation Complète' (Full House) inflige +50 dégâts de base." }
        },
        enemies: {
            troll: "Le Troll du Couloir",
            spider: "L'Araignee Geante",
            gnome: "Le Gnome de Jardin",
            pixie: "Le Lutin de Cornouailles",
            basilisk: "Le Basilic Juvenile",
            boggart: "L'Epouvantard",
            hippogriff: "L'Hippogriffe Furieux",
            skrewt: "Le Scroutt a Petard",
            werewolf: "Le Loup-Garou",
            dragon: "Le Magyar a Pointes",
            centaur: "Le Centaure Renegat",
            dementor: "Le Detraqueur",
            voldemort: "Lord Voldemort",
            bellatrix: "Bellatrix Lestrange"
        }
    },
    en: {
        ui: {
            title: "The Sorcerer's Hand - Roguelike Poker",
            galleons: "",
            wizard_hp: "",
            discards: "",
            spells: "",
            cast_spell: "ATTACK",
            discard: "DISCARD",
            grimoire_title: "Grimoire of Spells",
            grimoire_subtitle: "Spells and their destructive power",
            close_grimoire: "Close Grimoire",
            victory: "VICTORY!",
            defeat: "DEFEAT...",
            enemy_defeated: "The enemy is defeated.",
            new_adventure: "NEW ADVENTURE",
            sanctuary_title: "DIAGON ALLEY",
            continue_adventure: "CONTINUE ADVENTURE",
            enemy_atk: "Offensive spell : ",
            pts: "pts",
            mult: "Mult",
            owned: "OWNED",
            buy: "BUY",
            damage: "Damage",
            title_name: "THE SORCERER'S HAND",
            title_subtitle: "Roguelike Poker",
            new_game: "NEW GAME",
            continue_game: "CONTINUE",
            select_difficulty: "CHOOSE YOUR DESTINY",
            difficulty_apprenti: "Apprentice",
            difficulty_elite: "Elite Sorcerer",
            difficulty_arcanes: "Arcane Master",
            desc_apprenti: "For young wizards. More HP and discards, weaker enemies.",
            desc_elite: "The classic experience. Balanced and formidable.",
            desc_arcanes: "For the daring. Less HP, overpowered enemies.",
            back: "BACK",
            quit_confirm: "Abandon the game and return to menu?",
            quit_yes: "YES",
            quit_no: "NO"
        },
        combos: {
            royal_flush: "The Sorcerer's Hand",
            straight_flush: "Enchanted Straight",
            four_of_a_kind: "Four Houses",
            full_house: "Complete Summoning",
            flush: "House Harmony",
            straight: "Enchanted Sequence",
            three_of_a_kind: "Magic Trinity",
            two_pair: "Double Spell",
            pair: "Enchanted Duo",
            high_card: "Incantation",
            silence: "Silence"
        },
        combo_desc: {
            royal_flush: "Royal Flush (10 to Headmaster)",
            straight_flush: "Straight Flush (5 consecutive cards same House)",
            four_of_a_kind: "Four of a kind (4 cards of same rank)",
            full_house: "Full House (3 + 2 cards)",
            flush: "Flush (5 cards same House)",
            straight: "Straight (5 consecutive cards)",
            three_of_a_kind: "Three of a kind (3 cards of same rank)",
            two_pair: "Two Pair (2 + 2 cards)",
            pair: "Pair (2 cards of same rank)",
            high_card: "High Card"
        },
        ranks: {
            11: "Prefect",
            12: "Prodigy",
            13: "Professor",
            14: "Headmaster"
        },
        suits: {
            gryffindor: "Gryffindor",
            hufflepuff: "Hufflepuff",
            ravenclaw: "Ravenclaw",
            slytherin: "Slytherin"
        },
        blessings: {
            grace: { name: "Elder Wand", desc: "+1 maximum Discard per combat." },
            multiplication: { name: "Philosopher's Stone", desc: "Gain +5 extra Galleons per victory." },
            eau_vive: { name: "Polyjuice Potion", desc: "The 'House Harmony' (Flush) spell deals +30 base damage." },
            cape_invisibilite: { name: "Cloak of Invisibility", desc: "+15 max HP and heals 15 HP." },
            retourneur_temps: { name: "Time-Turner", desc: "+2 maximum Discards per combat." },
            carte_maraudeur: { name: "Marauder's Map", desc: "The 'Enchanted Duo' (Pair) spell deals +20 base damage." },
            vif_or: { name: "Golden Snitch", desc: "+5% critical hit chance per card." },
            choixpeau: { name: "Sorting Hat", desc: "The 'Complete Summoning' (Full House) spell deals +50 base damage." }
        },
        enemies: {
            troll: "The Hallway Troll",
            spider: "The Giant Spider",
            gnome: "Garden Gnome",
            pixie: "Cornish Pixie",
            basilisk: "Juvenile Basilisk",
            boggart: "Boggart",
            hippogriff: "Furious Hippogriff",
            skrewt: "Blast-Ended Skrewt",
            werewolf: "Werewolf",
            dragon: "Hungarian Horntail",
            centaur: "Renegade Centaur",
            dementor: "Dementor",
            voldemort: "Lord Voldemort",
            bellatrix: "Bellatrix Lestrange"
        }
    },
    it: {
        ui: {
            title: "La Mano dello Stregone - Roguelike Poker",
            galleons: "",
            wizard_hp: "",
            discards: "",
            spells: "",
            cast_spell: "ATTACCO",
            discard: "SCARTA",
            grimoire_title: "Grimorio degli Incantesimi",
            grimoire_subtitle: "Gli incantesimi e il loro potere distruttivo",
            close_grimoire: "Chiudi il Grimorio",
            victory: "VITTORIA!",
            defeat: "SCONFITTA...",
            enemy_defeated: "L'avversario è sconfitto.",
            new_adventure: "NUOVA AVVENTURA",
            sanctuary_title: "DIAGON ALLEY",
            continue_adventure: "CONTINUA L'AVVENTURA",
            enemy_atk: "Incantesimo offensivo : ",
            pts: "pti",
            mult: "Mult",
            owned: "POSSEDUTO",
            buy: "ACQUISTA",
            damage: "Danni",
            title_name: "LA MANO DELLO STREGONE",
            title_subtitle: "Roguelike Poker",
            new_game: "NUOVA PARTITA",
            continue_game: "CONTINUA",
            select_difficulty: "SCEGLI IL TUO DESTINO",
            difficulty_apprenti: "Apprendista",
            difficulty_elite: "Stregone d'Élite",
            difficulty_arcanes: "Maestro degli Arcani",
            desc_apprenti: "Per giovani maghi. Più PV e scarti, nemici indeboliti.",
            desc_elite: "L'esperienza classica. Equilibrata e temibile.",
            desc_arcanes: "Per i temerari. Meno PV, nemici potenziati.",
            back: "INDIETRO",
            quit_confirm: "Abbandonare la partita e tornare al menu?",
            quit_yes: "SÌ",
            quit_no: "NO"
        },
        combos: {
            royal_flush: "La Mano dello Stregone",
            straight_flush: "Scala Reale Incantata",
            four_of_a_kind: "Quattro Case",
            full_house: "Convocazione Completa",
            flush: "Armonia della Casa",
            straight: "Sequenza Incantata",
            three_of_a_kind: "Trinità Magica",
            two_pair: "Doppio Incantesimo",
            pair: "Duo Incantato",
            high_card: "Incantesimo",
            silence: "Silenzio"
        },
        combo_desc: {
            royal_flush: "Scala Reale (dal 10 al Preside)",
            straight_flush: "Scala Colore (5 carte consecutive stessa Casa)",
            four_of_a_kind: "Poker (4 carte dello stesso rango)",
            full_house: "Full (3 + 2 carte)",
            flush: "Colore (5 carte stessa Casa)",
            straight: "Scala (5 carte consecutive)",
            three_of_a_kind: "Tris (3 carte dello stesso rango)",
            two_pair: "Doppia Coppia (2 + 2 carte)",
            pair: "Coppia (2 carte dello stesso rango)",
            high_card: "Carta Alta"
        },
        ranks: {
            11: "Prefetto",
            12: "Prodigio",
            13: "Professore",
            14: "Preside"
        },
        suits: {
            gryffindor: "Grinfondoro",
            hufflepuff: "Tassorosso",
            ravenclaw: "Corvonero",
            slytherin: "Serpeverde"
        },
        blessings: {
            grace: { name: "Bacchetta di Sambuco", desc: "+1 Scarto massimo per combattimento." },
            multiplication: { name: "Pietra Filosofale", desc: "Guadagna +5 Galleoni extra per vittoria." },
            eau_vive: { name: "Pozione Polisucco", desc: "L'incantesimo 'Armonia della Casa' (Colore) infligge +30 danni base." },
            cape_invisibilite: { name: "Mantello dell'Invisibilità", desc: "+15 PV massimi e cura 15 PV." },
            retourneur_temps: { name: "Giratempo", desc: "+2 Scarti massimi per combattimento." },
            carte_maraudeur: { name: "Mappa del Malandrino", desc: "L'incantesimo 'Duo Incantato' (Coppia) infligge +20 danni base." },
            vif_or: { name: "Boccino d'Oro", desc: "+5% di probabilità di colpo critico per carta." },
            choixpeau: { name: "Cappello Parlante", desc: "L'incantesimo 'Convocazione Completa' (Full) infligge +50 danni base." }
        },
        enemies: {
            troll: "Il Troll del Corridoio",
            spider: "Il Ragno Gigante",
            gnome: "Gnomo da Giardino",
            pixie: "Folletto della Cornovaglia",
            basilisk: "Basilisco Giovanile",
            boggart: "Molliccio",
            hippogriff: "Ippogrifo Furioso",
            skrewt: "Schiopodo da Sparo",
            werewolf: "Lupo Mannaro",
            dragon: "Ungaro Spinato",
            centaur: "Centauro Rinnegato",
            dementor: "Dissennatore",
            voldemort: "Lord Voldemort",
            bellatrix: "Bellatrix Lestrange"
        }
    }
};

let currentLang = localStorage.getItem('sorcererHand_lang') || 'fr';

function t(path) {
    const keys = path.split('.');
    let result = translations[currentLang];
    for (const key of keys) {
        if (result[key] === undefined) return path;
        result = result[key];
    }
    return result;
}

function setLanguage(lang) {
    if (translations[lang]) {
        currentLang = lang;
        localStorage.setItem('sorcererHand_lang', lang);
        // Dispatch event for UI update if needed
        window.dispatchEvent(new Event('languageChanged'));
    }
}

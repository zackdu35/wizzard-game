// --- CONFIGURATION DEV ---
const DEV_MODE = false; // Passez à false pour désactiver le mode développeur

// --- POOL D'ENNEMIS ---
const ENEMY_POOL = [
    // Tier 1 (nodes 1-2): low HP, low attack
    { id: "troll", hp: 200, attack: 10, tier: 1, image: "ennemy-troll.png", bg: "toilet-bg.png" },
    { id: "spider", hp: 180, attack: 12, tier: 1, image: "giant-spider-ennemy.webp", bg: "bg-foret-interdite.png" },
    { id: "gnome", hp: 150, attack: 8, tier: 1, image: "gnome-ennemy.png" },
    { id: "pixie", hp: 170, attack: 11, tier: 1, image: "Cornish Pixie.png" },
    // Tier 2 (nodes 4-5): medium HP, medium attack
    { id: "basilisk", hp: 300, attack: 15, tier: 2, image: "Juvenile Basilisk.png" },
    { id: "boggart", hp: 280, attack: 18, tier: 2, image: "Boggart.png", bg: "salle-de-classe-bg.png" },
    { id: "hippogriff", hp: 320, attack: 14, tier: 2, image: "Furious Hippogriff.png", bg: "bg-foret-interdite.png" },
    { id: "skrewt", hp: 260, attack: 20, tier: 2, image: "Blast-Ended Skrewt.png" },
    // Tier 3 (nodes 7-8): high HP, high attack
    { id: "werewolf", hp: 400, attack: 22, tier: 3, image: "werefolf-ennemy.png", bg: "loup-garou-bg.png" },
    { id: "dragon", hp: 450, attack: 25, tier: 3, image: "Hungarian Horntail.png", bg: "dragon-map-bg.png" },
    { id: "centaur", hp: 420, attack: 20, tier: 3, image: "ennemy-troll.png", bg: "bg-foret-interdite.png" },
];

const BOSS_POOL = [
    {
        id: "dementor",
        hp: 800,
        attack: 30,
        image: "ennemy-troll.png", // Default for now
        malus: {
            id: "no_ravenclaw",
            description: "Les cartes de Serdaigle ne font aucun degat.",
            apply: (card) => card.suit === "ravenclaw" ? 0 : card.baseDamage
        }
    },
    {
        id: "voldemort",
        hp: 1000,
        attack: 35,
        image: "ennemy-troll.png",
        malus: {
            id: "no_low_cards",
            description: "Les cartes de rang 2 a 6 ne font aucun degat.",
            apply: (card) => card.rank <= 6 ? 0 : card.baseDamage
        }
    },
    {
        id: "bellatrix",
        hp: 700,
        attack: 40,
        image: "ennemy-troll.png",
        malus: {
            id: "no_hufflepuff",
            description: "Les cartes de Poufsouffle ne font aucun degat.",
            apply: (card) => card.suit === "hufflepuff" ? 0 : card.baseDamage
        }
    }
];

// --- PRESETS DE DIFFICULTÉ ---
const DIFFICULTY_PRESETS = {
    apprenti: { hp: 150, discards: 4, enemyMult: 0.8, critChance: 0.05 },
    elite: { hp: 100, discards: 3, enemyMult: 1.0, critChance: 0.03 },
    arcanes: { hp: 80, discards: 2, enemyMult: 1.3, critChance: 0.02 }
};

// --- TYPES DE NOEUDS & TEMPLATE DE RUN ---
const NODE_TYPES = {
    COMBAT: "combat",
    SHOP: "shop",
    BOSS: "boss",
    DORTOIR: "dortoir"
};

// Chaque entrée = une colonne avec 1-3 noeuds possibles (max 3 choix)
const RUN_TEMPLATE = [
    [{ type: NODE_TYPES.COMBAT, tier: 1 }],                                      // Col 0: Départ forcé
    [{ type: NODE_TYPES.COMBAT, tier: 1 }, { type: NODE_TYPES.COMBAT, tier: 1 }], // Col 1
    [{ type: NODE_TYPES.SHOP }, { type: NODE_TYPES.COMBAT, tier: 1 }, { type: NODE_TYPES.DORTOIR }], // Col 2: Premier choix stratégique
    [{ type: NODE_TYPES.COMBAT, tier: 2 }],                                      // Col 3: Passage obligé T2
    [{ type: NODE_TYPES.COMBAT, tier: 2 }, { type: NODE_TYPES.SHOP }],            // Col 4
    [{ type: NODE_TYPES.COMBAT, tier: 2 }, { type: NODE_TYPES.DORTOIR }, { type: NODE_TYPES.COMBAT, tier: 2 }], // Col 5
    [{ type: NODE_TYPES.COMBAT, tier: 3 }],                                      // Col 6: Passage obligé T3
    [{ type: NODE_TYPES.COMBAT, tier: 3 }, { type: NODE_TYPES.SHOP }],            // Col 7
    [{ type: NODE_TYPES.SHOP }, { type: NODE_TYPES.DORTOIR }],                   // Col 8: Préparation finale
    [{ type: NODE_TYPES.BOSS }],                                                 // Col 9: Boss Final
];

// --- ÉTAT GLOBAL ---
const state = {
    player: {
        hp: 100,
        maxHp: 100,
        gold: 0,
        discards: 3,
        maxDiscards: 3,
        blessings: []
    },
    enemy: null, // set dynamically per node
    // Run tracking
    run: {
        columns: [],          // Array of column objects
        currentColumnIndex: 0,
        isComplete: false,
        stats: {
            enemiesDefeated: 0,
            totalDamageDealt: 0,
            totalGoldEarned: 0,
            bossName: ""
        }
    },
    // Combat state
    deck: [],
    hand: [],
    selectedIndices: [],
    isAnimating: false,
    isTransitioning: false,
    difficulty: "elite",
    // Critical system
    criticalCardIds: new Set(),
    critChance: 0.03,   // 3% per card
    critBonus: 0.25      // +25% damage
};

const suitImages = {
    "gryffindor": "assets/suit_gryffindor.webp",
    "hufflepuff": "assets/suit_hufflepuff.webp",
    "ravenclaw": "assets/suit_ravenclaw.webp",
    "slytherin": "assets/suit_slytherin.webp"
};

// --- BASE DE DONNÉES DES ARTEFACTS MAGIQUES ---
const availableBlessings = [
    { id: "grace", cost: 15 },
    { id: "multiplication", cost: 20 },
    { id: "eau_vive", cost: 25 },
    { id: "cape_invisibilite", cost: 20 },
    { id: "retourneur_temps", cost: 25 },
    { id: "carte_maraudeur", cost: 15 },
    { id: "vif_or", cost: 20 },
    { id: "choixpeau", cost: 30 }
];

// --- GRIMOIRE DES SORTILÈGES ---
const combosGuide = [
    { key: "royal_flush", base: 2000, cards: ["gryffindor_10", "gryffindor_11", "gryffindor_12", "gryffindor_13", "gryffindor_14"] },
    { key: "straight_flush", base: 600, cards: ["slytherin_5", "slytherin_6", "slytherin_7", "slytherin_8", "slytherin_9"] },
    { key: "four_of_a_kind", base: 400, cards: ["gryffindor_7", "hufflepuff_7", "ravenclaw_7", "slytherin_7"] },
    { key: "full_house", base: 175, cards: ["gryffindor_9", "hufflepuff_9", "ravenclaw_9", "gryffindor_5", "slytherin_5"] },
    { key: "flush", base: 125, cards: ["ravenclaw_2", "ravenclaw_5", "ravenclaw_8", "ravenclaw_11", "ravenclaw_13"] },
    { key: "straight", base: 100, cards: ["gryffindor_4", "slytherin_5", "hufflepuff_6", "ravenclaw_7", "gryffindor_8"] },
    { key: "three_of_a_kind", base: 80, cards: ["gryffindor_11", "hufflepuff_11", "slytherin_11"] },
    { key: "two_pair", base: 40, cards: ["gryffindor_3", "hufflepuff_3", "ravenclaw_9", "slytherin_9"] },
    { key: "pair", base: 20, cards: ["gryffindor_14", "hufflepuff_14"] },
    { key: "high_card", base: 10, cards: ["slytherin_12"] }
];

// --- GÉNÉRATION DE RUN ---
function generateRun() {
    state.run.columns = [];
    state.run.currentColumnIndex = 0;
    state.run.isComplete = false;
    state.run.stats = { enemiesDefeated: 0, totalDamageDealt: 0, totalGoldEarned: 0, bossName: "" };

    // Pick a random boss
    const boss = BOSS_POOL[Math.floor(Math.random() * BOSS_POOL.length)];
    state.run.stats.bossId = boss.id;

    // Difficulty multiplier for enemy stats
    const preset = DIFFICULTY_PRESETS[state.difficulty] || DIFFICULTY_PRESETS.elite;
    const eMult = preset.enemyMult;

    const usedEnemyIds = new Set();

    RUN_TEMPLATE.forEach((columnTemplate, colIndex) => {
        const column = {
            nodes: [],
            selectedNodeIndex: null
        };

        columnTemplate.forEach(template => {
            const node = {
                type: template.type,
                status: colIndex === 0 ? "current" : "upcoming"
            };

            if (template.type === NODE_TYPES.COMBAT) {
                const tierEnemies = ENEMY_POOL.filter(e => e.tier === template.tier && !usedEnemyIds.has(e.id));
                const pool = tierEnemies.length > 0 ? tierEnemies : ENEMY_POOL.filter(e => e.tier === template.tier);
                const picked = pool[Math.floor(Math.random() * pool.length)];
                usedEnemyIds.add(picked.id);
                const eHp = Math.floor(picked.hp * eMult);
                node.enemy = { id: picked.id, hp: eHp, maxHp: eHp, attack: Math.floor(picked.attack * eMult), image: picked.image, bg: picked.bg };
                node.tier = template.tier;
            } else if (template.type === NODE_TYPES.BOSS) {
                const bHp = Math.floor(boss.hp * eMult);
                node.enemy = { id: boss.id, hp: bHp, maxHp: bHp, attack: Math.floor(boss.attack * eMult), image: boss.image, bg: boss.bg };
                node.malus = boss.malus;
            }
            // Shop and Dortoir nodes have no enemy

            column.nodes.push(node);
        });

        state.run.columns.push(column);
    });
}

// --- MAP SCREEN ---
function renderMap() {
    const container = document.getElementById('map-nodes-container');
    container.innerHTML = '';

    state.run.columns.forEach((column, colIndex) => {
        // Add connector before each column (except first)
        if (colIndex > 0) {
            const connector = document.createElement('div');
            const prevCompleted = state.run.columns[colIndex - 1].nodes.every(n => n.status === 'completed') ||
                state.run.columns[colIndex - 1].selectedNodeIndex !== null;
            connector.className = `map-connector ${prevCompleted ? 'completed' : ''}`;
            container.appendChild(connector);
        }

        const colEl = document.createElement('div');
        colEl.className = 'map-column';

        column.nodes.forEach((node, nodeIndex) => {
            const nodeEl = document.createElement('div');
            nodeEl.className = `map-node ${node.status}`;

            // Highlight selected node in current column
            const isCurrent = colIndex === state.run.currentColumnIndex;
            if (isCurrent && column.selectedNodeIndex === nodeIndex) {
                nodeEl.classList.add('selected');
            }

            // Icon per type
            let icon = '';
            let typeClass = '';
            if (node.type === NODE_TYPES.COMBAT) {
                icon = '\u2694\uFE0F';
                typeClass = 'combat';
            } else if (node.type === NODE_TYPES.SHOP) {
                icon = '\uD83C\uDFEA';
                typeClass = 'shop';
            } else if (node.type === NODE_TYPES.BOSS) {
                icon = '\uD83D\uDC80';
                typeClass = 'boss';
            } else if (node.type === NODE_TYPES.DORTOIR) {
                icon = '\uD83D\uDECF\uFE0F';
                typeClass = 'dortoir';
            }

            nodeEl.innerHTML = `
                <div class="map-node-icon ${typeClass}">${icon}</div>
                <span class="map-node-label">${getNodeLabel(node)}</span>
            `;

            // Click handler for node selection (only in current column with choices)
            if (isCurrent && column.nodes.length > 1 && node.status === 'current') {
                nodeEl.style.cursor = 'pointer';
                nodeEl.addEventListener('click', () => {
                    column.selectedNodeIndex = nodeIndex;
                    renderMap();
                    updateMapNodeInfo();
                });
            }

            colEl.appendChild(nodeEl);
        });

        container.appendChild(colEl);
    });

    updateMapNodeInfo();
}

function getNodeLabel(node) {
    if (node.type === NODE_TYPES.COMBAT) return t(`enemies.${node.enemy.id}`);
    if (node.type === NODE_TYPES.SHOP) return 'Diagon Alley';
    if (node.type === NODE_TYPES.BOSS) return t(`enemies.${node.enemy.id}`);
    if (node.type === NODE_TYPES.DORTOIR) return 'Dortoir';
    return '';
}

function updateMapNodeInfo() {
    const column = state.run.columns[state.run.currentColumnIndex];
    const nameEl = document.getElementById('map-node-name');
    const descEl = document.getElementById('map-node-desc');
    const btnEnter = document.getElementById('btn-enter-node');

    // If column has multiple nodes, show selected or prompt to choose
    let selectedNode = null;
    if (column.nodes.length === 1) {
        column.selectedNodeIndex = 0;
        selectedNode = column.nodes[0];
    } else if (column.selectedNodeIndex !== null) {
        selectedNode = column.nodes[column.selectedNodeIndex];
    }

    if (!selectedNode) {
        nameEl.innerText = "Choisissez votre chemin";
        descEl.innerText = "Cliquez sur un noeud pour le selectionner.";
        btnEnter.disabled = true;
        return;
    }

    btnEnter.disabled = false;

    if (selectedNode.type === NODE_TYPES.COMBAT) {
        nameEl.innerText = t(`enemies.${selectedNode.enemy.id}`);
        descEl.innerText = "Serez-vous de taille pour ce duel ?";
    } else if (selectedNode.type === NODE_TYPES.SHOP) {
        nameEl.innerText = "Diagon Alley";
        descEl.innerText = "Depensez vos Galleons pour des artefacts magiques.";
    } else if (selectedNode.type === NODE_TYPES.BOSS) {
        nameEl.innerText = `BOSS: ${t(`enemies.${selectedNode.enemy.id}`)}`;
        descEl.innerText = selectedNode.malus.description;
    } else if (selectedNode.type === NODE_TYPES.DORTOIR) {
        const healAmount = Math.floor(state.player.maxHp * 0.3);
        nameEl.innerText = "Dortoir";
        descEl.innerText = `Reposez-vous et recuperez ${healAmount} PV (30% PV max).`;
    }
}

function showMap() {
    stopEnemyParticles();

    // Auto-skip map if current column has only 1 node
    const column = state.run.columns[state.run.currentColumnIndex];
    if (column && column.nodes.length === 1) {
        column.selectedNodeIndex = 0;
        saveGame();
        // Directly enter the only node (no map display)
        enterCurrentNode();
        return;
    }

    document.getElementById('map-screen').style.display = 'flex';
    document.getElementById('game-container').style.opacity = '0';
    document.getElementById('sanctuary-screen').style.display = 'none';
    document.getElementById('dortoir-screen').style.display = 'none';
    document.getElementById('main-game-bg').style.display = 'block';
    document.getElementById('main-game-bg').style.backgroundImage = "url('assets/map-bg.png')";
    document.getElementById('grimoire-btn').style.display = 'none';
    document.body.classList.add('on-map');
    renderMap();

    // Animation d'entrée Premium
    const tl = gsap.timeline();
    tl.fromTo('#map-screen', { opacity: 0 }, { opacity: 1, duration: 0.8 })
        .fromTo('#map-title-text', { y: -50, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }, "-=0.4")
        .fromTo('.map-node', { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, stagger: 0.05, ease: 'back.out(1.7)' }, "-=0.6")
        .fromTo('.map-connector', { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 0.4, stagger: 0.05 }, "-=0.6")
        .fromTo('#map-node-info', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, "-=0.2")
        .fromTo('#btn-enter-node', { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'elastic.out(1, 0.5)' }, "-=0.3");

    // Auto-save on map
    saveGame();
}

async function enterCurrentNode() {
    const column = state.run.columns[state.run.currentColumnIndex];
    if (column.selectedNodeIndex === null) return;
    const currentNode = column.nodes[column.selectedNodeIndex];

    const mainBg = document.getElementById('main-game-bg');

    if (currentNode.type === NODE_TYPES.COMBAT || currentNode.type === NODE_TYPES.BOSS) {
        // Set current enemy from node data
        state.enemy = { ...currentNode.enemy };

        // Update background and portrait dynamically from the pools to ensure latest assets are used
        let latestBg = state.enemy.bg;
        let latestImage = state.enemy.image;
        const poolEnemy = ENEMY_POOL.find(e => e.id === state.enemy.id) || BOSS_POOL.find(b => b.id === state.enemy.id);
        if (poolEnemy) {
            if (poolEnemy.bg) latestBg = poolEnemy.bg;
            if (poolEnemy.image) latestImage = poolEnemy.image;
        }

        const bgImage = latestBg || 'Gemini_Generated_Image_446xcq446xcq446x.webp';

        // Update enemy zone UI
        document.getElementById('enemy-hp-overlay').innerText = state.enemy.hp;
        document.getElementById('enemy-attack-overlay').innerText = state.enemy.attack;
        document.getElementById('enemy-portrait').style.backgroundImage = `url('assets/${latestImage}')`;

        // Show malus if boss (skull icon + tooltip on hover via CSS)
        const malusInfo = document.getElementById('boss-malus-info');
        if (malusInfo) {
            if (currentNode.malus) {
                malusInfo.setAttribute('data-malus', currentNode.malus.description);
                malusInfo.classList.add('has-malus');
            } else {
                malusInfo.setAttribute('data-malus', '');
                malusInfo.classList.remove('has-malus');
            }
        }

        screenTransition(() => {
            // Apply background inside transition
            mainBg.style.backgroundImage = `url('assets/${bgImage}')`;
            mainBg.style.display = 'block';
            document.body.classList.remove('on-map');

            document.getElementById('map-screen').style.display = 'none';
            document.getElementById('grimoire-btn').style.display = '';
            gsap.set('#map-screen', { opacity: 1 });
            gsap.set('#game-container', { opacity: 1 });
            startNewFight();
        });
    } else if (currentNode.type === NODE_TYPES.SHOP) {
        screenTransition(() => {
            // Apply background inside transition
            mainBg.style.backgroundImage = `url('assets/shop-bg.png')`;
            mainBg.style.display = 'block';
            document.body.classList.remove('on-map');

            document.getElementById('map-screen').style.display = 'none';
            document.getElementById('grimoire-btn').style.display = '';
            gsap.set('#map-screen', { opacity: 1 });
            document.getElementById('sanctuary-screen').style.display = 'flex';
            document.getElementById('sanctuary-screen').style.opacity = '1';
            document.getElementById('sanctuary-gold-value').innerText = state.player.gold;
            generateShop();
        });
    } else if (currentNode.type === NODE_TYPES.DORTOIR) {
        screenTransition(() => {
            // Apply background inside transition
            mainBg.style.backgroundImage = `url('assets/dortoire-bg.png')`;
            mainBg.style.display = 'block';
            document.body.classList.remove('on-map');

            document.getElementById('map-screen').style.display = 'none';
            document.getElementById('grimoire-btn').style.display = '';
            gsap.set('#map-screen', { opacity: 1 });
            showDortoir();
        });
    }
}

function showDortoir() {
    const healAmount = Math.floor(state.player.maxHp * 0.3);
    const actualHeal = Math.min(healAmount, state.player.maxHp - state.player.hp);
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + healAmount);

    document.getElementById('dortoir-screen').style.display = 'flex';
    document.getElementById('dortoir-heal-value').innerText = `+${actualHeal} PV`;
    document.getElementById('dortoir-hp-after').innerText = `PV: ${state.player.hp}/${state.player.maxHp}`;

    // Update player HP bar
    document.getElementById('player-hp-text').innerText = `${state.player.hp}`;
    gsap.to("#player-hp-fill", { width: `${(state.player.hp / state.player.maxHp) * 100}%`, duration: 0.8 });

    gsap.fromTo('#dortoir-screen', { opacity: 0 }, { opacity: 1, duration: 0.8 });
}

async function continueFromDortoir() {
    if (state.isAnimating) return;
    state.isAnimating = true;
    const tl = gsap.timeline();
    tl.to("#dortoir-screen", { opacity: 0, duration: 0.6, ease: "power2.in" });
    tl.set("#dortoir-screen", { display: "none" });
    tl.add(() => {
        state.isAnimating = false;
        advanceToNextNode();
    });
}

function advanceToNextNode() {
    // Mark current column's selected node as completed
    const column = state.run.columns[state.run.currentColumnIndex];
    if (column.selectedNodeIndex !== null) {
        column.nodes[column.selectedNodeIndex].status = "completed";
    }
    // Mark unselected nodes as skipped
    column.nodes.forEach((node, i) => {
        if (i !== column.selectedNodeIndex) {
            node.status = "completed"; // visually dim them
        }
    });

    state.run.currentColumnIndex++;

    // Check if run is complete
    if (state.run.currentColumnIndex >= state.run.columns.length) {
        state.run.isComplete = true;
        showRunVictoryScreen();
        return;
    }

    // Mark next column's nodes as current
    const nextColumn = state.run.columns[state.run.currentColumnIndex];
    nextColumn.nodes.forEach(node => { node.status = "current"; });
    nextColumn.selectedNodeIndex = nextColumn.nodes.length === 1 ? 0 : null;

    showMap();
}

function showRunVictoryScreen() {
    clearSave();
    showEndOverlay(true);
    // Personaliser pour la victoire totale
    document.getElementById('game-over-title').innerText = "VICTOIRE TOTALE !";
    document.getElementById('game-over-message').innerText = "Vous avez complété le chemin du sorcier.";
}

// --- INITIALISATION ---
// --- SAVE SYSTEM ---
const SAVE_KEY = 'sorcererHand_save';

function saveGame() {
    const saveData = {
        version: 1,
        timestamp: Date.now(),
        difficulty: state.difficulty,
        player: {
            hp: state.player.hp,
            maxHp: state.player.maxHp,
            gold: state.player.gold,
            discards: state.player.discards,
            maxDiscards: state.player.maxDiscards,
            blessings: [...state.player.blessings]
        },
        run: {
            columns: state.run.columns.map(col => ({
                selectedNodeIndex: col.selectedNodeIndex,
                nodes: col.nodes.map(node => ({
                    type: node.type,
                    status: node.status,
                    tier: node.tier || undefined,
                    enemy: node.enemy ? { ...node.enemy } : undefined,
                    malus: node.malus ? { id: node.malus.id, description: node.malus.description } : undefined
                }))
            })),
            currentColumnIndex: state.run.currentColumnIndex,
            isComplete: state.run.isComplete,
            stats: { ...state.run.stats }
        },
        critChance: state.critChance,
        critBonus: state.critBonus
    };
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(saveData)); }
    catch (e) { console.warn('Save failed:', e); }
}

function loadGame() {
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return false;
        const s = JSON.parse(raw);

        state.difficulty = s.difficulty || "elite";
        state.player.hp = s.player.hp;
        state.player.maxHp = s.player.maxHp;
        state.player.gold = s.player.gold;
        state.player.discards = s.player.discards;
        state.player.maxDiscards = s.player.maxDiscards;
        state.player.blessings = s.player.blessings || [];
        state.run.currentColumnIndex = s.run.currentColumnIndex;
        state.run.isComplete = s.run.isComplete;
        state.run.stats = s.run.stats;
        if (s.critChance !== undefined) state.critChance = s.critChance;
        if (s.critBonus !== undefined) state.critBonus = s.critBonus;

        // Restore columns (re-attach malus.apply from BOSS_POOL)
        state.run.columns = s.run.columns.map(col => ({
            selectedNodeIndex: col.selectedNodeIndex,
            nodes: col.nodes.map(node => {
                const restored = { ...node };
                if (node.malus && node.malus.id) {
                    const boss = BOSS_POOL.find(b => b.malus.id === node.malus.id);
                    if (boss) restored.malus = { ...boss.malus };
                }
                return restored;
            })
        }));
        return true;
    } catch (e) {
        console.warn('Load failed:', e);
        clearSave();
        return false;
    }
}

function hasSavedGame() {
    try { return localStorage.getItem(SAVE_KEY) !== null; }
    catch (e) { return false; }
}

function clearSave() {
    try { localStorage.removeItem(SAVE_KEY); }
    catch (e) { console.warn('Clear save failed:', e); }
}

// --- SCREEN TRANSITION SYSTEM ---
/**
 * Premium curtain transition between screens.
 * @param {Function} duringCallback - Called when curtains are fully closed (swap screens here)
 * @param {Object} opts - Options { duration, color }
 * @returns {Promise} Resolves when transition is fully complete
 */
function screenTransition(duringCallback, opts = {}) {
    const duration = opts.duration || 0.5;

    // If already transitioning, just run the callback and return
    if (state.isTransitioning) {
        if (duringCallback) duringCallback();
        return Promise.resolve();
    }

    state.isTransitioning = true;
    const curtainL = document.querySelector('.transition-curtain-left');
    const curtainR = document.querySelector('.transition-curtain-right');
    const goldLine = document.querySelector('.transition-gold-line');

    return new Promise(resolve => {
        const tl = gsap.timeline({
            onComplete: () => {
                state.isTransitioning = false;
                resolve();
            }
        });

        // Phase 1: Curtains close from edges to center
        tl.set([curtainL, curtainR], { scaleX: 0 });
        tl.set(goldLine, { scaleY: 0 });

        tl.to(curtainL, {
            scaleX: 1, duration: duration, ease: "power3.inOut"
        }, 0);
        tl.to(curtainR, {
            scaleX: 1, duration: duration, ease: "power3.inOut"
        }, 0);

        // Gold line appears at the seam
        tl.to(goldLine, {
            scaleY: 1, duration: duration * 0.6, ease: "power2.out"
        }, duration * 0.5);

        // Phase 2: Execute callback while curtains are closed
        tl.add(() => {
            if (duringCallback) duringCallback();
        }, duration + 0.05);

        // Brief hold
        tl.add(() => { }, `+=${0.15}`);

        // Phase 3: Curtains open outward
        tl.to(goldLine, {
            scaleY: 0, duration: duration * 0.3, ease: "power2.in"
        });
        tl.to(curtainL, {
            scaleX: 0, duration: duration, ease: "power3.inOut"
        }, `-=${duration * 0.15}`);
        tl.to(curtainR, {
            scaleX: 0, duration: duration, ease: "power3.inOut"
        }, `<`);
    });
}

// --- TITLE PARTICLES ---
function spawnTitleParticles() {
    const container = document.getElementById('title-particles');
    if (!container) return;
    container.innerHTML = '';
    const count = 70;
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'magic-particle';
        const size = 3 + Math.random() * 6;
        p.style.width = size + 'px';
        p.style.height = size + 'px';
        p.style.left = Math.random() * 100 + '%';
        p.style.bottom = -(Math.random() * 20) + '%';
        p.style.setProperty('--drift', (Math.random() * 100 - 50) + 'px');
        p.style.animationDuration = (5 + Math.random() * 10) + 's';
        p.style.animationDelay = (Math.random() * 6) + 's';
        container.appendChild(p);
    }
}

// --- TITLE & DIFFICULTY SCREENS ---
function showTitleScreen() {
    // Hide everything
    document.getElementById('map-screen').style.display = 'none';
    document.getElementById('game-container').style.opacity = '0';
    document.getElementById('sanctuary-screen').style.display = 'none';
    document.getElementById('dortoir-screen').style.display = 'none';
    document.getElementById('game-over-overlay').style.display = 'none';
    document.getElementById('difficulty-screen').style.display = 'none';
    document.getElementById('player-stats').style.display = 'none';
    document.getElementById('grimoire-btn').style.display = 'none';
    document.getElementById('main-game-bg').style.display = 'none';
    document.getElementById('menu-btn').style.display = 'none';

    // Update texts
    const titleEl = document.getElementById('title-game-name');
    titleEl.innerText = t('ui.title_name');
    titleEl.setAttribute('data-text', t('ui.title_name'));
    document.getElementById('title-subtitle').innerText = t('ui.title_subtitle');

    // Preserve shine span inside primary button
    const newGameBtn = document.getElementById('btn-new-game');
    newGameBtn.innerHTML = '<span class="btn-shine"></span>' + t('ui.new_game');
    document.getElementById('btn-continue-game').innerText = t('ui.continue_game');

    // Enable/disable continue
    document.getElementById('btn-continue-game').disabled = !hasSavedGame();

    // Spawn particles
    spawnTitleParticles();

    // Show with cinematic GSAP sequence
    const ts = document.getElementById('title-screen');
    ts.style.display = 'flex';

    const tl = gsap.timeline();
    // Fade in the whole screen
    tl.fromTo(ts, { opacity: 0 }, { opacity: 1, duration: 1.2, ease: "power2.out" });
    // Ornaments expand from center
    tl.fromTo('.title-ornament', { width: 0, opacity: 0 }, {
        width: 300, opacity: 1, duration: 0.8, ease: "power3.out", stagger: 0.15
    }, "-=0.6");
    // Title rises in with scale
    tl.fromTo('#title-game-name', { y: -40, opacity: 0, scale: 0.9 }, {
        y: 0, opacity: 1, scale: 1, duration: 1.2, ease: "back.out(1.2)"
    }, "-=0.5");
    // Subtitle fades in
    tl.fromTo('#title-subtitle', { opacity: 0, y: 15 }, {
        opacity: 1, y: 0, duration: 1, ease: "power2.out"
    }, "-=0.6");
    // Buttons slide up
    tl.fromTo('#title-buttons', { y: 40, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.8, ease: "power2.out"
    }, "-=0.4");
    // Language switcher
    tl.fromTo('#language-switcher', { opacity: 0, y: -10 }, {
        opacity: 1, y: 0, duration: 0.5, ease: "power2.out"
    }, "-=0.4");
}

function spawnDiffParticles() {
    const container = document.getElementById('diff-particles');
    if (!container) return;
    container.innerHTML = '';
    const count = 50;
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'magic-particle';
        const size = 3 + Math.random() * 5;
        p.style.width = size + 'px';
        p.style.height = size + 'px';
        p.style.left = Math.random() * 100 + '%';
        p.style.bottom = -(Math.random() * 20) + '%';
        p.style.setProperty('--drift', (Math.random() * 80 - 40) + 'px');
        p.style.animationDuration = (5 + Math.random() * 10) + 's';
        p.style.animationDelay = (Math.random() * 6) + 's';
        container.appendChild(p);
    }
}

function showDifficultyScreen() {
    // Kill any running title screen animations to prevent conflicts
    gsap.killTweensOf('#title-screen');
    gsap.killTweensOf('#title-game-name');
    gsap.killTweensOf('#title-subtitle');
    gsap.killTweensOf('#title-buttons');
    gsap.killTweensOf('#language-switcher');
    gsap.killTweensOf('.title-ornament');

    screenTransition(() => {
        // --- Hide title, prepare difficulty ---
        document.getElementById('title-screen').style.display = 'none';
        gsap.set('#title-screen', { opacity: 1 });

        // Update texts
        document.getElementById('difficulty-title').innerText = t('ui.select_difficulty');
        document.getElementById('diff-name-apprenti').innerText = t('ui.difficulty_apprenti');
        document.getElementById('diff-name-elite').innerText = t('ui.difficulty_elite');
        document.getElementById('diff-name-arcanes').innerText = t('ui.difficulty_arcanes');
        document.getElementById('diff-desc-apprenti').innerText = t('ui.desc_apprenti');
        document.getElementById('diff-desc-elite').innerText = t('ui.desc_elite');
        document.getElementById('diff-desc-arcanes').innerText = t('ui.desc_arcanes');

        spawnDiffParticles();

        const ds = document.getElementById('difficulty-screen');
        // Reset children to hidden state
        gsap.set('.diff-ornament-top', { width: 0, opacity: 0 });
        gsap.set('#difficulty-title', { y: -20, opacity: 0 });
        gsap.set('#difficulty-subtitle', { opacity: 0 });
        gsap.set('.difficulty-card', { y: 60, opacity: 0, scale: 0.85 });

        ds.style.opacity = '1';
        ds.style.display = 'flex';
    }).then(() => {
        // Staggered entrance of difficulty elements AFTER curtains open
        const tl = gsap.timeline();
        tl.to('.diff-ornament-top', {
            width: 400, opacity: 1, duration: 0.6, ease: "power3.out"
        });
        tl.to('#difficulty-title', {
            y: 0, opacity: 1, duration: 0.7, ease: "power2.out"
        }, "-=0.4");
        tl.to('#difficulty-subtitle', {
            opacity: 0.7, duration: 0.5, ease: "power2.out"
        }, "-=0.4");
        tl.to('.difficulty-card', {
            y: 0, opacity: 1, scale: 1, duration: 0.7, stagger: 0.15, ease: "back.out(1.4)"
        }, "-=0.3");
    });
}


function showQuitConfirm() {
    const overlay = document.getElementById('quit-confirm-overlay');
    document.getElementById('quit-confirm-text').innerText = t('ui.quit_confirm');
    document.getElementById('btn-quit-yes').innerText = t('ui.quit_yes');
    document.getElementById('btn-quit-no').innerText = t('ui.quit_no');
    overlay.style.display = 'flex';
    gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.3 });
    gsap.fromTo('#quit-confirm-box', { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.5)" });
}

function hideQuitConfirm() {
    const overlay = document.getElementById('quit-confirm-overlay');
    gsap.to(overlay, { opacity: 0, duration: 0.25, onComplete: () => overlay.style.display = 'none' });
}

function quitToTitle() {
    const overlay = document.getElementById('quit-confirm-overlay');
    overlay.style.display = 'none';

    // Save current game progress before quitting
    saveGame();

    // Hide everything
    document.getElementById('game-container').style.opacity = '0';
    document.getElementById('map-screen').style.display = 'none';
    document.getElementById('sanctuary-screen').style.display = 'none';
    document.getElementById('dortoir-screen').style.display = 'none';
    document.getElementById('game-over-overlay').style.display = 'none';

    showTitleScreen();
}

function startNewGame(difficultyKey) {
    const preset = DIFFICULTY_PRESETS[difficultyKey] || DIFFICULTY_PRESETS.elite;
    state.difficulty = difficultyKey;

    screenTransition(() => {
        document.getElementById('difficulty-screen').style.display = 'none';
        gsap.set('#difficulty-screen', { opacity: 1 });

        // Show HUD
        document.getElementById('player-stats').style.display = '';
        document.getElementById('grimoire-btn').style.display = '';
        document.getElementById('menu-btn').style.display = '';

        // Apply difficulty preset
        state.player.hp = preset.hp;
        state.player.maxHp = preset.hp;
        state.player.gold = 0;
        state.player.discards = preset.discards;
        state.player.maxDiscards = preset.discards;
        state.player.blessings = [];
        state.critChance = preset.critChance;
        state.critBonus = 0.25;
        state.criticalCardIds = new Set();

        clearSave();
        generateRun();
        updateUI();
        showMap();
    });
}

function continueGame() {
    if (!hasSavedGame()) return;

    // Kill title animations
    gsap.killTweensOf('#title-screen');
    gsap.killTweensOf('#title-game-name');
    gsap.killTweensOf('#title-subtitle');
    gsap.killTweensOf('#title-buttons');
    gsap.killTweensOf('#language-switcher');
    gsap.killTweensOf('.title-ornament');

    screenTransition(() => {
        document.getElementById('title-screen').style.display = 'none';
        gsap.set('#title-screen', { opacity: 1 });

        document.getElementById('player-stats').style.display = '';
        document.getElementById('grimoire-btn').style.display = '';
        document.getElementById('menu-btn').style.display = '';
        if (loadGame()) {
            updateUI();
            showMap();
        } else {
            showTitleScreen();
        }
    });
}

function initGame() {
    console.log("Démarrage du jeu de sorciers...");
    // 1. Event Listeners - Combat
    document.getElementById('btn-play').addEventListener('click', () => !state.isAnimating && executeTurn());
    document.getElementById('btn-discard').addEventListener('click', () => !state.isAnimating && discardAction());
    document.getElementById('btn-continue').addEventListener('click', () => continueFromShop());

    // Lexique
    document.getElementById('grimoire-btn').addEventListener('click', openGuide);
    document.getElementById('btn-close-guide').addEventListener('click', closeGuide);

    // Map & Dortoir
    document.getElementById('btn-enter-node').addEventListener('click', () => enterCurrentNode());
    document.getElementById('btn-dortoir-continue').addEventListener('click', () => continueFromDortoir());
    document.getElementById('btn-victory-continue').addEventListener('click', () => continueFromVictory());

    // Title & Difficulty
    document.getElementById('btn-new-game').addEventListener('click', () => showDifficultyScreen());
    document.getElementById('btn-continue-game').addEventListener('click', () => continueGame());
    document.querySelectorAll('.difficulty-card').forEach(card => {
        card.addEventListener('click', () => startNewGame(card.dataset.difficulty));
    });

    // Menu (quit to title)
    document.getElementById('menu-btn').addEventListener('click', () => showQuitConfirm());
    document.getElementById('btn-quit-yes').addEventListener('click', () => quitToTitle());
    document.getElementById('btn-quit-no').addEventListener('click', () => hideQuitConfirm());

    // 2. Setup UI and show correct screen
    updateLocalizedUI();
    initComboModal();

    if (DEV_MODE) {
        console.log("Mode DEV : Démarrage rapide...");
        // Simule le choix de difficulté "elite" par défaut ou continue la partie
        if (hasSavedGame()) {
            // Option 1 : Toujours charger la sauvegarde en mode dev
            // On le fait sans transition pour être plus rapide
            document.getElementById('title-screen').style.display = 'none';
            document.getElementById('player-stats').style.display = '';
            document.getElementById('grimoire-btn').style.display = '';
            document.getElementById('menu-btn').style.display = '';
            document.getElementById('main-game-bg').style.display = 'block';
            if (loadGame()) {
                updateUI();
                showMap();
            } else {
                startNewGame("elite");
            }
        } else {
            // Option 2 : Nouvelle partie directe si pas de sauvegarde
            document.getElementById('title-screen').style.display = 'none';
            document.getElementById('difficulty-screen').style.display = 'none';
            document.getElementById('player-stats').style.display = '';
            document.getElementById('grimoire-btn').style.display = '';
            document.getElementById('menu-btn').style.display = '';
            document.getElementById('main-game-bg').style.display = 'block';
            startNewGame("elite");
        }
    } else {
        showTitleScreen();
    }
}

function updateLocalizedUI() {
    document.title = t('ui.title');
    const labelGalleons = document.getElementById('label-galleons');
    if (labelGalleons) labelGalleons.innerText = t('ui.galleons');
    const labelHp = document.getElementById('label-hp');
    if (labelHp) labelHp.innerText = t('ui.wizard_hp');

    document.getElementById('btn-play').innerText = t('ui.cast_spell');
    document.getElementById('btn-discard').innerText = t('ui.discard');
    document.getElementById('grimoire-title').innerText = t('ui.grimoire_title');
    document.getElementById('btn-restart').innerText = t('ui.new_adventure');
    document.getElementById('sanctuary-title').innerText = t('ui.sanctuary_title');
    document.getElementById('sanctuary-gold-label').innerText = t('ui.galleons');
    document.getElementById('btn-continue').innerText = t('ui.continue_adventure');
    document.getElementById('victory-title').innerText = t('ui.victory');
    document.getElementById('btn-victory-continue').innerText = t('ui.continue_game');

    // Title & Difficulty screen texts
    const tn = document.getElementById('title-game-name');
    if (tn) tn.innerText = t('ui.title_name');
    const ts = document.getElementById('title-subtitle');
    if (ts) ts.innerText = t('ui.title_subtitle');
    const bng = document.getElementById('btn-new-game');
    if (bng) bng.innerText = t('ui.new_game');
    const bcg = document.getElementById('btn-continue-game');
    if (bcg) bcg.innerText = t('ui.continue_game');
    const dt = document.getElementById('difficulty-title');
    if (dt) dt.innerText = t('ui.select_difficulty');

    updateUI();
    highlightLanguageButtons();
    initComboModal(); // Re-génère le lexique
}

function highlightLanguageButtons() {
    const buttons = document.querySelectorAll('#language-switcher button');
    buttons.forEach(btn => {
        // Extraire la langue de l'attribut onclick ou simplement comparer le texte si pertinent
        // Mais plus robuste d'extraire de changeLanguage('xx')
        const onclick = btn.getAttribute('onclick');
        if (onclick && onclick.includes(`'${currentLang}'`)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

/**
 * Fonction globale pour changer la langue
 */
function changeLanguage(lang) {
    setLanguage(lang);
    updateLocalizedUI();
}

/**
 * Redémarrage complet d'un combat.
 */
async function startNewFight() {
    state.isAnimating = true;

    // Reset combat state only (NOT player HP, enemy is already set by enterCurrentNode)
    state.player.discards = state.player.maxDiscards;
    state.selectedIndices = [];
    state.hand = [];
    state.criticalCardIds = new Set();

    // Nouveau deck
    state.deck = generateDeck();
    shuffle(state.deck);

    // UI Reset
    document.getElementById('hand-container').innerHTML = '';
    document.getElementById('combo-name').innerText = "—";

    // Entrée dramatique du monstre
    animateBossEntrance();

    // Tirage main initiale
    for (let i = 0; i < 8; i++) {
        if (state.deck.length > 0) {
            const card = state.deck.pop();
            state.hand.push(card);
            rollCritForCard(card);
        }
    }
    sortHand();

    updateUI();
    await syncHandDOM(true);
    updateCriticalCardVisual();

    state.isAnimating = false;
}

/**
 * Synchronisation du DOM (GSAP)
 */
async function syncHandDOM(animateAll = false) {
    const handContainer = document.getElementById('hand-container');
    const existingElements = Array.from(handContainer.children);

    // 1. Cleanup obsolètes
    existingElements.forEach(el => {
        const id = parseInt(el.dataset.id);
        if (!state.hand.some(c => c.id === id)) el.remove();
    });

    // 2. Ajout / MaJ
    const cardsToAnimate = [];
    state.hand.forEach((card, newIndex) => {
        let el = handContainer.querySelector(`[data-id="${card.id}"]`);
        if (!el) {
            el = createCardElement(card, newIndex);
            el.style.opacity = 0;
            handContainer.appendChild(el);
            cardsToAnimate.push(el);
        } else {
            el.dataset.index = newIndex;
            // Assure l'ordre correct dans le DOM
            handContainer.appendChild(el);
            if (animateAll) {
                el.style.opacity = 0;
                cardsToAnimate.push(el);
            }
        }
    });

    if (cardsToAnimate.length > 0) {
        await gsap.fromTo(cardsToAnimate,
            { y: 100, opacity: 0, scale: 0.8 },
            { y: 0, opacity: 1, scale: 1, duration: 0.5, stagger: 0.08, ease: "back.out(1.5)" }
        );
    }
}

function createCardElement(card, index) {
    const wrapper = document.createElement('div');
    wrapper.className = 'card-wrapper';
    wrapper.dataset.index = index;
    wrapper.dataset.id = card.id;

    // Nom du fichier : card_SUIT_RANK.webp
    // Note: Pour l'instant on n'a que Gryffindor 2-11, Slytherin 12, Ravenclaw 13, Hufflepuff 14.
    const cardImagePath = `assets/card_${card.suit}_${card.rank}.webp`;

    wrapper.innerHTML = `
        <div class="card-container ${card.suit} ${state.selectedIndices.includes(index) ? 'selected' : ''}">
            <div class="card-layer full-image" style="background-image: url('${cardImagePath}');"></div>
        </div>
    `;

    const container = wrapper.querySelector('.card-container');
    const fullImage = wrapper.querySelector('.full-image');

    // --- CARTE FIXE (STABILISÉE) ---
    wrapper.addEventListener('mouseleave', () => {
        const isSelected = state.selectedIndices.includes(parseInt(wrapper.dataset.index));
        // Reset des couches à 0 (position fixe)
        gsap.to([container, fullImage], { x: 0, y: 0, duration: 0.3 });
        gsap.to(wrapper, { y: isSelected ? -30 : 0, scale: 1, duration: 0.3 });
    });

    wrapper.addEventListener('mouseenter', () => {
        if (state.isAnimating) return;
        const isSelected = state.selectedIndices.includes(parseInt(wrapper.dataset.index));
        gsap.to(wrapper, { y: isSelected ? -45 : -20, scale: 1.05, duration: 0.3 });
    });

    wrapper.addEventListener('click', () => !state.isAnimating && toggleSelectionGSAP(wrapper));

    return wrapper;
}

function toggleSelectionGSAP(wrapper) {
    const index = parseInt(wrapper.dataset.index);
    const container = wrapper.querySelector('.card-container');
    const idx = state.selectedIndices.indexOf(index);

    if (idx === -1) {
        if (state.selectedIndices.length < 5) {
            state.selectedIndices.push(index);
            container.classList.add('selected');
            gsap.fromTo(wrapper, { scale: 1.05 }, {
                scale: 1.15, duration: 0.15, y: -45, ease: "power2.out", onComplete: () => {
                    gsap.to(wrapper, { scale: 1.05, duration: 0.2 });
                }
            });
        }
    } else {
        state.selectedIndices.splice(idx, 1);
        container.classList.remove('selected');
        gsap.to(wrapper, { y: 0, scale: 1, duration: 0.2 });
    }
    updateUI();
}

const blessingIcons = {
    grace: "🪄",
    multiplication: "💎",
    eau_vive: "🧪",
    cape_invisibilite: "🧥",
    retourneur_temps: "⏳",
    carte_maraudeur: "📜",
    vif_or: "✨",
    choixpeau: "🧙"
};

function updateUI() {
    document.getElementById('gold-value').innerText = state.player.gold;
    document.getElementById('discards-value').innerText = state.player.discards;

    const anyS = state.selectedIndices.length > 0;
    document.getElementById('btn-play').disabled = !anyS || state.isAnimating;
    document.getElementById('btn-discard').disabled = !anyS || state.player.discards <= 0 || state.isAnimating;

    document.getElementById('player-hp-text').innerText = `${state.player.hp}`;
    document.getElementById('crit-value').innerText = `${Math.round(state.critChance * 100)}%`;

    // Mise à jour des artefacts dans le HUD
    const artifactsHud = document.getElementById('player-artifacts-hud');
    if (artifactsHud) {
        artifactsHud.innerHTML = '';
        state.player.blessings.forEach(bid => {
            const icon = blessingIcons[bid] || "🏺";
            const name = t(`blessings.${bid}.name`);
            const desc = t(`blessings.${bid}.desc`);

            const artEl = document.createElement('div');
            artEl.className = 'artifact-icon';
            artEl.innerHTML = `
                ${icon}
                <div class="artifact-tooltip">
                    <span class="artifact-tooltip-name">${name}</span>
                    <span class="artifact-tooltip-desc">${desc}</span>
                </div>
            `;
            artifactsHud.appendChild(artEl);
        });
    }

    // Nouveaux overlays dynamiques sur la carte boss (Corners only)
    if (state.enemy) {
        document.getElementById('enemy-hp-overlay').innerText = state.enemy.hp;
        document.getElementById('enemy-attack-overlay').innerText = state.enemy.attack;
    }

    updateComboDisplay();
}

function updateComboDisplay() {
    const el = document.getElementById('combo-name');
    const handContainer = document.getElementById('hand-container');

    // Nettoyer les indicateurs visuels précédents
    handContainer.querySelectorAll('.card-wrapper').forEach(w => {
        // noop — plus de will-burn
    });

    if (state.selectedIndices.length === 0) { el.innerText = "—"; return; }
    const activeCards = state.selectedIndices.map(i => state.hand[i]).filter(c => c);

    // Apply boss malus if active
    let cardsForEval = activeCards;
    if (state.run.columns.length > 0) {
        const currentColumn = state.run.columns[state.run.currentColumnIndex];
        if (currentColumn && currentColumn.selectedNodeIndex !== null) {
            const currentNode = currentColumn.nodes[currentColumn.selectedNodeIndex];
            if (currentNode && currentNode.malus) {
                cardsForEval = activeCards.map(card => ({
                    ...card,
                    baseDamage: currentNode.malus.apply(card)
                }));
            }
        }
    }
    const res = evaluateHand(cardsForEval, state.player.blessings);
    const comboOnlyDamage = res.baseCombo;
    el.innerHTML = `
        <div id="combo-damage-value" style="font-size: 4.5rem; color: #fff; font-weight: bold; line-height: 1; text-shadow: 0 0 15px rgba(255,255,255,0.4);">${comboOnlyDamage}</div>
        <div style="font-size: 1.2rem; color: #fff; opacity: 0.9; text-transform: uppercase; letter-spacing: 4px; font-family: 'Cinzel', serif; margin-top: 5px;">${res.comboName}</div>
    `;

    // Les cartes hors-combo ne sont plus grisées à l'avance — la brûlure est une surprise
}

async function executeTurn() {
    if (state.selectedIndices.length === 0 || state.isAnimating) return;
    state.isAnimating = true;
    updateUI();

    const activeCards = state.selectedIndices.map(i => state.hand[i]).filter(c => c);

    // Apply boss malus if active
    const currentColumn = state.run.columns[state.run.currentColumnIndex];
    const currentNode = currentColumn.nodes[currentColumn.selectedNodeIndex];
    let cardsForEval = activeCards;
    if (currentNode && currentNode.malus) {
        cardsForEval = activeCards.map(card => ({
            ...card,
            baseDamage: currentNode.malus.apply(card)
        }));
    }
    const result = evaluateHand(cardsForEval, state.player.blessings);

    // Critical hit check — seulement si la carte critique fait partie du combo
    const comboCards = activeCards.filter(card => result.comboCardIds.has(card.id));
    const hasCrit = comboCards.some(card => state.criticalCardIds.has(card.id));
    const finalDamage = hasCrit ? Math.floor(result.damage * (1 + state.critBonus)) : result.damage;

    // Track damage stat
    state.run.stats.totalDamageDealt += finalDamage;

    const handContainer = document.getElementById('hand-container');
    const selectedWrappers = state.selectedIndices.map(idx => handContainer.querySelector(`[data-index="${idx}"]`)).filter(el => el);

    // Remove static critical indicators during attack for cleaner visuals
    selectedWrappers.forEach(w => {
        const critInd = w.querySelector('.crit-indicator');
        if (critInd) critInd.remove();
    });

    // Dégâts immédiats visuels
    const targetHP = Math.max(0, state.enemy.hp - finalDamage);

    // --- PHASE 0: Séparer cartes combo et cartes à brûler ---
    const comboCardIds = result.comboCardIds;
    const comboWrappers = [];
    const burnWrappers = [];
    selectedWrappers.forEach((w, i) => {
        const card = activeCards[i];
        if (card && comboCardIds.has(card.id)) comboWrappers.push(w);
        else burnWrappers.push(w);
    });

    const comboOnlyDamage = result.baseCombo;

    // Scoring glow sur les cartes combo uniquement
    comboWrappers.forEach(w => {
        const c = w.querySelector('.card-container');
        if (c) c.classList.add('card-scoring');
    });

    // Create "+X" value labels sur les cartes COMBO uniquement
    const valueLabels = [];
    cardsForEval.forEach((card, i) => {
        const wrapper = selectedWrappers[i];
        if (!wrapper || card.baseDamage <= 0) return;
        // Seulement les cartes combo ont un label "+X"
        if (!comboCardIds.has(card.id)) return;
        const label = document.createElement('div');
        label.className = 'card-value-popup';
        label.innerText = `+${card.baseDamage}`;
        wrapper.appendChild(label);
        valueLabels.push(label);
    });

    if (valueLabels.length > 0) {
        await gsap.fromTo(valueLabels,
            { y: 10, opacity: 0, scale: 0.3 },
            { y: -15, opacity: 1, scale: 1, duration: 0.5, stagger: 0.12, ease: "back.out(2.5)" }
        );

        const damageEl = document.getElementById('combo-damage-value');
        if (damageEl) {
            const obj = { val: comboOnlyDamage };
            gsap.to(damageEl, { color: '#ff4d4d', textShadow: '0 0 20px rgba(255,77,77,0.6), 0 0 40px rgba(255,77,77,0.3)', duration: 0.3 });
            await gsap.to(obj, {
                val: result.damage,
                duration: 0.8,
                ease: "power2.out",
                onUpdate: () => { damageEl.innerText = Math.floor(obj.val); }
            });
            gsap.fromTo(damageEl, { scale: 1.3 }, { scale: 1, duration: 0.3, ease: "back.out(2)" });
        }

        await new Promise(r => setTimeout(r, 400));
    }

    // --- PHASE 0.5: Brûler les cartes hors-combo (Désagrégation) ---
    if (burnWrappers.length > 0) {
        const burnContainers = burnWrappers.map(w => w.querySelector('.card-container')).filter(Boolean);
        const burnTl = gsap.timeline();

        // 1. Embrasement immédiat
        burnTl.to(burnContainers, {
            filter: 'url(#burn-filter) brightness(2.5) sepia(0.8) saturate(3) hue-rotate(-20deg)',
            boxShadow: '0 0 40px 15px rgba(255, 80, 0, 0.8), 0 0 80px 30px rgba(255, 40, 0, 0.4)',
            borderColor: '#ff4400',
            scale: 1.08,
            duration: 0.4,
            stagger: 0.1,
            ease: "power2.out"
        });

        // 2. Désagrégation (Distorsion + Flou + Dispersion)
        // On anime les attributs de l'SVG filter via GSAP
        const dispMap = document.getElementById('burn-displacement');
        const matrix = document.getElementById('burn-matrix');

        burnTl.to(dispMap, {
            attr: { scale: 100 },
            duration: 0.8,
            ease: "power1.in"
        }, "-=0.2");

        burnTl.to(burnContainers, {
            opacity: 0,
            y: -100, // Les cendres montent
            x: () => -50 + Math.random() * 100,
            rotation: () => -20 + Math.random() * 40,
            blur: 15,
            scale: 1.2,
            duration: 0.8,
            stagger: 0.1,
            ease: "power1.in"
        }, "-=0.8");

        await burnTl;

        // Reset filter attributes for next use
        gsap.set(dispMap, { attr: { scale: 0 } });

        // Cacher proprement
        burnWrappers.forEach(w => {
            w.style.visibility = 'hidden';
            w.style.pointerEvents = 'none';
        });
        await new Promise(r => setTimeout(r, 150));
    }

    // --- PHASE 0b: Critical bonus animation ---
    if (hasCrit) {
        const critCard = activeCards.find(c => state.criticalCardIds.has(c.id));
        const critWrapper = critCard ? handContainer.querySelector(`[data-id="${critCard.id}"]`) : null;
        if (critWrapper) {
            const critLabel = document.createElement('div');
            critLabel.className = 'crit-popup';
            critLabel.innerText = 'CRITICAL';
            critWrapper.appendChild(critLabel);

            await gsap.fromTo(critLabel,
                { y: -30, opacity: 0, scale: 0.3 },
                { y: -60, opacity: 1, scale: 1.2, duration: 0.5, ease: "back.out(3)" }
            );

            const damageEl = document.getElementById('combo-damage-value');
            if (damageEl) {
                gsap.to(damageEl, { color: '#ffffff', textShadow: '0 0 20px rgba(255,0,255,0.6), 0 0 40px rgba(0,242,254,0.4)', duration: 0.3 });
                const obj2 = { val: result.damage };
                await gsap.to(obj2, {
                    val: finalDamage,
                    duration: 0.5,
                    ease: "power2.out",
                    onUpdate: () => { damageEl.innerText = Math.floor(obj2.val); }
                });
                gsap.fromTo(damageEl, { scale: 1.4 }, { scale: 1, duration: 0.3, ease: "back.out(2)" });
            }

            // Faire disparaître le texte CRITICAL après l'explication du bonus
            gsap.to(critLabel, { opacity: 0, y: -90, duration: 0.4, delay: 0.2, onComplete: () => critLabel.remove() });

            await new Promise(r => setTimeout(r, 300));
        }
    }

    // Timeline Attaque Joueur — seules les cartes COMBO volent vers l'ennemi
    const tl1 = gsap.timeline();
    // 1. Soulèvement des cartes combo
    tl1.to(comboWrappers, { y: -150, x: (i) => (i - (comboWrappers.length - 1) / 2) * 20, scale: 1.3, duration: 0.6, stagger: 0.05, ease: "power3.out" });

    // 2. Vol vers l'ennemi (Lancement)
    tl1.to(comboWrappers, { y: -500, opacity: 0, duration: 0.4, stagger: 0.03, ease: "power4.in" });

    // 3. Impact (Dégâts visuels synchronisés avec le vol)
    tl1.add(() => {
        animateCounter('enemy-hp-overlay', state.enemy.hp, targetHP, 0.8);
        gsap.to("#hp-bar-fill", { width: `${(targetHP / state.enemy.maxHp) * 100}%`, duration: 0.8, ease: "power2.out" });
        animateDamageText(finalDamage, "#enemy-zone");
        screenShake("#enemy-zone");

        // Nouvel Effet: Flash Rouge & Recul du Monstre
        const boss = document.getElementById('boss-card');
        const flash = document.querySelector('.flash-red');
        boss.classList.remove('enemy-recoil');
        void boss.offsetWidth; // Trigger reflow
        boss.classList.add('enemy-recoil');

        gsap.fromTo(flash, { opacity: 1 }, { opacity: 0, duration: 0.6 });

        // Nettoyage après l'anim
        setTimeout(() => boss.classList.remove('enemy-recoil'), 600);
    });

    await tl1;

    state.enemy.hp = targetHP;

    if (state.enemy.hp <= 0) {
        await victorySequence();
        return;
    }

    await new Promise(r => setTimeout(r, 600));

    // Attaque Ennemi PREMIUM
    const tl2 = gsap.timeline();
    const boss = document.getElementById('boss-card');
    const vignette = document.querySelector('.screen-blood-vignette');
    const gameContainer = document.getElementById('game-container');

    // 1. Le Boss charge l'attaque (Lunge Animation)
    tl2.add(() => {
        boss.classList.add('enemy-attack-lunge');
    });

    // 2. Moment de l'Impact (Au milieu de l'animation de lunge)
    tl2.add(() => {
        state.player.hp = Math.max(0, state.player.hp - state.enemy.attack);

        // Mise à jour HP avec petit éclat rouge
        document.getElementById('player-hp-text').innerText = `${state.player.hp}`;
        gsap.fromTo(['#player-hp-text', '.icon-hp-simple'],
            { color: '#ff4d4d', scale: 1.5, textShadow: '0 0 20px #ff0000' },
            { color: '#ffffff', scale: 1, textShadow: '2px 2px 5px rgba(0,0,0,0.9), 0 0 15px rgba(0,0,0,0.7)', duration: 0.6, ease: "power2.out" }
        );

        // Effets visuels d'impact (Vignette & Secousse)
        gsap.fromTo(vignette, { opacity: 0 }, { opacity: 1, duration: 0.1, yoyo: true, repeat: 1 });

        gsap.to(gameContainer, {
            x: 20,
            duration: 0.05,
            repeat: 7,
            yoyo: true,
            onComplete: () => gsap.set(gameContainer, { x: 0, y: 0 })
        });

        // Dégâts sur le joueur
        animateDamageText(state.enemy.attack, "#player-zone");
    }, "+=0.36");

    // 3. Nettoyage
    tl2.add(() => {
        boss.classList.remove('enemy-attack-lunge');
    }, "+=0.3");

    await tl2;

    if (state.player.hp <= 0) { clearSave(); showEndOverlay(false); state.isAnimating = false; return; }

    state.selectedIndices.sort((a, b) => b - a).forEach(i => {
        state.criticalCardIds.delete(state.hand[i].id);
        state.hand.splice(i, 1);
    });
    state.selectedIndices = [];
    while (state.hand.length < 8 && state.deck.length > 0) {
        const card = state.deck.pop();
        state.hand.push(card);
        rollCritForCard(card);
    }
    sortHand();
    await syncHandDOM(false);
    updateCriticalCardVisual();
    state.isAnimating = false;
    updateUI();
}

// --- EXPLOSION CARTE BOIS ENNEMI ---
// --- EXPLOSION CARTE BOIS ENNEMI PREMIUM ---
async function animateBossExplosion() {
    const bossCard = document.getElementById('boss-card');
    if (!bossCard) return;

    const rect = bossCard.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const explosionContainer = document.createElement('div');
    explosionContainer.className = 'explosion-container';
    document.body.appendChild(explosionContainer);

    // --- Phase 1: Accumulation (The "Hold") ---
    const tl = gsap.timeline();
    tl.to(bossCard, { x: 15, duration: 0.02, repeat: 15, yoyo: true, ease: "none" });
    tl.to(bossCard, {
        filter: 'brightness(8) saturate(0)',
        scale: 1.15,
        duration: 0.3,
        ease: "power4.in"
    }, 0.1);

    await tl;

    // --- Phase 2: L'IMPACT (The "Snap") ---
    gsap.set(bossCard, { visibility: 'hidden', filter: 'none' });

    // Flash Blanc Aveuglant progressif
    const globalLight = document.createElement('div');
    globalLight.className = 'explosion-light';
    document.body.appendChild(globalLight);
    gsap.to(globalLight, {
        opacity: 1, duration: 0.05, onComplete: () => {
            gsap.to(globalLight, { opacity: 0, duration: 0.8, ease: "power2.out", onComplete: () => globalLight.remove() });
        }
    });

    // Shockwaves multi-couches
    [800, 1200, 1600].forEach((size, i) => {
        const sw = document.createElement('div');
        sw.className = 'explosion-shockwave';
        sw.style.cssText = `left: ${centerX}px; top: ${centerY}px; width: 40px; height: 40px; opacity: 0.8;`;
        explosionContainer.appendChild(sw);
        gsap.to(sw, {
            width: size, height: size,
            opacity: 0,
            duration: 0.6 + i * 0.2,
            ease: "power3.out",
            delay: i * 0.05
        });
    });

    const elements = [];
    const woodColors = [['#8B6914', '#5C4033'], ['#A0522D', '#3E2723'], ['#6B4226', '#1A0F0A']];

    // 1. Débris de bois texturés
    for (let i = 0; i < 40; i++) {
        const frag = document.createElement('div');
        frag.className = 'wood-fragment';
        const w = 10 + Math.random() * 40;
        const h = 5 + Math.random() * 30;
        const colors = woodColors[Math.floor(Math.random() * woodColors.length)];
        const startX = rect.left + Math.random() * rect.width;
        const startY = rect.top + Math.random() * rect.height;

        frag.style.cssText = `
            width: ${w}px; height: ${h}px;
            left: ${startX}px; top: ${startY}px;
            background: linear-gradient(${Math.random() * 360}deg, ${colors[0]}, ${colors[1]});
            clip-path: polygon(${Math.random() * 30}% 0%, 100% ${Math.random() * 30}%, ${70 + Math.random() * 30}% 100%, 0% ${70 + Math.random() * 30}%);
        `;
        explosionContainer.appendChild(frag);
        elements.push({ el: frag, x: startX, y: startY, type: 'wood' });
    }

    // 2. Étincelles de haute vélocité
    for (let i = 0; i < 60; i++) {
        const spark = document.createElement('div');
        spark.className = 'spark';
        spark.style.left = centerX + 'px';
        spark.style.top = centerY + 'px';
        explosionContainer.appendChild(spark);
        elements.push({ el: spark, x: centerX, y: centerY, type: 'spark' });
    }

    // 3. Fumée volumétrique (Dust)
    for (let i = 0; i < 20; i++) {
        const dust = document.createElement('div');
        dust.className = 'explosion-dust';
        dust.style.cssText = `left: ${centerX}px; top: ${centerY}px;`;
        explosionContainer.appendChild(dust);
        elements.push({ el: dust, type: 'smoke' });
    }

    // --- Phase 3: Physics & Motion ---
    const mainTl = gsap.timeline();

    // Flash central
    const centralFlash = document.createElement('div');
    centralFlash.className = 'explosion-flash';
    centralFlash.style.cssText = `left: ${centerX}px; top: ${centerY}px;`;
    explosionContainer.appendChild(centralFlash);
    mainTl.fromTo(centralFlash, { scale: 0, opacity: 1 }, { scale: 8, opacity: 0, duration: 0.8, ease: "power4.out" }, 0);

    // Camera Shake
    mainTl.to("#game-container", {
        x: 25, y: 15, duration: 0.04, repeat: 12, yoyo: true,
        ease: "none",
        onComplete: () => gsap.set("#game-container", { x: 0, y: 0 })
    }, 0);

    // Éjection
    elements.forEach((obj) => {
        if (obj.type === 'smoke') {
            const angle = Math.random() * Math.PI * 2;
            const dist = 100 + Math.random() * 250;
            mainTl.to(obj.el, {
                x: Math.cos(angle) * dist,
                y: Math.sin(angle) * dist - 100,
                scale: 5 + Math.random() * 5,
                opacity: 0,
                duration: 1 + Math.random() * 0.5,
                ease: "power2.out"
            }, 0.02);
            return;
        }

        const angle = obj.type === 'spark' ? Math.random() * Math.PI * 2 : Math.atan2(obj.y - centerY, obj.x - centerX) + (Math.random() - 0.5);
        const force = obj.type === 'spark' ? 500 + Math.random() * 1000 : 300 + Math.random() * 600;
        const duration = obj.type === 'spark' ? 0.3 + Math.random() * 0.4 : 0.8 + Math.random() * 0.5;

        mainTl.to(obj.el, {
            x: Math.cos(angle) * force,
            y: Math.sin(angle) * force + (obj.type === 'wood' ? 400 : 0), // Gravité pour le bois uniquement
            rotation: (Math.random() - 0.5) * 2000,
            opacity: 0,
            scale: 0.1,
            duration: duration,
            ease: "power3.out"
        }, 0);
    });

    await mainTl;

    // --- Phase 4: Smooth Aftermath Transition ---
    // On réduit le temps d'attente pour que ça paraisse moins long
    gsap.to(explosionContainer, { opacity: 0, duration: 0.3, ease: "power1.inOut", onComplete: () => explosionContainer.remove() });
    // explosionContainer.remove(); // Moved to onComplete
}

async function victorySequence() {
    let gains = 10;
    if (state.player.blessings.includes("multiplication")) gains += 5;
    state.player.gold += gains;

    // Récupération de PV après combat (10% de la vie max)
    const healPercent = 0.10;
    const healAmount = Math.floor(state.player.maxHp * healPercent);
    const oldHp = state.player.hp;
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + healAmount);
    const actualHeal = state.player.hp - oldHp;

    // Track stats
    state.run.stats.enemiesDefeated++;
    state.run.stats.totalGoldEarned += gains;

    // Stop ambient monster effects
    stopEnemyParticles();

    // Explosion de la carte en bois !
    await animateBossExplosion();

    // Afficher l'overlay de VICTOIRE (Premium) au lieu de passer à la suite en plein milieu
    const overlay = document.getElementById('victory-overlay');
    const goldText = document.getElementById('v-gold-reward-text');
    const hpText = document.getElementById('v-hp-reward-text');
    const hpRewardItem = document.getElementById('v-hp-reward-item');

    goldText.innerText = `+${gains}`;

    if (actualHeal > 0) {
        hpText.innerText = `+${actualHeal}`;
        hpRewardItem.style.display = 'flex';
    } else {
        hpRewardItem.style.display = 'none';
    }

    // Mettre à jour l'interface (HP, Or)
    updateUI();

    overlay.classList.remove('modal-hidden');
    overlay.classList.add('modal-visible');

    // Animation d'entrée pour l'overlay
    gsap.fromTo('.victory-content',
        { scale: 0.5, opacity: 0, rotationY: 90 },
        { scale: 1, opacity: 1, rotationY: 0, duration: 0.6, ease: "expo.out" }
    );

    // Ornaments animation
    gsap.fromTo('.victory-ornament',
        { opacity: 0, scale: 2 },
        { opacity: 0.6, scale: 1, duration: 0.6, delay: 0.2, stagger: 0.1, ease: "back.out(2)" }
    );

    // Lueur pulsante sur le texte victoire
    gsap.fromTo('#victory-title',
        { filter: 'drop-shadow(0 0 10px rgba(199,161,59,0.4))' },
        { filter: 'drop-shadow(0 0 40px rgba(199,161,59,0.9))', duration: 1.5, repeat: -1, yoyo: true }
    );

    // Start background particles
    startVictoryParticles();
}

let victoryParticlesInterval = null;

function startVictoryParticles() {
    clearVictoryParticles();
    const container = document.getElementById('victory-particles-container');
    if (!container) return;

    victoryParticlesInterval = setInterval(() => {
        const p = document.createElement('div');
        p.className = 'victory-particle';
        const size = 2 + Math.random() * 4;
        const startX = Math.random() * window.innerWidth;
        const startY = window.innerHeight + 10;

        p.style.width = size + 'px';
        p.style.height = size + 'px';
        p.style.left = startX + 'px';
        p.style.top = startY + 'px';
        p.style.boxShadow = `0 0 ${size * 2}px rgba(255,255,255,0.8)`;

        container.appendChild(p);

        gsap.to(p, {
            y: -(window.innerHeight + 50),
            x: (Math.random() - 0.5) * 200,
            opacity: 0,
            duration: 3 + Math.random() * 3,
            ease: "none",
            onComplete: () => p.remove()
        });
    }, 100);
}

function clearVictoryParticles() {
    if (victoryParticlesInterval) clearInterval(victoryParticlesInterval);
    const container = document.getElementById('victory-particles-container');
    if (container) container.innerHTML = '';
}

function continueFromVictory() {
    clearVictoryParticles();
    const overlay = document.getElementById('victory-overlay');
    const bossCard = document.getElementById('boss-card');

    state.isAnimating = true;

    const tl = gsap.timeline();
    tl.to('.victory-content', { scale: 0.9, opacity: 0, duration: 0.4, ease: "power2.in" });
    tl.to("#game-container", { opacity: 0, duration: 0.6 }, "-=0.2");
    tl.add(() => {
        overlay.classList.remove('modal-visible');
        overlay.classList.add('modal-hidden');
        // Restaurer le boss card pour le prochain combat
        if (bossCard) {
            gsap.set(bossCard, { visibility: 'visible', filter: 'none', clearProps: 'all' });
        }
        advanceToNextNode();
        state.isAnimating = false;
    });
}

// --- PARTICULES SHOP DORÉES ---
let shopParticleInterval = null;

function spawnShopParticle() {
    const container = document.getElementById('shop-particles');
    if (!container) return;

    const particle = document.createElement('div');
    particle.className = 'shop-particle';

    const size = 2 + Math.random() * 5;
    particle.style.width = size + 'px';
    particle.style.height = size + 'px';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.bottom = '-5%';
    particle.style.boxShadow = `0 0 ${size * 2}px rgba(199, 161, 59, 0.5), 0 0 ${size * 4}px rgba(199, 161, 59, 0.2)`;

    container.appendChild(particle);

    const drift = -60 + Math.random() * 120;
    gsap.fromTo(particle,
        { opacity: 0, scale: 0 },
        {
            opacity: 0.6 + Math.random() * 0.4,
            scale: 1,
            duration: 0.5,
            onComplete: () => {
                gsap.to(particle, {
                    y: -(window.innerHeight * (0.7 + Math.random() * 0.4)),
                    x: drift,
                    opacity: 0,
                    scale: 0.2,
                    duration: 4 + Math.random() * 4,
                    ease: "power1.out",
                    onComplete: () => particle.remove()
                });
            }
        }
    );
}

function startShopParticles() {
    stopShopParticles();
    for (let i = 0; i < 8; i++) {
        setTimeout(() => spawnShopParticle(), i * 150);
    }
    shopParticleInterval = setInterval(() => {
        spawnShopParticle();
    }, 350);
}

function stopShopParticles() {
    if (shopParticleInterval) {
        clearInterval(shopParticleInterval);
        shopParticleInterval = null;
    }
    const container = document.getElementById('shop-particles');
    if (container) container.innerHTML = '';
}

// --- SHOP GENERATION ---
function generateShop() {
    const container = document.getElementById('blessings-container');
    container.innerHTML = '';
    const shuffled = [...availableBlessings].sort(() => 0.5 - Math.random());
    const selection = shuffled.slice(0, 3);
    selection.forEach(b => {
        const isOwned = state.player.blessings.includes(b.id);
        const name = t(`blessings.${b.id}.name`);
        const desc = t(`blessings.${b.id}.desc`);
        const card = document.createElement('div');
        card.className = 'blessing-card';
        card.innerHTML = `<div class="blessing-name">${name}</div><div class="blessing-desc">${desc}</div><div class="blessing-cost">${b.cost} <span class="stat-icon icon-gold-simple small"></span></div><button class="buy-btn" ${isOwned || state.player.gold < b.cost ? 'disabled' : ''}>${isOwned ? t('ui.owned') : t('ui.buy')}</button>`;
        card.querySelector('.buy-btn').addEventListener('click', (e) => buyBlessing(b, e.target));
        container.appendChild(card);

        // Particules dorées au hover
        card.addEventListener('mouseenter', () => {
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    const spark = document.createElement('div');
                    spark.className = 'shop-particle';
                    const s = 2 + Math.random() * 3;
                    spark.style.width = s + 'px';
                    spark.style.height = s + 'px';
                    spark.style.position = 'absolute';
                    spark.style.left = Math.random() * 100 + '%';
                    spark.style.top = Math.random() * 100 + '%';
                    spark.style.boxShadow = `0 0 ${s * 2}px rgba(199, 161, 59, 0.6)`;
                    card.appendChild(spark);
                    gsap.fromTo(spark,
                        { opacity: 0, scale: 0 },
                        {
                            opacity: 1, scale: 1.5, duration: 0.3,
                            onComplete: () => {
                                gsap.to(spark, {
                                    y: -(20 + Math.random() * 30),
                                    x: -15 + Math.random() * 30,
                                    opacity: 0,
                                    duration: 0.6 + Math.random() * 0.4,
                                    onComplete: () => spark.remove()
                                });
                            }
                        }
                    );
                }, i * 60);
            }
        });
    });

    // Titre : entrée simple
    gsap.fromTo("#sanctuary-title",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power2.out" }
    );

    // Gold display : entrée fade-in
    gsap.fromTo("#sanctuary-gold-display",
        { opacity: 0 },
        { opacity: 1, duration: 0.8, delay: 0.3, ease: "power2.out" }
    );

    // Cartes : entrée simple
    gsap.fromTo(".blessing-card",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.1, duration: 0.6, delay: 0.5, ease: "power2.out" }
    );

    // Bouton continuer : entrée en dernier
    gsap.fromTo("#btn-continue",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, delay: 1.2, ease: "power2.out" }
    );

    // Démarrer les particules
    // startShopParticles();
}

function buyBlessing(blessing, btn) {
    if (state.player.gold >= blessing.cost) {
        state.player.gold -= blessing.cost;
        state.player.blessings.push(blessing.id);
        document.getElementById('sanctuary-gold-value').innerText = state.player.gold;
        btn.innerText = t('ui.owned');
        btn.disabled = true;
        if (blessing.id === "grace") state.player.maxDiscards += 1;
        if (blessing.id === "cape_invisibilite") {
            state.player.maxHp += 15;
            state.player.hp = Math.min(state.player.hp + 15, state.player.maxHp);
        }
        if (blessing.id === "retourneur_temps") {
            state.player.maxDiscards += 2;
            state.player.discards += 2;
        }
        if (blessing.id === "vif_or") state.critChance += 0.05;

        // Flash doré sur la carte
        const card = btn.closest('.blessing-card');
        const flash = document.createElement('div');
        flash.style.cssText = 'position:absolute;inset:0;border-radius:12px;background:radial-gradient(circle,rgba(245,230,163,0.4),transparent);pointer-events:none;z-index:10;';
        card.appendChild(flash);
        gsap.fromTo(flash, { opacity: 1 }, { opacity: 0, duration: 0.8, onComplete: () => flash.remove() });

        // Scale bounce carte
        gsap.fromTo(card, { scale: 1.08 }, { scale: 1, duration: 0.5, ease: "elastic.out(1, 0.4)" });

        // Gold counter feedback
        const goldEl = document.getElementById('sanctuary-gold-value');
        gsap.fromTo(goldEl,
            { color: "#ff4444", scale: 1.3 },
            { color: "#c7a13b", scale: 1, duration: 0.6, ease: "back.out(2)" }
        );

        // Burst de particules en cercle depuis le bouton
        for (let i = 0; i < 8; i++) {
            const spark = document.createElement('div');
            spark.className = 'shop-particle';
            spark.style.cssText = 'position:absolute;width:3px;height:3px;left:50%;top:50%;z-index:20;';
            spark.style.boxShadow = '0 0 6px rgba(199,161,59,0.8)';
            card.appendChild(spark);
            const angle = (Math.PI * 2 / 8) * i;
            const dist = 40 + Math.random() * 40;
            gsap.to(spark, {
                x: Math.cos(angle) * dist,
                y: Math.sin(angle) * dist,
                opacity: 0,
                duration: 0.6 + Math.random() * 0.3,
                ease: "power2.out",
                onComplete: () => spark.remove()
            });
        }
    }
}

async function continueFromShop() {
    if (state.isAnimating) return;
    state.isAnimating = true;
    stopShopParticles();
    const tl = gsap.timeline();
    tl.to("#sanctuary-screen", { opacity: 0, duration: 0.6, ease: "power2.in" });
    tl.set("#sanctuary-screen", { display: "none" });
    tl.add(() => {
        state.isAnimating = false;
        advanceToNextNode();
    });
}

function discardAction() {
    if (state.player.discards <= 0 || state.selectedIndices.length === 0 || state.isAnimating) return;
    state.player.discards -= 1;
    const handContainer = document.getElementById('hand-container');
    const selectedWrappers = state.selectedIndices.map(idx => handContainer.querySelector(`[data-index="${idx}"]`));
    state.isAnimating = true;
    gsap.to(selectedWrappers, {
        x: 500, rotation: 45, opacity: 0, duration: 0.4, stagger: 0.05, onComplete: async () => {
            state.selectedIndices.sort((a, b) => b - a).forEach(i => {
                state.criticalCardIds.delete(state.hand[i].id);
                state.hand.splice(i, 1);
            });
            state.selectedIndices = [];
            while (state.hand.length < 8 && state.deck.length > 0) {
                const card = state.deck.pop();
                state.hand.push(card);
                rollCritForCard(card);
            }
            sortHand();
            await syncHandDOM(false);
            updateCriticalCardVisual();
            state.isAnimating = false;
            updateUI();
        }
    });
}

// --- UTILS ---
function sortHand() {
    state.hand.sort((a, b) => a.rank - b.rank);
}

function rollCritForCard(card) {
    if (Math.random() < state.critChance) {
        state.criticalCardIds.add(card.id);
    }
}

function updateCriticalCardVisual() {
    const handContainer = document.getElementById('hand-container');
    handContainer.querySelectorAll('.card-container.card-critical').forEach(el => el.classList.remove('card-critical'));
    handContainer.querySelectorAll('.crit-indicator').forEach(el => el.remove());

    state.criticalCardIds.forEach(cardId => {
        const wrapper = handContainer.querySelector(`[data-id="${cardId}"]`);
        if (!wrapper) return;
        const container = wrapper.querySelector('.card-container');
        if (container) container.classList.add('card-critical');
        const indicator = document.createElement('div');
        indicator.className = 'crit-indicator';
        indicator.innerText = '+25%';
        wrapper.appendChild(indicator);
    });
}

function getShortRank(rank) {
    if (rank <= 10) return rank.toString();
    return { 11: "Pr", 12: "Ap", 13: "An", 14: "Ar" }[rank];
}

function screenShake(t) {
    return gsap.fromTo(t, { x: -10 }, { x: 10, duration: 0.05, repeat: 10, yoyo: true, onComplete: () => gsap.to(t, { x: 0, duration: 0.1 }) });
}

// --- SYSTÈME DE PARTICULES MONSTRE ---
let enemyParticleInterval = null;

function spawnEnemyParticle() {
    const container = document.getElementById('enemy-particles');
    if (!container) return;

    const particle = document.createElement('div');
    particle.className = 'enemy-particle';

    // Taille aléatoire (4-10px) - Plus grand pour plus de visibilité
    const size = 4 + Math.random() * 6;
    particle.style.width = size + 'px';
    particle.style.height = size + 'px';

    // Couleurs par défaut (braises)
    let colors = [
        'rgba(255, 80, 20, 0.8)',
        'rgba(255, 140, 40, 0.7)',
        'rgba(255, 50, 10, 0.9)'
    ];

    // Personnalisation selon le monstre
    if (state.enemy && state.enemy.id) {
        switch (state.enemy.id) {
            case 'troll': colors = ['rgba(80, 120, 60, 0.8)', 'rgba(100, 140, 80, 0.7)', 'rgba(60, 90, 40, 0.9)']; break;
            case 'spider': colors = ['rgba(60, 20, 80, 0.8)', 'rgba(80, 30, 100, 0.7)', 'rgba(40, 10, 60, 0.9)']; break;
            case 'gnome': colors = ['rgba(160, 120, 60, 0.8)', 'rgba(180, 140, 80, 0.7)', 'rgba(140, 100, 40, 0.9)']; break;
            case 'pixie': colors = ['rgba(60, 160, 255, 0.8)', 'rgba(100, 200, 255, 0.7)', 'rgba(40, 120, 220, 0.9)']; break;
            case 'basilisk': colors = ['rgba(40, 180, 60, 0.8)', 'rgba(60, 220, 80, 0.7)', 'rgba(20, 140, 40, 0.9)', 'rgba(100, 255, 100, 0.6)']; break;
            case 'boggart': colors = ['rgba(100, 100, 120, 0.8)', 'rgba(80, 80, 100, 0.7)', 'rgba(120, 120, 140, 0.9)', 'rgba(40, 40, 50, 0.8)']; break;
            case 'hippogriff': colors = ['rgba(220, 220, 240, 0.8)', 'rgba(255, 255, 255, 0.7)', 'rgba(255, 215, 0, 0.9)']; break;
            case 'skrewt': colors = ['rgba(255, 100, 40, 0.8)', 'rgba(255, 60, 20, 0.7)', 'rgba(200, 40, 10, 0.9)']; break;
            case 'werewolf': colors = ['rgba(140, 30, 30, 0.8)', 'rgba(100, 90, 90, 0.7)', 'rgba(80, 20, 20, 0.9)']; break;
            case 'dragon': colors = ['rgba(255, 120, 0, 0.8)', 'rgba(255, 60, 0, 0.7)', 'rgba(200, 40, 0, 0.9)']; break;
            case 'centaur': colors = ['rgba(140, 100, 80, 0.8)', 'rgba(180, 140, 120, 0.7)', 'rgba(100, 60, 40, 0.9)']; break;
            case 'dementor': colors = ['rgba(10, 20, 40, 0.8)', 'rgba(0, 0, 0, 0.9)', 'rgba(60, 80, 120, 0.6)', 'rgba(30, 50, 80, 0.8)']; break;
            case 'voldemort': colors = ['rgba(20, 180, 60, 0.8)', 'rgba(10, 120, 40, 0.9)', 'rgba(0, 0, 0, 0.8)', 'rgba(40, 220, 80, 0.6)']; break;
        }
    }
    particle.style.background = colors[Math.floor(Math.random() * colors.length)];
    particle.style.boxShadow = `0 0 ${size * 3}px ${particle.style.background}, 0 0 ${size * 5}px rgba(255,255,255,0.2)`;

    // Position de départ aléatoire (dans la zone du boss)
    const startX = 10 + Math.random() * 80; // 10% à 90% de la largeur
    const startY = 60 + Math.random() * 40; // Partie basse du monstre
    particle.style.left = startX + '%';
    particle.style.bottom = (100 - startY) + '%';

    container.appendChild(particle);

    // Animation GSAP : flotte vers le haut avec oscillation
    const drift = -30 + Math.random() * 60;
    gsap.fromTo(particle,
        { opacity: 0, scale: 0 },
        {
            opacity: 1.0,
            scale: 1,
            duration: 0.3,
            onComplete: () => {
                gsap.to(particle, {
                    y: -(80 + Math.random() * 120),
                    x: drift,
                    opacity: 0,
                    scale: 0.3,
                    duration: 1.5 + Math.random() * 2,
                    ease: "power1.out",
                    onComplete: () => particle.remove()
                });
            }
        }
    );
}

function startEnemyParticles() {
    stopEnemyParticles();
    // Spawn initial burst
    for (let i = 0; i < 5; i++) {
        setTimeout(() => spawnEnemyParticle(), i * 200);
    }
    // Continuous spawn - Fréquence augmentée
    enemyParticleInterval = setInterval(() => {
        spawnEnemyParticle();
    }, 150 + Math.random() * 150);
}

function stopEnemyParticles() {
    if (enemyParticleInterval) {
        clearInterval(enemyParticleInterval);
        enemyParticleInterval = null;
    }
    const container = document.getElementById('enemy-particles');
    if (container) container.innerHTML = '';
}

// --- ENTRÉE DRAMATIQUE DU MONSTRE ---
function animateBossEntrance() {
    const bossCard = document.getElementById('boss-card');
    if (!bossCard) return;

    const tl = gsap.timeline();
    const portrait = document.getElementById('enemy-portrait');

    // State initial : invisible, légèrement plus grand (émerge de l'ombre)
    gsap.set(bossCard, { opacity: 0 });
    gsap.set(portrait, { scale: 1.15, filter: 'brightness(0)' });

    // 1. Fade in sombre
    tl.to(bossCard, {
        opacity: 1,
        duration: 0.6,
        ease: "power2.out"
    });

    // 2. Le portrait se révèle (zoom-out + brightness)
    tl.to(portrait, {
        scale: 1,
        filter: 'brightness(1)',
        duration: 0.8,
        ease: "power2.out"
    }, "-=0.4");

    // 3. Libérer les styles inline pour la respiration CSS + démarrer particules
    tl.add(() => {
        gsap.set(bossCard, { clearProps: "opacity" });
        gsap.set(portrait, { clearProps: "transform,filter" });
        startEnemyParticles();
    });

    return tl;
}

function animateDamageText(d, pS) {
    const p = document.querySelector(pS);
    if (!p) return;
    const text = document.createElement('div');
    text.className = 'floating-damage';
    text.innerText = `-${d}`;
    p.appendChild(text);
    gsap.fromTo(text, { y: 50, opacity: 0, scale: 0.5 }, { y: -100, opacity: 1, scale: 1.5, duration: 0.8, onComplete: () => { gsap.to(text, { opacity: 0, duration: 0.4, onComplete: () => text.remove() }); } });
}

function showEndOverlay(isWin) {
    stopEnemyParticles();
    const overlay = document.getElementById('game-over-overlay');
    const content = document.querySelector('.game-over-content');
    const title = document.getElementById('game-over-title');
    const msg = document.getElementById('game-over-message');
    const restartBtn = document.getElementById('btn-restart');

    overlay.style.display = 'flex';
    gsap.set(overlay, { opacity: 0 });
    gsap.set(content, { scale: 0.8, opacity: 0, rotationX: -20 });

    // Populate Stats
    document.getElementById('stat-enemies').innerText = state.run.stats.enemiesDefeated;
    document.getElementById('stat-damage').innerText = state.run.stats.totalDamageDealt;
    document.getElementById('stat-gold').innerText = state.run.stats.totalGoldEarned;

    const lastBossId = state.run.stats.bossId || (state.enemy ? state.enemy.id : null);
    document.getElementById('stat-boss').innerText = lastBossId ? t(`enemies.${lastBossId}`) : "---";

    restartBtn.innerText = t('ui.new_adventure');

    if (isWin) {
        title.innerText = t('ui.victory');
        title.className = "win";
        msg.innerText = t('ui.enemy_defeated');
        document.getElementById('game-over-icon').innerHTML = "🏆";
        content.className = "game-over-content win-theme";
    } else {
        title.innerText = t('ui.defeat');
        title.className = "lose";
        msg.innerText = "Votre voyage s'arrête ici...";
        document.getElementById('game-over-icon').innerHTML = "💀";
        content.className = "game-over-content lose-theme";
    }

    const tl = gsap.timeline();
    tl.to(overlay, { opacity: 1, duration: 0.8, ease: "power2.out" });
    tl.to(content, {
        opacity: 1,
        scale: 1,
        rotationX: 0,
        duration: 1,
        ease: "expo.out"
    }, "-=0.4");

    tl.from("#game-over-title", { y: 20, opacity: 0, duration: 0.8, ease: "power2.out" }, "-=0.6");
    tl.from("#game-over-message", { y: 15, opacity: 0, duration: 0.8, ease: "power2.out" }, "-=0.6");
    tl.from(".stat-box", {
        y: 20,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out"
    }, "-=0.4");
    tl.from("#btn-restart", { y: 20, opacity: 0, duration: 0.8, ease: "back.out(1.7)" }, "-=0.4");
}

// --- LOGIQUE DE LA MODAL (GUIDE) ---
function initComboModal() {
    const list = document.getElementById('combo-list');
    list.innerHTML = '';
    const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

    combosGuide.forEach((c, idx) => {
        const li = document.createElement('li');
        li.className = 'combo-item';

        // Generate mini card illustrations
        const cardsHTML = c.cards.map(cardId => {
            const suit = cardId.split('_')[0]; // Extract suit from "suit_rank"
            return `<div class="combo-mini-card ${suit}" style="background-image: url('assets/card_${cardId}.webp');"></div>`;
        }).join('');

        li.innerHTML = `
            <div class="combo-rank">${romanNumerals[idx]}</div>
            <div class="combo-illustration">${cardsHTML}</div>
            <div class="combo-info">
                <span class="combo-main-name">${t(`combos.${c.key}`)}</span>
                <span class="combo-desc">${t(`combo_desc.${c.key}`)}</span>
            </div>
            <div class="combo-stats">
                <div class="combo-base-val">${c.base} ${t('ui.pts')}</div>
            </div>
        `;
        list.appendChild(li);
    });
}

function openGuide() {
    const modal = document.getElementById('combo-modal');
    modal.classList.remove('modal-hidden');
    gsap.fromTo("#combo-modal", { opacity: 0 }, { opacity: 1, duration: 0.3 });
    gsap.fromTo(".modal-content",
        { y: -50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, ease: "back.out(1.7)" }
    );
}

function closeGuide() {
    gsap.to(".modal-content", { y: -30, opacity: 0, duration: 0.3, ease: "power2.in" });
    gsap.to("#combo-modal", {
        opacity: 0,
        duration: 0.3,
        onComplete: () => {
            document.getElementById('combo-modal').classList.add('modal-hidden');
        }
    });
}

function animateCounter(id, start, end, duration) {
    const obj = { val: start };
    const el = document.getElementById(id);
    if (!el) return;
    gsap.to(obj, {
        val: end,
        duration: duration,
        ease: "power2.out",
        onUpdate: () => {
            el.innerText = Math.ceil(obj.val);
        }
    });
}

// LANCEMENT
window.addEventListener('load', initGame);

/**
 * MAIN.JS - La Main du Sorcier
 * Méta-jeu & Combat - Version Corrigée (Final Fix).
 */

// --- POOL D'ENNEMIS ---
const ENEMY_POOL = [
    // Tier 1 (nodes 1-2): low HP, low attack
    { id: "troll", hp: 200, attack: 10, tier: 1, image: "enemy_troll.webp" },
    { id: "spider", hp: 180, attack: 12, tier: 1, image: "giant-spider-ennemy.webp" },
    { id: "gnome", hp: 150, attack: 8, tier: 1, image: "enemy_troll.webp" },
    { id: "pixie", hp: 170, attack: 11, tier: 1, image: "enemy_troll.webp" },
    // Tier 2 (nodes 4-5): medium HP, medium attack
    { id: "basilisk", hp: 300, attack: 15, tier: 2, image: "enemy_troll.webp" },
    { id: "boggart", hp: 280, attack: 18, tier: 2, image: "enemy_troll.webp" },
    { id: "hippogriff", hp: 320, attack: 14, tier: 2, image: "enemy_troll.webp" },
    { id: "skrewt", hp: 260, attack: 20, tier: 2, image: "enemy_troll.webp" },
    // Tier 3 (nodes 7-8): high HP, high attack
    { id: "werewolf", hp: 400, attack: 22, tier: 3, image: "enemy_troll.webp" },
    { id: "dragon", hp: 450, attack: 25, tier: 3, image: "enemy_troll.webp" },
    { id: "inferius", hp: 380, attack: 28, tier: 3, image: "enemy_troll.webp" },
    { id: "centaur", hp: 420, attack: 20, tier: 3, image: "enemy_troll.webp" },
];

const BOSS_POOL = [
    {
        id: "dementor",
        hp: 800,
        attack: 30,
        image: "enemy_troll.webp", // Default for now
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
        image: "enemy_troll.webp",
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
        image: "enemy_troll.webp",
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
    elite:    { hp: 100, discards: 3, enemyMult: 1.0, critChance: 0.03 },
    arcanes:  { hp: 80,  discards: 2, enemyMult: 1.3, critChance: 0.02 }
};

// --- TYPES DE NOEUDS & TEMPLATE DE RUN ---
const NODE_TYPES = {
    COMBAT: "combat",
    SHOP: "shop",
    BOSS: "boss",
    DORTOIR: "dortoir"
};

// Chaque entrée = une colonne avec 1-2 noeuds possibles (max 2 choix)
const RUN_TEMPLATE = [
    [{ type: NODE_TYPES.COMBAT, tier: 1 }],                                     // Col 0
    [{ type: NODE_TYPES.COMBAT, tier: 1 }, { type: NODE_TYPES.DORTOIR }],        // Col 1
    [{ type: NODE_TYPES.SHOP }],                                                 // Col 2
    [{ type: NODE_TYPES.COMBAT, tier: 2 }, { type: NODE_TYPES.DORTOIR }],        // Col 3
    [{ type: NODE_TYPES.COMBAT, tier: 2 }],                                      // Col 4
    [{ type: NODE_TYPES.SHOP }],                                                 // Col 5
    [{ type: NODE_TYPES.COMBAT, tier: 3 }, { type: NODE_TYPES.DORTOIR }],        // Col 6
    [{ type: NODE_TYPES.COMBAT, tier: 3 }],                                      // Col 7
    [{ type: NODE_TYPES.SHOP }],                                                 // Col 8
    [{ type: NODE_TYPES.BOSS }],                                                 // Col 9
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
    { id: "eau_vive", cost: 25 }
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
                node.enemy = { id: picked.id, hp: eHp, maxHp: eHp, attack: Math.floor(picked.attack * eMult), image: picked.image };
                node.tier = template.tier;
            } else if (template.type === NODE_TYPES.BOSS) {
                const bHp = Math.floor(boss.hp * eMult);
                node.enemy = { id: boss.id, hp: bHp, maxHp: bHp, attack: Math.floor(boss.attack * eMult), image: boss.image };
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

    // Update player status bar
    document.getElementById('map-hp').innerText = `PV: ${state.player.hp}/${state.player.maxHp}`;
    document.getElementById('map-gold').innerText = `Galleons: ${state.player.gold}`;
    document.getElementById('map-blessings').innerText = `Artefacts: ${state.player.blessings.length}`;

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
        descEl.innerText = `PV: ${selectedNode.enemy.hp} | Attaque: ${selectedNode.enemy.attack}`;
    } else if (selectedNode.type === NODE_TYPES.SHOP) {
        nameEl.innerText = "Diagon Alley";
        descEl.innerText = "Depensez vos Galleons pour des artefacts magiques.";
    } else if (selectedNode.type === NODE_TYPES.BOSS) {
        nameEl.innerText = `BOSS: ${t(`enemies.${selectedNode.enemy.id}`)}`;
        descEl.innerText = `PV: ${selectedNode.enemy.hp} | ${selectedNode.malus.description}`;
    } else if (selectedNode.type === NODE_TYPES.DORTOIR) {
        const healAmount = Math.floor(state.player.maxHp * 0.3);
        nameEl.innerText = "Dortoir";
        descEl.innerText = `Reposez-vous et recuperez ${healAmount} PV (30% PV max).`;
    }
}

function showMap() {
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
    renderMap();
    gsap.fromTo('#map-screen', { opacity: 0 }, { opacity: 1, duration: 0.6 });

    // Auto-save on map
    saveGame();
}

async function enterCurrentNode() {
    const column = state.run.columns[state.run.currentColumnIndex];
    if (column.selectedNodeIndex === null) return;
    const currentNode = column.nodes[column.selectedNodeIndex];

    if (currentNode.type === NODE_TYPES.COMBAT || currentNode.type === NODE_TYPES.BOSS) {
        // Set current enemy from node data
        state.enemy = { ...currentNode.enemy };

        // Update enemy zone UI
        document.getElementById('enemy-hp-overlay').innerText = state.enemy.hp;
        document.getElementById('enemy-portrait').style.backgroundImage = `url('assets/${state.enemy.image}')`;

        // Show malus if boss
        if (currentNode.malus) {
            const malusInfo = document.getElementById('boss-malus-info');
            if (malusInfo) {
                malusInfo.style.display = 'block';
                malusInfo.innerText = currentNode.malus.description;
            }
        } else {
            const malusInfo = document.getElementById('boss-malus-info');
            if (malusInfo) malusInfo.style.display = 'none';
        }

        // Transition: fade map out, show game container
        const tl = gsap.timeline();
        tl.to('#map-screen', { opacity: 0, duration: 0.5 });
        tl.set('#map-screen', { display: 'none' });
        tl.set('#game-container', { opacity: 1 });
        tl.add(() => startNewFight());
    } else if (currentNode.type === NODE_TYPES.SHOP) {
        // Transition directly to shop
        const tl = gsap.timeline();
        tl.to('#map-screen', { opacity: 0, duration: 0.5 });
        tl.set('#map-screen', { display: 'none' });
        tl.add(() => {
            document.getElementById('sanctuary-screen').style.display = 'flex';
            document.getElementById('sanctuary-gold-value').innerText = state.player.gold;
            generateShop();
            gsap.fromTo('#sanctuary-screen', { opacity: 0 }, { opacity: 1, duration: 0.6 });
        });
    } else if (currentNode.type === NODE_TYPES.DORTOIR) {
        // Transition to dortoir
        const tl = gsap.timeline();
        tl.to('#map-screen', { opacity: 0, duration: 0.5 });
        tl.set('#map-screen', { display: 'none' });
        tl.add(() => showDortoir());
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
    document.getElementById('player-hp-text').innerText = `${state.player.hp}/${state.player.maxHp}`;
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
    const overlay = document.getElementById('game-over-overlay');
    overlay.style.display = 'flex';
    overlay.style.opacity = 0;
    document.getElementById('game-over-title').innerText = "VICTOIRE TOTALE !";
    document.getElementById('game-over-title').className = "win";
    document.getElementById('game-over-message').innerText = "Vous avez complete le chemin du sorcier.";

    // Show stats
    const statsDiv = document.getElementById('run-stats');
    statsDiv.style.display = 'block';
    document.getElementById('stat-enemies').innerText = state.run.stats.enemiesDefeated;
    document.getElementById('stat-damage').innerText = state.run.stats.totalDamageDealt;
    document.getElementById('stat-gold').innerText = state.run.stats.totalGoldEarned;
    document.getElementById('stat-boss').innerText = t(`enemies.${state.run.stats.bossId}`);

    gsap.to(overlay, { opacity: 1, duration: 1 });
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
    document.getElementById('menu-btn').style.display = 'none';

    // Update texts
    document.getElementById('title-game-name').innerText = t('ui.title_name');
    document.getElementById('title-subtitle').innerText = t('ui.title_subtitle');
    document.getElementById('btn-new-game').innerText = t('ui.new_game');
    document.getElementById('btn-continue-game').innerText = t('ui.continue_game');

    // Enable/disable continue
    document.getElementById('btn-continue-game').disabled = !hasSavedGame();

    // Show with animation
    const ts = document.getElementById('title-screen');
    ts.style.display = 'flex';
    gsap.fromTo(ts, { opacity: 0 }, { opacity: 1, duration: 0.8 });
    gsap.fromTo('#title-game-name', { y: -30, opacity: 0 }, { y: 0, opacity: 1, duration: 1, delay: 0.3, ease: "power2.out" });
    gsap.fromTo('#title-subtitle', { opacity: 0 }, { opacity: 1, duration: 0.8, delay: 0.6 });
    gsap.fromTo('#title-buttons', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, delay: 0.8, ease: "power2.out" });
}

function showDifficultyScreen() {
    const tl = gsap.timeline();
    tl.to('#title-screen', { opacity: 0, duration: 0.4, ease: "power2.in" });
    tl.set('#title-screen', { display: 'none' });
    tl.add(() => {
        // Update texts
        document.getElementById('difficulty-title').innerText = t('ui.select_difficulty');
        document.getElementById('diff-name-apprenti').innerText = t('ui.difficulty_apprenti');
        document.getElementById('diff-name-elite').innerText = t('ui.difficulty_elite');
        document.getElementById('diff-name-arcanes').innerText = t('ui.difficulty_arcanes');
        document.getElementById('diff-desc-apprenti').innerText = t('ui.desc_apprenti');
        document.getElementById('diff-desc-elite').innerText = t('ui.desc_elite');
        document.getElementById('diff-desc-arcanes').innerText = t('ui.desc_arcanes');
        document.getElementById('btn-back-title').innerText = t('ui.back');

        const ds = document.getElementById('difficulty-screen');
        ds.style.display = 'flex';
        gsap.fromTo(ds, { opacity: 0 }, { opacity: 1, duration: 0.5 });
        gsap.fromTo('.difficulty-card', { y: 40, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.6, stagger: 0.12, ease: "back.out(1.5)" });
    });
}

function backToTitle() {
    const tl = gsap.timeline();
    tl.to('#difficulty-screen', { opacity: 0, duration: 0.4, ease: "power2.in" });
    tl.set('#difficulty-screen', { display: 'none' });
    tl.add(() => showTitleScreen());
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

    const tl = gsap.timeline();
    tl.to('#difficulty-screen', { opacity: 0, duration: 0.5, ease: "power2.in" });
    tl.set('#difficulty-screen', { display: 'none' });
    tl.add(() => {
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
    const tl = gsap.timeline();
    tl.to('#title-screen', { opacity: 0, duration: 0.5, ease: "power2.in" });
    tl.set('#title-screen', { display: 'none' });
    tl.add(() => {
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

    // Title & Difficulty
    document.getElementById('btn-new-game').addEventListener('click', () => showDifficultyScreen());
    document.getElementById('btn-continue-game').addEventListener('click', () => continueGame());
    document.getElementById('btn-back-title').addEventListener('click', () => backToTitle());
    document.querySelectorAll('.difficulty-card').forEach(card => {
        card.addEventListener('click', () => startNewGame(card.dataset.difficulty));
    });

    // Menu (quit to title)
    document.getElementById('menu-btn').addEventListener('click', () => showQuitConfirm());
    document.getElementById('btn-quit-yes').addEventListener('click', () => quitToTitle());
    document.getElementById('btn-quit-no').addEventListener('click', () => hideQuitConfirm());

    // 2. Setup UI and show title screen
    updateLocalizedUI();
    initComboModal();
    showTitleScreen();
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
    document.getElementById('grimoire-subtitle').innerText = t('ui.grimoire_subtitle');
    document.getElementById('btn-close-guide').innerText = t('ui.close_grimoire');
    document.getElementById('btn-restart').innerText = t('ui.new_adventure');
    document.getElementById('sanctuary-title').innerText = t('ui.sanctuary_title');
    document.getElementById('sanctuary-gold-label').innerText = t('ui.galleons');
    document.getElementById('btn-continue').innerText = t('ui.continue_adventure');

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
    const bbt = document.getElementById('btn-back-title');
    if (bbt) bbt.innerText = t('ui.back');

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
        <div class="card-container ${state.selectedIndices.includes(index) ? 'selected' : ''}">
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

function updateUI() {
    document.getElementById('gold-value').innerText = state.player.gold;
    document.getElementById('discards-value').innerText = state.player.discards;

    const anyS = state.selectedIndices.length > 0;
    document.getElementById('btn-play').disabled = !anyS || state.isAnimating;
    document.getElementById('btn-discard').disabled = !anyS || state.player.discards <= 0 || state.isAnimating;

    document.getElementById('player-hp-text').innerText = `${state.player.hp}/${state.player.maxHp}`;
    document.getElementById('crit-value').innerText = `${Math.round(state.critChance * 100)}%`;

    // Nouveaux overlays dynamiques sur la carte boss (Corners only)
    if (state.enemy) {
        document.getElementById('enemy-hp-overlay').innerText = state.enemy.hp;
    }

    updateComboDisplay();
}

function updateComboDisplay() {
    const el = document.getElementById('combo-name');
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

    // Critical hit check
    const hasCrit = activeCards.some(card => state.criticalCardIds.has(card.id));
    const finalDamage = hasCrit ? Math.floor(result.damage * (1 + state.critBonus)) : result.damage;

    // Track damage stat
    state.run.stats.totalDamageDealt += finalDamage;

    const handContainer = document.getElementById('hand-container');
    const selectedWrappers = state.selectedIndices.map(idx => handContainer.querySelector(`[data-index="${idx}"]`)).filter(el => el);

    // Dégâts immédiats visuels
    const targetHP = Math.max(0, state.enemy.hp - finalDamage);

    // --- PHASE 0: Card Value Reveal (style Main du Démon) ---
    const comboOnlyDamage = result.baseCombo;

    // Scoring glow on selected cards
    selectedWrappers.forEach(w => {
        const c = w.querySelector('.card-container');
        if (c) c.classList.add('card-scoring');
    });

    // Create "+X" value labels above each card
    const valueLabels = [];
    cardsForEval.forEach((card, i) => {
        const wrapper = selectedWrappers[i];
        if (!wrapper || card.baseDamage <= 0) return;
        const label = document.createElement('div');
        label.className = 'card-value-popup';
        label.innerText = `+${card.baseDamage}`;
        wrapper.appendChild(label);
        valueLabels.push(label);
    });

    if (valueLabels.length > 0) {
        // Animate "+X" labels with stagger
        await gsap.fromTo(valueLabels,
            { y: 10, opacity: 0, scale: 0.3 },
            { y: -15, opacity: 1, scale: 1, duration: 0.5, stagger: 0.12, ease: "back.out(2.5)" }
        );

        // Animate score counter from combo-only → total damage
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
            // Scale pulse on final value
            gsap.fromTo(damageEl, { scale: 1.3 }, { scale: 1, duration: 0.3, ease: "back.out(2)" });
        }

        // Brief pause to appreciate the total
        await new Promise(r => setTimeout(r, 400));
    }

    // --- PHASE 0b: Critical bonus animation ---
    if (hasCrit) {
        const critCard = activeCards.find(c => state.criticalCardIds.has(c.id));
        const critWrapper = critCard ? handContainer.querySelector(`[data-id="${critCard.id}"]`) : null;
        if (critWrapper) {
            const critLabel = document.createElement('div');
            critLabel.className = 'crit-popup';
            critLabel.innerText = '+25%';
            critWrapper.appendChild(critLabel);

            await gsap.fromTo(critLabel,
                { y: -30, opacity: 0, scale: 0.3 },
                { y: -60, opacity: 1, scale: 1.2, duration: 0.5, ease: "back.out(3)" }
            );

            // Animate counter from normal → crit damage
            const damageEl = document.getElementById('combo-damage-value');
            if (damageEl) {
                gsap.to(damageEl, { color: '#a29bfe', textShadow: '0 0 20px rgba(120,80,255,0.6), 0 0 40px rgba(120,80,255,0.3)', duration: 0.3 });
                const obj2 = { val: result.damage };
                await gsap.to(obj2, {
                    val: finalDamage,
                    duration: 0.5,
                    ease: "power2.out",
                    onUpdate: () => { damageEl.innerText = Math.floor(obj2.val); }
                });
                gsap.fromTo(damageEl, { scale: 1.4 }, { scale: 1, duration: 0.3, ease: "back.out(2)" });
            }

            await new Promise(r => setTimeout(r, 300));
        }
    }

    // Timeline Attaque Joueur
    const tl1 = gsap.timeline();
    // 1. Soulèvement des cartes
    tl1.to(selectedWrappers, { y: -150, x: (i) => (i - (selectedWrappers.length - 1) / 2) * 20, scale: 1.3, duration: 0.6, stagger: 0.05, ease: "power3.out" });

    // 2. Vol vers l'ennemi (Lancement)
    tl1.to(selectedWrappers, { y: -500, opacity: 0, duration: 0.4, stagger: 0.03, ease: "power4.in" });

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

        // Mise à jour HP avec petit éclat
        gsap.to("#player-hp-fill", { width: `${(state.player.hp / state.player.maxHp) * 100}%`, duration: 0.4, ease: "power2.out" });
        document.getElementById('player-hp-text').innerText = `${state.player.hp}/${state.player.maxHp}`;

        // Effets visuels d'impact (Vignette & Secousse)
        gsap.fromTo(vignette, { opacity: 0 }, { opacity: 1, duration: 0.1, yoyo: true, repeat: 1 });

        gsap.to(gameContainer, {
            x: 20,
            duration: 0.05,
            repeat: 7,
            yoyo: true,
            onComplete: () => gsap.set(gameContainer, { x: 0, y: 0 })
        });

        // Flash de couleur de fond (plus rapide)
        gsap.fromTo("body", { backgroundColor: "#800" }, { backgroundColor: "#1a1005", duration: 0.5 });

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

async function victorySequence() {
    let gains = 10;
    if (state.player.blessings.includes("multiplication")) gains += 5;
    state.player.gold += gains;

    // Track stats
    state.run.stats.enemiesDefeated++;
    state.run.stats.totalGoldEarned += gains;

    await new Promise(r => setTimeout(r, 1000));

    // Fade out game container, then go to map
    const tl = gsap.timeline();
    tl.to("#game-container", { opacity: 0, duration: 0.8 });
    tl.add(() => advanceToNextNode());
    state.isAnimating = false;
}

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
        card.innerHTML = `<div class="blessing-name">${name}</div><div class="blessing-desc">${desc}</div><div class="blessing-cost">${b.cost} 🪙</div><button class="buy-btn" ${isOwned || state.player.gold < b.cost ? 'disabled' : ''}>${isOwned ? t('ui.owned') : t('ui.buy')}</button>`;
        card.querySelector('.buy-btn').addEventListener('click', (e) => buyBlessing(b, e.target));
        container.appendChild(card);
    });
    gsap.from(".blessing-card", { y: 50, opacity: 0, stagger: 0.1, duration: 0.5 });
}

function buyBlessing(blessing, btn) {
    if (state.player.gold >= blessing.cost) {
        state.player.gold -= blessing.cost;
        state.player.blessings.push(blessing.id);
        document.getElementById('sanctuary-gold-value').innerText = state.player.gold;
        btn.innerText = t('ui.owned'); btn.disabled = true;
        if (blessing.id === "grace") state.player.maxDiscards += 1;
        gsap.fromTo("#sanctuary-gold-value", { color: "#f00" }, { color: "#c7a13b", duration: 0.5 });
    }
}

async function continueFromShop() {
    if (state.isAnimating) return;
    state.isAnimating = true;
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
    const overlay = document.getElementById('game-over-overlay');
    overlay.style.display = 'flex'; overlay.style.opacity = 0;
    const title = document.getElementById('game-over-title');
    const msg = document.getElementById('game-over-message');
    if (isWin) {
        title.innerText = t('ui.victory');
        title.className = "win";
        msg.innerText = t('ui.enemy_defeated');
    }
    else {
        title.innerText = t('ui.defeat');
        title.className = "lose";
        msg.innerText = ""; // Optional: Add a defeat message in translations
    }
    gsap.to(overlay, { opacity: 1, duration: 1 });
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
        const cardsHTML = c.cards.map(card =>
            `<div class="combo-mini-card" style="background-image: url('assets/card_${card}.webp');"></div>`
        ).join('');

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

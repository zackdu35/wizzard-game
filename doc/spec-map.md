# Implementation Plan: Map/Progression System for "La Main du Sorcier"
## 1. Overview of Changes
The goal is to transform the game from an infinite loop against a single enemy into a structured 10-node run with enemy variety, a visual map screen, persistent player HP, and proper win/loss conditions. Three files need modification: `main.js` (majority of changes), `index.html` (new map screen HTML), and `style.css` (map screen styling). `engine.js` stays unchanged -- it only handles card evaluation and deck generation, which remain the same.
---
## 2. Data Structures
### 2.1. Enemy Pool (add to top of `main.js`)
```javascript
const ENEMY_POOL = [
    // Tier 1 (nodes 1-2): low HP, low attack
    { name: "Le Troll du Couloir",       hp: 200, attack: 10, tier: 1 },
    { name: "L'Araignee Geante",         hp: 180, attack: 12, tier: 1 },
    { name: "Le Gnome de Jardin",        hp: 150, attack: 8,  tier: 1 },
    { name: "Le Lutins de Cornouailles", hp: 170, attack: 11, tier: 1 },
    // Tier 2 (nodes 4-5): medium HP, medium attack
    { name: "Le Basilic Juvenile",       hp: 300, attack: 15, tier: 2 },
    { name: "L'Epouvantard",            hp: 280, attack: 18, tier: 2 },
    { name: "Le Hippogriffe Furieux",    hp: 320, attack: 14, tier: 2 },
    { name: "Le Scroutt a Petard",       hp: 260, attack: 20, tier: 2 },
    // Tier 3 (nodes 7-8): high HP, high attack
    { name: "Le Loup-Garou",            hp: 400, attack: 22, tier: 3 },
    { name: "Le Magyar a Pointes",      hp: 450, attack: 25, tier: 3 },
    { name: "L'Inferius",               hp: 380, attack: 28, tier: 3 },
    { name: "Le Centaure Renegat",      hp: 420, attack: 20, tier: 3 },
];
const BOSS_POOL = [
    {
        name: "Le Detraqueur",
        hp: 800,
        attack: 30,
        malus: {
            id: "no_ravenclaw",
            description: "Les cartes de Serdaigle ne font aucun degat.",
            apply: (card) => card.suit === "ravenclaw" ? 0 : card.baseDamage
        }
    },
    {
        name: "Lord Voldemort",
        hp: 1000,
        attack: 35,
        malus: {
            id: "no_low_cards",
            description: "Les cartes de rang 2 a 6 ne font aucun degat.",
            apply: (card) => card.rank <= 6 ? 0 : card.baseDamage
        }
    },
    {
        name: "Bellatrix Lestrange",
        hp: 700,
        attack: 40,
        malus: {
            id: "no_hufflepuff",
            description: "Les cartes de Poufsouffle ne font aucun degat.",
            apply: (card) => card.suit === "hufflepuff" ? 0 : card.baseDamage
        }
    }
];
```
### 2.2. Map Node Structure
```javascript
// Node types
const NODE_TYPES = {
    COMBAT: "combat",
    SHOP:   "shop",
    BOSS:   "boss"
};
// The fixed run template (10 nodes)
const RUN_TEMPLATE = [
    { type: NODE_TYPES.COMBAT, tier: 1 },  // Node 0
    { type: NODE_TYPES.COMBAT, tier: 1 },  // Node 1
    { type: NODE_TYPES.SHOP },              // Node 2
    { type: NODE_TYPES.COMBAT, tier: 2 },  // Node 3
    { type: NODE_TYPES.COMBAT, tier: 2 },  // Node 4
    { type: NODE_TYPES.SHOP },              // Node 5
    { type: NODE_TYPES.COMBAT, tier: 3 },  // Node 6
    { type: NODE_TYPES.COMBAT, tier: 3 },  // Node 7
    { type: NODE_TYPES.SHOP },              // Node 8
    { type: NODE_TYPES.BOSS },              // Node 9
];
```
### 2.3. State Object Changes
The current `state` object needs to be expanded with run-level tracking:
```javascript
const state = {
    player: {
        hp: 100,
        maxHp: 100,
        gold: 0,
        discards: 3,
        maxDiscards: 3,
        blessings: []
    },
    // REMOVED: enemy is no longer hardcoded here
    enemy: null, // set dynamically per node
    // NEW: Run tracking
    run: {
        nodes: [],          // Array of generated node objects
        currentNodeIndex: 0, // Which node player is at
        isComplete: false,   // True after boss defeated
        stats: {             // End-of-run statistics
            enemiesDefeated: 0,
            totalDamageDealt: 0,
            totalGoldEarned: 0,
            bossName: ""
        }
    },
    // Combat state (unchanged)
    deck: [],
    hand: [],
    selectedIndices: [],
    isAnimating: false
};
```
Each generated node in `state.run.nodes` looks like:
```javascript
{
    type: "combat",        // "combat" | "shop" | "boss"
    status: "upcoming",    // "upcoming" | "current" | "completed"
    enemy: { name, hp, maxHp, attack },       // for combat/boss
    malus: { id, description, apply },         // for boss only
    tier: 2                                     // for combat only
}
```
---
## 3. New Function: `generateRun()`
This function is called once at the start of a new game to populate `state.run.nodes`:
```javascript
function generateRun() {
    state.run.nodes = [];
    state.run.currentNodeIndex = 0;
    state.run.isComplete = false;
    state.run.stats = { enemiesDefeated: 0, totalDamageDealt: 0, totalGoldEarned: 0, bossName: "" };
    // Pick a random boss
    const boss = BOSS_POOL[Math.floor(Math.random() * BOSS_POOL.length)];
    state.run.stats.bossName = boss.name;
    RUN_TEMPLATE.forEach((template, index) => {
        const node = { type: template.type, status: index === 0 ? "current" : "upcoming" };
        if (template.type === NODE_TYPES.COMBAT) {
            const tierEnemies = ENEMY_POOL.filter(e => e.tier === template.tier);
            const picked = tierEnemies[Math.floor(Math.random() * tierEnemies.length)];
            node.enemy = { name: picked.name, hp: picked.hp, maxHp: picked.hp, attack: picked.attack };
            node.tier = template.tier;
        } else if (template.type === NODE_TYPES.BOSS) {
            node.enemy = { name: boss.name, hp: boss.hp, maxHp: boss.hp, attack: boss.attack };
            node.malus = boss.malus;
        }
        // Shop nodes have no enemy
        state.run.nodes.push(node);
    });
}
```
---
## 4. Boss Malus Integration in `engine.js`
The boss malus modifies individual card damage. Rather than modifying `engine.js` (which should stay as pure logic), the malus is applied in `main.js` before calling `evaluateHand()`. When a boss malus is active, each card's `baseDamage` is overridden via the malus `apply` function.
In `executeTurn()`, before the `evaluateHand` call:
```javascript
// Apply boss malus if active
const currentNode = state.run.nodes[state.run.currentNodeIndex];
let cardsForEval = [...activeCards];
if (currentNode.malus) {
    cardsForEval = activeCards.map(card => ({
        ...card,
        baseDamage: currentNode.malus.apply(card)
    }));
}
const result = evaluateHand(cardsForEval, state.player.blessings);
```
This same logic must also be applied in `updateComboDisplay()` so the damage preview reflects the malus.
---
## 5. Map Screen UI
### 5.1. HTML Addition (in `index.html`)
A new `#map-screen` div, placed as a sibling of `#game-container`, `#sanctuary-screen`, and `#game-over-overlay`:
```html
<!-- Map Screen (between fights) -->
<div id="map-screen">
    <h1 id="map-title">LE CHEMIN DU SORCIER</h1>
    <div id="map-player-status">
        <span id="map-hp">PV: 100/100</span>
        <span id="map-gold">Galleons: 0</span>
        <span id="map-blessings">Artefacts: 0</span>
    </div>
    <div id="map-nodes-container">
        <!-- Generated by JS: a horizontal row of node markers -->
    </div>
    <div id="map-node-info">
        <h2 id="map-node-name">---</h2>
        <p id="map-node-desc">---</p>
    </div>
    <button id="btn-enter-node" class="primary-btn">ENTRER</button>
</div>
```
### 5.2. CSS for Map Screen (in `style.css`)
```css
#map-screen {
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: radial-gradient(circle at center, #12100a 0%, #0a0804 100%);
    display: none;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 1400;   /* Between game-container and sanctuary */
    padding: 40px;
}
#map-title {
    font-family: 'Cinzel', serif;
    font-size: 3rem;
    color: var(--accent-gold);
    letter-spacing: 10px;
    margin-bottom: 20px;
    text-shadow: 0 0 20px rgba(197, 160, 89, 0.3);
}
#map-player-status {
    display: flex;
    gap: 40px;
    margin-bottom: 40px;
    font-family: 'Metamorphous', cursive;
    font-size: 1.1rem;
    color: var(--text-secondary);
}
#map-nodes-container {
    display: flex;
    align-items: center;
    gap: 0;
    margin-bottom: 40px;
    overflow-x: auto;
    padding: 20px;
}
.map-node {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: default;
    position: relative;
}
.map-node-icon {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    border: 3px solid var(--border-color);
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 1.5rem;
    background: var(--bg-card-dark);
    transition: all 0.3s ease;
}
.map-node.completed .map-node-icon {
    border-color: #555;
    opacity: 0.4;
}
.map-node.current .map-node-icon {
    border-color: var(--accent-gold);
    box-shadow: 0 0 20px rgba(197, 160, 89, 0.5);
    animation: pulse-glow 2s infinite;
}
.map-node.upcoming .map-node-icon {
    border-color: var(--border-color);
    opacity: 0.6;
}
/* Node type colors */
.map-node-icon.combat { background: rgba(116, 0, 1, 0.3); }
.map-node-icon.shop   { background: rgba(197, 160, 89, 0.2); }
.map-node-icon.boss   { background: rgba(116, 0, 1, 0.5); }
.map-node-label {
    font-family: 'Inter', sans-serif;
    font-size: 0.7rem;
    color: var(--text-secondary);
    margin-top: 8px;
    text-transform: uppercase;
}
/* Connector lines between nodes */
.map-connector {
    width: 40px;
    height: 3px;
    background: var(--border-color);
    flex-shrink: 0;
}
.map-connector.completed {
    background: var(--accent-gold);
    opacity: 0.4;
}
@keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 15px rgba(197, 160, 89, 0.3); }
    50%      { box-shadow: 0 0 30px rgba(197, 160, 89, 0.6); }
}
#map-node-info {
    text-align: center;
    margin-bottom: 30px;
    min-height: 80px;
}
#map-node-name {
    font-family: 'Cinzel', serif;
    font-size: 1.8rem;
    color: var(--accent-gold);
    margin-bottom: 8px;
}
#map-node-desc {
    font-size: 1rem;
    color: var(--text-secondary);
    font-style: italic;
}
```
### 5.3. Map Rendering Function (in `main.js`)
```javascript
function renderMap() {
    const container = document.getElementById('map-nodes-container');
    container.innerHTML = '';
    // Update player status bar
    document.getElementById('map-hp').innerText = `PV: ${state.player.hp}/${state.player.maxHp}`;
    document.getElementById('map-gold').innerText = `Galleons: ${state.player.gold}`;
    document.getElementById('map-blessings').innerText = `Artefacts: ${state.player.blessings.length}`;
    state.run.nodes.forEach((node, index) => {
        // Add connector line before each node (except first)
        if (index > 0) {
            const connector = document.createElement('div');
            connector.className = `map-connector ${node.status === 'completed' || state.run.nodes[index-1].status === 'completed' ? 'completed' : ''}`;
            container.appendChild(connector);
        }
        const nodeEl = document.createElement('div');
        nodeEl.className = `map-node ${node.status}`;
        // Icon per type
        let icon = '';
        let typeClass = '';
        if (node.type === NODE_TYPES.COMBAT) {
            icon = '⚔️';
            typeClass = 'combat';
        } else if (node.type === NODE_TYPES.SHOP) {
            icon = '🏪';
            typeClass = 'shop';
        } else if (node.type === NODE_TYPES.BOSS) {
            icon = '💀';
            typeClass = 'boss';
        }
        nodeEl.innerHTML = `
            <div class="map-node-icon ${typeClass}">${icon}</div>
            <span class="map-node-label">${index + 1}</span>
        `;
        container.appendChild(nodeEl);
    });
    // Show info for current node
    const currentNode = state.run.nodes[state.run.currentNodeIndex];
    const nameEl = document.getElementById('map-node-name');
    const descEl = document.getElementById('map-node-desc');
    if (currentNode.type === NODE_TYPES.COMBAT) {
        nameEl.innerText = currentNode.enemy.name;
        descEl.innerText = `PV: ${currentNode.enemy.hp} | Attaque: ${currentNode.enemy.attack}`;
    } else if (currentNode.type === NODE_TYPES.SHOP) {
        nameEl.innerText = "Diagon Alley";
        descEl.innerText = "Depensez vos Galleons pour des artefacts magiques.";
    } else if (currentNode.type === NODE_TYPES.BOSS) {
        nameEl.innerText = `BOSS: ${currentNode.enemy.name}`;
        descEl.innerText = `PV: ${currentNode.enemy.hp} | ${currentNode.malus.description}`;
    }
}
```
---
## 6. Screen Flow / Transitions
The revised flow introduces the map screen as the hub between encounters:
```
initGame()
  └─> generateRun()
  └─> showMap() ──[ENTER]──> enterCurrentNode()
                                  ├── combat/boss ──> startNewFight()
                                  │     └── victory ──> victorySequence()
                                  │           └── advanceToNextNode()
                                  │                 └── showMap()
                                  │     └── defeat ──> showEndOverlay(false)
                                  └── shop ──> showShop()
                                        └── continuePilgrimage()
                                              └── advanceToNextNode()
                                                    └── showMap()
                                                          ...
  Final boss defeated ──> showRunVictoryScreen()
```
### 6.1. Key Functions to Modify or Create
**`initGame()` -- MODIFY:**
- Remove the direct `startNewFight()` call
- Add `generateRun()` then `showMap()`
- Add event listener for `#btn-enter-node`
```javascript
function initGame() {
    // Event Listeners (existing)
    document.getElementById('btn-play').addEventListener('click', () => !state.isAnimating && executeTurn());
    document.getElementById('btn-discard').addEventListener('click', () => !state.isAnimating && discardAction());
    document.getElementById('btn-continue').addEventListener('click', () => continueFromShop());
    // NEW: Map button
    document.getElementById('btn-enter-node').addEventListener('click', () => enterCurrentNode());
    document.getElementById('btn-guide').addEventListener('click', openGuide);
    document.getElementById('btn-close-guide').addEventListener('click', closeGuide);
    initComboModal();
    // NEW: Generate run and show map instead of starting fight directly
    generateRun();
    showMap();
}
```
**`showMap()` -- NEW:**
```javascript
function showMap() {
    document.getElementById('map-screen').style.display = 'flex';
    document.getElementById('game-container').style.opacity = '0';
    document.getElementById('sanctuary-screen').style.display = 'none';
    renderMap();
    gsap.fromTo('#map-screen', { opacity: 0 }, { opacity: 1, duration: 0.6 });
}
```
**`enterCurrentNode()` -- NEW:**
```javascript
async function enterCurrentNode() {
    const currentNode = state.run.nodes[state.run.currentNodeIndex];
    if (currentNode.type === NODE_TYPES.COMBAT || currentNode.type === NODE_TYPES.BOSS) {
        // Set current enemy from node data
        state.enemy = { ...currentNode.enemy };
        // Update enemy zone UI
        document.getElementById('enemy-name').innerText = state.enemy.name;
        document.getElementById('enemy-atk-value').innerText = state.enemy.attack;
        // Show malus if boss
        if (currentNode.malus) {
            document.getElementById('enemy-intent').innerHTML =
                `Sort offensif : <span id="enemy-atk-value">${state.enemy.attack}</span> degats<br>` +
                `<span style="color: var(--accent-red);">${currentNode.malus.description}</span>`;
        } else {
            document.getElementById('enemy-intent').innerHTML =
                `Sort offensif : <span id="enemy-atk-value">${state.enemy.attack}</span> degats`;
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
    }
}
```
**`startNewFight()` -- MODIFY:**
The critical change: **do NOT reset player HP**. Only reset combat-specific state.
```javascript
async function startNewFight() {
    state.isAnimating = true;
    // Reset combat state only (NOT player HP)
    // state.enemy is already set by enterCurrentNode()
    state.player.discards = state.player.maxDiscards;
    state.selectedIndices = [];
    state.hand = [];
    // New deck
    state.deck = generateDeck();
    shuffle(state.deck);
    // UI Reset
    document.getElementById('hand-container').innerHTML = '';
    document.getElementById('combo-name').innerText = "—";
    // Draw initial hand
    for (let i = 0; i < 8; i++) {
        if (state.deck.length > 0) state.hand.push(state.deck.pop());
    }
    sortHand();
    updateUI();
    await syncHandDOM(true);
    state.isAnimating = false;
}
```
**`advanceToNextNode()` -- NEW:**
```javascript
function advanceToNextNode() {
    // Mark current node completed
    state.run.nodes[state.run.currentNodeIndex].status = "completed";
    state.run.currentNodeIndex++;
    // Check if run is complete (boss was the last node)
    if (state.run.currentNodeIndex >= state.run.nodes.length) {
        state.run.isComplete = true;
        showRunVictoryScreen();
        return;
    }
    // Mark next node as current
    state.run.nodes[state.run.currentNodeIndex].status = "current";
    showMap();
}
```
**`victorySequence()` -- MODIFY:**
After a combat victory, go to `advanceToNextNode()` instead of directly showing the shop.
```javascript
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
```
**`continuePilgrimage()` -- RENAME to `continueFromShop()` and MODIFY:**
After shopping, advance to next node (showing map), not directly to a fight.
```javascript
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
```
**`executeTurn()` -- MODIFY (damage tracking):**
Add a single line after damage calculation:
```javascript
state.run.stats.totalDamageDealt += result.damage;
```
---
## 7. Run Victory Screen
### 7.1. HTML
Repurpose the existing `#game-over-overlay` to handle both defeat and run-complete victory. Alternatively, add a dedicated section inside it:
```html
<!-- Add inside #game-over-overlay, below existing content -->
<div id="run-stats" style="display:none;">
    <p class="stat-line">Ennemis vaincus: <span id="stat-enemies">0</span></p>
    <p class="stat-line">Degats totaux: <span id="stat-damage">0</span></p>
    <p class="stat-line">Galleons gagnes: <span id="stat-gold">0</span></p>
    <p class="stat-line">Boss vaincu: <span id="stat-boss">---</span></p>
</div>
```
### 7.2. Function
```javascript
function showRunVictoryScreen() {
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
    document.getElementById('stat-boss').innerText = state.run.stats.bossName;
    gsap.to(overlay, { opacity: 1, duration: 1 });
}
```
---
## 8. Edge Cases and Considerations
1. **Player HP does not reset between fights.** The `startNewFight()` function must NOT touch `state.player.hp`. Only discards reset per combat. If you want a small heal between fights (e.g., +10 HP on victory), add it in `victorySequence()`.
2. **Boss malus and combo preview.** The `updateComboDisplay()` function must also apply the boss malus to show accurate damage previews. Check if `state.run.nodes[state.run.currentNodeIndex].malus` exists and apply it the same way as in `executeTurn()`.
3. **Shop with no money.** The player might reach a shop with 0 gold. The shop still shows items but the player can skip immediately via the "Continue" button. This is already handled by the existing disabled-button logic on buy buttons.
4. **Deck exhaustion during a fight.** The current code already handles this (it stops drawing when `state.deck.length === 0`). However, with persistent HP and stronger enemies, fights may last longer. Consider whether the player should lose if they run out of cards with the enemy still alive. Currently there is no such check -- the player just plays with fewer cards. This is a design decision; for now, keep the existing behavior.
5. **Enemy shown on map.** The map shows upcoming enemy names and stats. This gives the player strategic information (e.g., knowing a boss's malus before entering). This is standard for Slay the Spire-style roguelikes.
6. **Restart button.** The existing `location.reload()` on the game-over overlay handles full restart cleanly since there is no localStorage persistence yet. If localStorage is added later, it should be cleared on restart.
7. **Duplicate enemies.** The `generateRun()` function picks random enemies per tier. The same enemy name could appear twice in a run. To prevent this, track picked enemies and filter them out:
   ```javascript
   const usedNames = new Set();
   // When picking: filter out already-used names, then pick random
   ```
8. **The `#enemy-atk-value` span.** When the boss malus overwrites `enemy-intent` innerHTML, the original `#enemy-atk-value` span is replaced. The `updateUI()` function does not currently update the enemy attack value dynamically, so this is fine -- just ensure that the enemy-intent is set correctly in `enterCurrentNode()`.
9. **Z-index layering.** The map screen uses z-index 1400, which fits between `#game-container` (no fixed z-index, normal flow) and `#sanctuary-screen` (z-index 1500). The game-over overlay remains at z-index 2000 (highest), and the combo modal at 3000.
---
## 9. Implementation Sequence
1. **Step 1: Add data structures** -- Add `ENEMY_POOL`, `BOSS_POOL`, `NODE_TYPES`, `RUN_TEMPLATE` to top of `main.js`
2. **Step 2: Expand state object** -- Add `run` property with `nodes`, `currentNodeIndex`, `isComplete`, `stats`
3. **Step 3: Add `generateRun()` function** -- in `main.js`
4. **Step 4: Add map HTML** -- Add `#map-screen` div to `index.html`
5. **Step 5: Add map CSS** -- Add all map-related styles to `style.css`
6. **Step 6: Add map JS functions** -- `renderMap()`, `showMap()`, `enterCurrentNode()`, `advanceToNextNode()` in `main.js`
7. **Step 7: Modify `initGame()`** -- Replace `startNewFight()` with `generateRun()` + `showMap()`
8. **Step 8: Modify `startNewFight()`** -- Remove enemy HP reset (enemy is set by `enterCurrentNode()`), remove player HP reset
9. **Step 9: Modify `victorySequence()`** -- Route to `advanceToNextNode()` instead of shop
10. **Step 10: Rename and modify `continuePilgrimage()` to `continueFromShop()`** -- Route to `advanceToNextNode()`
11. **Step 11: Boss malus integration** -- Modify `executeTurn()` and `updateComboDisplay()` to apply malus
12. **Step 12: Run victory screen** -- Add stats HTML, add `showRunVictoryScreen()` function
13. **Step 13: Test the full flow** -- Start game -> map -> fight -> map -> shop -> map -> fight -> ... -> boss -> victory screen -> restart
---
### Critical Files for Implementation
- `/Users/zaccharie/Documents/the God's Hand/main.js` -- Core file requiring the majority of changes: new data structures (enemy pool, run template), new functions (generateRun, renderMap, showMap, enterCurrentNode, advanceToNextNode, showRunVictoryScreen), and modifications to existing functions (initGame, startNewFight, victorySequence, continuePilgrimage, executeTurn, updateComboDisplay)
- `/Users/zaccharie/Documents/the God's Hand/index.html` -- Needs new `#map-screen` div with node container, player status bar, and enter button; also needs run stats section added to `#game-over-overlay`
- `/Users/zaccharie/Documents/the God's Hand/style.css` -- Needs all map screen styles: layout, node icons, connector lines, status bar, pulse-glow animation, responsive breakpoints
- `/Users/zaccharie/Documents/the God's Hand/engine.js` -- No changes needed, but important to understand as reference: the `evaluateHand()` function signature and how `baseDamage` is used, since boss malus intercepts card damage before this function is called
- `/Users/zaccharie/Documents/the God's Hand/doc/specs-func.md` -- Reference document describing the intended progression system (section 5) that this plan implements
agentId: abc6fdee53ed7f2f4 (for resuming to continue this agent's work if needed)
<usage>total_tokens: 59193
tool_uses: 11
duration_ms: 154643</usage>


Questions/answers : 

Pas de soin entre les combats, mode hardcore. Le plan est prêt.

La carte doit avoir des chemins multiples avec des choix et un nouveau type de nœud Dortoir (repos + soin). C'est une architecture type Slay the Spire. 

30% PV max au dortoir, 2 choix max par colonne.





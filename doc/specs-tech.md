Voici les spécifications techniques. Ce document est le pont parfait entre la théorie et le code. En le fournissant à un agent IA, vous lui donnez l'architecture exacte de l'application, ce qui évitera qu'il ne s'éparpille ou ne crée du code "spaghetti".

Spécifications Techniques : La Main du Créateur
Fichier : specs-technique.md
Stack technique : Vanilla JavaScript (ES6+), HTML5, CSS3. (Aucun bundler ou framework requis pour la V1, exécution directe dans le navigateur).

1. Architecture des Fichiers
Le projet sera divisé en modules logiques simples pour faciliter la maintenance et la génération par l'IA :

index.html : Structure de l'interface utilisateur (UI).

style.css : Mise en page (Grid/Flexbox) et animations des cartes.

main.js : Point d'entrée, gestionnaires d'événements (clics) et liaison entre le moteur et l'UI.

engine.js : Logique pure du jeu (génération du deck, mélange, évaluateur de mains).

state.js : Gestion de l'état global de la partie et interface avec le localStorage.

data.js : Constantes du jeu (Dégâts de base, liste des ennemis, liste des bénédictions).

2. Modèles de Données (Data Structures)
2.1. La Carte (Card)
Objet représentant une carte unique.

2.2. L'État du Jeu (GameState)
Objet central sauvegardé dans le localStorage.

3. Moteur de Jeu (engine.js)
3.1. Fonctions de base du Deck
generateDeck() : Crée un array de 52 objets Card en bouclant sur les 4 enseignes et les 13 valeurs.

shuffle(array) : Algorithme de Fisher-Yates pour mélanger la drawPile.

drawCards(count) : Retire count cartes de la drawPile et les ajoute à hand.

3.2. Évaluateur de Mains (evaluateHand(selectedCards))
C'est le cœur algorithmique du jeu. Il prend en entrée un tableau de 1 à 5 objets Card et retourne un objet contenant le nom de la combinaison et les dégâts générés.

Logique de détection (par ordre de priorité, du plus fort au plus faible) :

Vérifier Flush (Couleur) : Toutes les cartes ont la même suit.

Vérifier Straight (Suite) : Les rank des cartes se suivent de manière séquentielle (trier l'array d'abord).

Vérifier les fréquences (pour Carré, Full, Brelan, Paires) : Créer un dictionnaire comptant les occurrences de chaque rank.

Calcul des Dégâts :
Formule : Dégâts Totaux = (Dégâts de Base de la Combinaison + Somme des baseDamage des cartes jouées) * Multiplicateur de la Combinaison

Exemple de constantes pour les combinaisons :

Prière (High Card) : Base 5, Multiplicateur x1

Alliance (Pair) : Base 10, Multiplicateur x2

La Trinité (3 of a kind) : Base 30, Multiplicateur x3

...

La Main du Créateur (Royal Flush) : Base 100, Multiplicateur x10

4. Gestion de la Sauvegarde (state.js)
saveGame() : Convertit l'objet GameState en chaîne JSON (JSON.stringify) et l'écrit dans localStorage.setItem('mainDuCreateur_save', data).

loadGame() : Lit le localStorage. Si une sauvegarde existe, parse le JSON et restaure GameState. Sinon, appelle initNewRun().

5. Flux d'Actions (Main JS)
Voici comment les fonctions doivent s'enchaîner lors des actions de l'utilisateur :

Clic sur une carte en main : Bascule un flag isSelected sur la carte visuellement (CSS class selected). Met à jour dynamiquement l'UI en appelant evaluateHand() sur les cartes sélectionnées pour afficher les dégâts potentiels.

Clic sur "Jouer" :

Vérifie handsLeft > 0 et qu'au moins 1 carte est sélectionnée.

Change la phase en ANIMATION.

Calcule les dégâts finaux via evaluateHand().

Soustrait les dégâts à enemy.currentHp.

Décrémente handsLeft.

Retire les cartes jouées de la hand.

Vérifie les conditions de victoire (enemy.currentHp <= 0) ou de défaite.

Si le combat continue, appelle drawCards() pour remonter à 8 cartes, et repasse en PLAYER_TURN.

Clic sur "Défausser" :

Vérifie discardsLeft > 0 et qu'au moins 1 carte est sélectionnée.

Retire les cartes sélectionnées de la hand.

Décrémente discardsLeft.

Appelle drawCards() pour remonter à 8 cartes.
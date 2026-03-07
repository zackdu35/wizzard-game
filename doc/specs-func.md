Voici un document de spécifications fonctionnelles structuré en Markdown. Il est conçu pour être directement fourni à une IA (ou à un développeur) afin de servir de référence unique tout au long du développement.

Spécifications Fonctionnelles : La Main du Sorcier
Type de projet : Jeu Web (Local Uniquement)
Genre : Roguelike / Deckbuilder
Inspiration : The Demon's Hand (Riot Games) / Balatro

1. Vue d'Ensemble
"La Main du Sorcier" est un jeu de cartes en solo s'exécutant entièrement dans le navigateur web. Le joueur doit vaincre une série d'adversaires en jouant des combinaisons de cartes (inspirées du poker) pour accumuler un score de "Dégâts". Entre les combats, le joueur améliore son deck et achète des artefacts magiques à Diagon Alley.

2. Contraintes Techniques
Environnement : Navigateur Web (Client-side uniquement, pas de serveur backend).

Technologies : HTML5, CSS3, JavaScript (ES6+).

Stockage : Utilisation de l'API localStorage pour sauvegarder et charger la progression du joueur (état du deck, Galleons, étape actuelle, artefacts).

Déploiement : Fichiers statiques lisibles directement en ouvrant le fichier index.html.

3. Direction Artistique et Lexique (Thématique)
Le jeu transpose les mécaniques de poker dans l'univers des sorciers de Poudlard (Dark Academia).

3.1. Le Deck (52 Cartes)
Les 4 Enseignes (Maisons) : Gryffondor, Poufsouffle, Serdaigle, Serpentard.

Les Valeurs (Ranks) : * Chiffres : 2 à 10.

Figures (11 à 14) : Préfet (11), Prodigy (12), Professeur (13), Directeur (14).

3.2. Les Sortilèges (Combinaisons) et Dégâts de Base
Chaque combinaison jouée génère un score (Dégâts).

Incantation (Carte Haute)

Duo Enchanté (Paire)

Double Sortilège (Double Paire)

Trinité Magique (Brelan)

Séquence Enchantée (Suite / Straight)

Harmonie de Maison (Couleur / Flush)

Convocation Complète (Full House)

Quatre Maisons (Carré / Four of a kind)

Quinte Ensorcelée (Quinte Flush)

La Main du Sorcier (Quinte Flush Royale)

4. Mécaniques de Jeu (Le Combat)
4.1. Déroulement d'un Tour
Pioche : Le joueur commence avec 8 cartes en main.

Action du joueur : Il peut sélectionner jusqu'à 5 cartes.

Lancer le Sort (Play) : Valide la combinaison, calcule les dégâts, les soustrait aux PV de l'adversaire. Coûte 1 "Action de Jeu".

Défausser (Discard) : Jette les cartes sélectionnées sans faire de dégâts. Coûte 1 "Action de Défausse".

Remplissage : La main est complétée pour revenir à 8 cartes (jusqu'à épuisement du deck).

4.2. Limites et Conditions
Le joueur dispose d'un nombre limité de "Mains à jouer" (ex: 4 par combat) et de "Défausses" (ex: 3 par combat).

Victoire : Les PV de l'adversaire tombent à 0 ou moins. Le joueur gagne des Galleons (monnaie).

Défaite : Le joueur n'a plus de "Mains à jouer" et l'adversaire a encore des PV. Le run est terminé (permadeath).

5. Progression et Économie (Méta-jeu)
5.1. La Carte (Le Chemin)
La progression se fait par étapes (nœuds) générées séquentiellement :

Épreuve (Combat de base) : Affronte un adversaire mineur (ex: Le Troll du Couloir, 300 PV).

Épreuve Majeure (Boss) : Affronte un adversaire majeur (ex: Le Détraqueur, 1500 PV) avec un malus spécifique (ex: "Les cartes 'Serdaigle' ne font pas de dégâts").

Diagon Alley (Boutique) : Nœud pacifique pour dépenser ses Galleons.

5.2. Diagon Alley
Interface permettant d'acheter deux types d'améliorations :

Artefacts Magiques (Reliques) : Objets passifs permanents (Maximum 5 emplacements).

Exemple : Baguette de Sureau (+1 Défausse par combat).

Exemple : Potion Polyjuice (Les combinaisons "Harmonie de Maison" infligent +30 dégâts de base).

Cartes de Renfort : Permet d'ajouter des cartes spécifiques à son deck ou de modifier des cartes existantes (bonus de dégâts sur une carte précise).

6. Interface Utilisateur (UI)
L'écran de jeu doit être découpé en trois zones distinctes (de haut en bas) :

6.1. Zone Supérieure (Adversaire)
Nom de l'adversaire et avatar/icône.

Barre de PV (Points de Vie restants / PV max).

Effet passif de l'adversaire (si applicable).

6.2. Zone Centrale (Tableau de Bord)
À gauche : Statistiques du joueur (Galleons, PV Sorcier, Défausses restantes).

Au centre : Emplacement des cartes jouées (les cartes s'y placent lors de la validation).

Texte dynamique : Affichage en temps réel du sortilège détecté ("Double Sortilège", "Trinité Magique"...) en fonction des cartes actuellement sélectionnées dans la main.

6.3. Zone Inférieure (Le Joueur)
Affichage des 8 cartes en main.

Possibilité de cliquer sur les cartes pour les sélectionner (elles se soulèvent visuellement).

Bouton "LANCER LE SORT" (actif si 1 à 5 cartes sélectionnées).

Bouton "DÉFAUSSER" (actif si 1 à 5 cartes sélectionnées et défausses > 0).

7. Architecture des Données (Structure JSON pour localStorage)
Le jeu doit maintenir un objet d'état (State) structuré ainsi :

player_gold : Nombre (Galleons actuels).

current_stage : Nombre (Niveau actuel sur la carte).

deck : Array d'objets (Liste complète des cartes avec valeur, maison, et modificateurs).

artifacts : Array d'ID (Liste des artefacts actifs).

game_status : Chaîne ("in_combat", "in_shop", "game_over").

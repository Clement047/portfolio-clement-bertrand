# Accueil immersif et séquence cinématique — 30 octobre 2026

Modifications dans le projet Astro local. Le fichier Blender et le GLB FINAL original n’ont pas été réécrits. Sauvegardes des sources dans `.backups/home-cinematic-2026-10-30`.

## Navigation et animation
- Arrêt à 88 % de la longueur du parcours d’origine (image 159,256 avec 384 échantillons), correspondant à la capture fournie. Le défilement est verrouillé pendant l’interaction.
- Sparky et levier : deux clips originaux, un seul temps absolu partagé, délai initial du levier conservé. 254 échantillons testés, orientation du levier conforme aux pistes originales.
- Montée automatique de 2,1 secondes sur le parcours inchangé, jusqu’à l’image 188.
- Hyperspace officiel Seer.js : 1,2 seconde lente, accélération jusqu’à 2,9 s, vitesse de croisière jusqu’à 4 s, décélération jusqu’à 5,6 s, fondu progressif vers la scène projets jusqu’à 7 s. Aucun effet avant la fin de la montée.
- Fondu réel entre les deux scènes via deux cibles de rendu plafonnées à 1280 × 720, dans le contexte graphique existant. Aucun contexte WebGL ni boucle d’animation supplémentaire.

## Accueil
- `/` ouvre la ville ; `/test-ville` reste accessible.
- Chargement avec animation légère, barre de progression, conseil casque/écouteurs et cinq phrases liées aux projets existants.
- Le chargement reste visible pendant la préparation des matériaux, animations et programmes graphiques, puis deux rendus de préchauffage.
- Après préparation : ville en arrière-plan, SVG original `enter-the-experience.svg`, entrée explicite et lien vers `/portfolio-2d/`.
- La version 2D comporte les sept projets et ne charge pas la ville ni un moteur WebGL. Les liens retour des fiches projets pointent vers cette liste.
- Aide au défilement bidirectionnel près d’À propos ; prise en charge molette, clavier et glissement tactile.

## Atmosphère et coûts de rendu
- Titre À propos bleu plus sombre, émission abaissée à 0,65 (matériaux clonés uniquement sur le titre).
- Douze nappes locales de brume animée dans un seul appel de rendu, avec test de profondeur, bords diffus, densité variable et fondu à proximité de la caméra. Couche de brume en hauteur et brouillard lointain conservés et rééquilibrés.
- Densité de pixels plafonnée à 1,25 et budget de deux millions de pixels. Réduction progressive jusqu’à 0,75 en cas de cadence durablement insuffisante.
- Anticrénelage multisample évité ; ombres de la ville mises en cache, rafraîchies à 5 Hz pendant l’interaction. Pause des mises à jour quand l’onglet est masqué.
- Pas de réflexions de sol supplémentaires.

## Modèle web vérifié
- FINAL : 690,501,736 octets ; WEB : 245,811,156 octets ; réduction 64.4 %.
- Variante séparée `public/models/villeportfolio_WEB.glb`, utilisée par le chargement web. Textures hors REFLECTIONS plafonnées à 1024 pixels (atlas CP2 : 512), données identiques dédupliquées.
- Les cinq vues de textures REFLECTIONS/cadre sont conservées octet pour octet.
- 3 759 vues binaires hors textures réduites vérifiées inchangées : géométrie, morphs, armatures et échantillons d’animation. Structure des nœuds, scènes, matériaux, textures, accesseurs, maillages et animations strictement identique.
- SHA256 original : `22387e18eac52053202acee6ac1574d1300fdfbb1af634ef92b320545c200a60`.

## Vérifications et limites
- Tests d’intégration sur le vrai WEB : phases complètes, caméra finale identique à l’image 188, 8 néons du train attachés, nouveau texte conservé, ancien texte seul masqué, sol sans passe miroir.
- Empreinte des échantillons d’animation inchangée : `042f0f80cfe3574ddba181f0ada7984fc65aa4e31bf4ec285eeec53e905f53b0`.
- Test Seer avec vraies classes Three.js et adaptateur instrumenté : préparation sans déplacement du canvas, 216 images hyperspace et 84 images de fondu, aucun second contexte/RAF, restitution correcte du rendu.
- Chargement et liens vérifiés dans le navigateur intégré ; SVG original affiché et version 2D accessible.
- Compilation Astro réussie (10 pages). Avertissement non bloquant de taille du paquet Three.js.
- Le moteur graphique du navigateur intégré est indisponible (`WebGL context unavailable`) : le rendu 3D, l’aspect final de la brume et le gain en images/seconde restent à vérifier sur le navigateur utilisateur. Les tests de séquence et de fidélité binaire ne constituent pas une validation visuelle GPU.

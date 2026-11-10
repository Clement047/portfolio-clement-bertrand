# Scène spatiale GLB et intégration orbitale — 30 octobre 2026

## Livrables

- Source Blender éditable : `C:/Users/clemb/Documents/Blender/Portfolio/ESPACE_PROJETS/ESPACE_PROJETS.blend` (5,08 Mo), textures et police intégrées.
- GLB : `public/models/space/ESPACE_PROJETS.glb` (5 352 112 octets), avec une copie à côté du `.blend`.
- Source de reconstruction : `ESPACE_PROJETS/scripts/build_space.py` ; les modèles fournis dans `cine` restent la source.
- Prévisualisations natives : `01_arrivee.png`, `02_approche.png`, `03_saturne.png` et `04_GLB_roundtrip.png`.
- Manifestes : `scene_manifest.json`, `public/models/space/space-render.json`.
- Crédits : `CREDITS.txt`, également accessible depuis la scène web.
- Aperçu isolé : `/test-espace/` ; scène finale accessible par le parcours principal `/`.

## Construction Blender

Six collections : Saturne, astéroïdes, titre, galaxie, éclairages et caméra.

Saturne et ses anneaux proviennent du modèle fourni dans `saturn.zip`. Les UV et détails de surface sont conservés ; la légère déformation de la sphère source est normalisée et les textures sont adaptées au bleu-violet. Le globe et les anneaux gardent une vraie géométrie. Les matériaux sont PBR, avec textures intégrées et paramètres exportables.

88 astéroïdes proviennent du champ Sereib fourni, licence CC BY 4.0. Les roches sont séparées en éléments puis instanciées à partir de 16 géométries réutilisées, avec échelles, distances et orientations irrégulières. Textures ramenées à 512 pixels. Le GLB compte 21 géométries uniques au total, et non une géométrie dupliquée pour chaque roche.

Le panorama galactique émissif est créé procéduralement dans Blender et intégré au GLB. Des étoiles tridimensionnelles avec parallaxe complètent le panorama dans Three.js.

Le titre est composé de copies des **deux véritables courbes** `Text` / `Text.001` de la ville. Seul le corps devient `PROJETS`. Police Agency FB Bold intégrée, taille 1, extrusion 0,15000000596, biseau 0,02500000037, résolution de biseau 4, résolution de courbe 12, échelle 3,1997830868. Alignement et espacement conservés. Le matériau reprend le réglage effectif actuel du titre dans le navigateur (émission 0,65 et bleu assombri). Les deux éclairages du titre sont repris et déplacés avec la composition. Les courbes restent éditables dans le `.blend` ; elles deviennent des maillages dans le GLB.

La caméra `SPACE_ScrollCamera` suit une animation Blender `SPACE_Camera_Approach`, images 0–240 à 24 i/s. Saturne est d’abord distante derrière le titre, puis devient presque plein écran. `SPACE_ProjectOrbit_Anchor` fixe le plan des cartes, parallèle aux anneaux ; son paramètre `orbit_radius` vaut 22. Il reste modifiable dans Blender.

## Fidélité du rendu

Les textures réellement redimensionnées/recolorées ont été réempaquetées, évitant que l’export reprenne les anciennes images contenues dans le modèle source.

L’export Blender 5.2 transmettait les deux soleils à une force identique malgré des énergies natives différentes : leurs intensités glTF ont été corrigées à 1844,1 et 478,1. Three.js applique ensuite la même conversion `/683` que celle calibrée pour la ville, soit 2,7 et 0,7. Les deux points du titre sont conservés.

Le GLB exporté a été réimporté et rendu dans Blender à la même caméra : différence absolue moyenne RGB de **0,463 sur 255** avec le rendu natif. Cela vérifie le contenu exporté et sa réimportation ; ce n’est pas une mesure de fidélité du rendu GPU du navigateur.

## Intégration web et réutilisation de l’orbite

La scène provisoire n’est plus utilisée par `CityExperience.astro`. Le nouveau contrôleur charge le GLB, utilise sa caméra animée et conserve les matériaux, ajoute le mouvement discret du titre/des roches et les étoiles à parallaxe.

L’orbite n’a pas été recréée. Le fichier `initProjectOrbit.js` accepte un hôte optionnel : scène, caméra, canvas, renderer, groupe et progression. Les classes de cartes et la fonction de trajectoire existantes ont été extraites dans des noyaux partagés. Les points d’entrée historiques restent compatibles avec la page 2D. La scène spatiale utilise le Three.js déjà chargé, sans second contexte WebGL ni seconde boucle de rendu orbitale.

Les sept cartes, les vidéos HLS/MP4, les polices, les shaders de verre, les descriptions, les compétences, les contrôles de lecture et les destinations `/projets/...` restent les ressources existantes. Les trois cartes sans vidéo gardent leur présentation non vidéo d’origine ; aucun média fictif n’a été ajouté.

Les positions des cartes suivent le plan des anneaux ; elles deviennent progressivement visibles pendant l’approche. La rotation reprend le calcul de l’orbite originale, son amortissement et l’orientation tangentielle. Le clic utilise le raycasting original ; la planète bloque les clics vers des cartes qu’elle masque.

Le défilement spatial est réversible : approche jusqu’à 65 %, puis progression dans l’orbite. Remonter fait reculer la caméra, puis déclenche le passage de retour à la ville. Les petites variations de molette et de pavé tactile sont cumulées pour ne pas bloquer ce retour. Le bouton Retour rembobine d’abord l’approche au lieu de téléporter la caméra.

L’hyperespace existant est réutilisé dans les deux sens. La descente inverse réévalue la **même animation de caméra** et la même interpolation que l’ascension, jusqu’au point d’arrêt de la ville. Le code de l’ascension avant et les données d’animation n’ont pas été modifiés. Les rotations et flottements ont une horloge spatiale continue pour éviter un saut à la fin du fondu.

## Fichiers de code créés

- `src/lib/space/experience.js` : chargement GLB, caméra, rendu, réutilisation de l’orbite et interface.
- `src/lib/space/scroll.js` : progression réversible et échantillonnage du retour.
- `src/lib/space/galaxy.js` : étoiles de parallaxe.
- `src/lib/space/space.css` : interface spatiale.
- `public/project-orbit/GlassVideoCardCore.js` et `OrbitPathCore.js` : noyaux extraits des composants existants.
- `src/pages/test-espace.astro` : vérification isolée, sans charger la ville.

## Fichiers de code modifiés

- `src/components/home/CityExperience.astro` : remplacement du contrôleur provisoire et raccord de retour.
- `src/scripts/initProjectOrbit.js` : hôte partagé optionnel, coordonnées locales/mondiales et obstruction par Saturne.
- `public/project-orbit/GlassVideoCard.js` et `OrbitPath.js` : points d’entrée historiques, liés aux noyaux partagés.

Aucune page 2D n’est modifiée. `arrival.js`, le GLB de la ville, son parcours et ses animations sont inchangés. L’ancien contrôleur provisoire reste dans les sources pour restauration, sans être importé. Sauvegardes : `.backups/space-sequence-2026-10-30`.

## Vérifications réalisées

- Source Blender : deux vrais objets FONT éditables, police intégrée, corps PROJETS, extrusion, biseau et échelle identiques à la construction source.
- GLB : Saturne, anneaux, titre, 88 roches, caméra et clip présents ; titre entier dans le cadre initial, approche monotone vers la planète, orbite passant dans une zone lisible.
- Orbite : sept véritables classes de cartes, placement sur l’orbite, vrai raycasting vers `/projets/sull`, zéro rendu supplémentaire du contrôleur intégré.
- Régression 2D : 360 poses par défaut identiques à l’ancienne fonction ; implémentation des cartes identique après extraction et normalisation des fins de ligne ; fichier de page 2D inchangé.
- Navigation : progression avant/arrière, retour par petites variations de molette et raccord inverse testés.
- Seer : tests des 126 images de montée, 216 images hyperspace et 84 images de fondu toujours réussis.
- Conservation de la ville : SHA256 du GLB FAST identique à avant : `dafe277b2b0d8fab62393f04e52a8e1d83be69185429d8d6b0a4c12d5f630f82`.
- Compilation Astro : 11 pages construites ; avertissement non bloquant sur le poids du module Three.js.

## Limite de validation

Le navigateur intégré n’obtient toujours pas de contexte WebGL. La page d’aperçu et le retour à la page 2D ont été vérifiés, mais le rendu GPU complet, la lecture réelle des vidéos et la fluidité de la séquence entière restent à confirmer dans le navigateur utilisateur. Les rendus Blender et les tests de données, trajectoires, raycasting et réutilisation ne sont pas présentés comme une validation visuelle WebGL. Les ajustements éventuels concernent donc le contraste final, le confort de lecture des cartes et les performances sur le matériel cible.

## Ajustements visuels du 30 octobre 2026
- Saturne éloignée de 70 unités au départ, approche progressive conservée ; ancrage des cartes relevé, rayon 26, cartes ×1,45 et orientation progressive vers le lecteur (uniquement en 3D).
- Panorama violet sans étoiles imprimées ; 2 200 étoiles réparties sur trois profondeurs, halo atmosphérique et dérive lente du fond. Correction du biais des ombres de Saturne/anneaux.
- Hyperespace : révélation tardive dans le ciel, masque issu de la profondeur de la ville, protection des silhouettes jusqu’à la fin de la montée, disparition progressive du décor en 0,75 seconde après la frame 188. Arrivée spatiale par fondu radial adouci. Parcours et clips originaux inchangés.
- GLB spatial : 5 656 860 octets ; aperçu natif `polish_arrivee.png` et `polish_saturne.png`. La source de ville et son GLB FAST restent inchangés.
- Vérifications : compilation des 11 pages, chargement réel du GLB, 7 cartes/navigation, 360 orientations lisibles, conservation des poses 2D, retour vers la ville, masque de profondeur et shaders contrôlés. Le contrôle visuel WebGL dans le navigateur de l’utilisateur reste nécessaire ; les aperçus natifs ne comprennent pas les cartes HTML/vidéos ni les effets propres au navigateur.

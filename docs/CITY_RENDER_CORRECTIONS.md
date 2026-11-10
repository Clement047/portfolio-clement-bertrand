# Corrections du rendu appliquées au projet Astro

Projet : `C:\Users\clemb\Documents\Portfolio\portfolio-clement-bertrand`.

## Résultat

Le composant utilise toujours `public/models/villeportfolio_FINAL.glb`. Le modèle principal et le fichier Blender n’ont pas été remplacés. Les corrections de rendu sont séparées dans `src/lib/city-render/`.

Les blocs de sélection de caméra, sélection de son clip, échantillonnage de trajectoire, gestion du scroll et mise à jour de la caméra sont conservés à l’identique. Une comparaison numérique des 188 poses confirme également l’absence de modification après ajout des adaptations d’assets.

## Modifications

- Suppression des tests globaux qui recoloraient 20 matériaux en violet et neutralisaient 28 émissions. Les affiches REFLECTIONS utilisent à nouveau leur matériau lumineux importé, sans blanchissement de base ni ajout d’une contribution diffuse artificielle.
- Masquage en mémoire du faux volume `CP2_ATMOSPHERE_PREVIEW_ONLY`, qui était devenu une boîte opaque. Une atmosphère de profondeur `FogExp2` le remplace dans le rendu web.
- Masquage en mémoire de cinq anciens panneaux dont les positions natives sont NaN. L’export les avait ramenés sur des positions finies, créant notamment le panneau géant « STATUS ». Aucun objet ou matériau n’est supprimé du GLB. La visibilité native du soleil `Sun` et du cube de travail masqués dans Blender est également respectée, sans masquer les Empty de contrôle du personnage.
- Reproduction des 17 graphes CP4 à partir des paramètres extraits de Blender : coordonnées de position, normale géométrique, orientation des façades, échelle des motifs, masques de toit, couleur, émission et canaux métal/rugosité. Les géométries et les UV des bâtiments restent inchangés.
- Restauration des 12 sources Area via RectAreaLight, rattachées aux nœuds originaux. Les deux sources RIM suivent leurs transformations exportées et retrouvent leurs puissances animées. Les disques sont représentés par des rectangles de même aire.
- Ombres limitées à la lune principale et à `Spot.005`, avec des cartes 1024². Les autres lumières restent présentes ; le nombre de cartes est volontairement limité pour éviter le coût de toutes les ombres ponctuelles.
- AgX, exposition `2^0,5`, sortie sRGB, environnement uniforme issu du World Blender, halo léger via bloom et OutputPass.
- Compensation de lumière `1/683` validée par une comparaison A/B au même point de caméra. Sans cette compensation, les sources photométriques produisent encore des façades surexposées dans ce pipeline ; avec elle, le contraste se rapproche de la référence Blender. Les rapports entre puissances et couleurs des sources sont conservés ; les émissions de matériaux ne sont pas divisées par ce facteur.
- Lecture des **62 clips appartenant à la ville**. Les **56 clips de l’autre scène** restent dans le fichier et ne sont plus joués contre la mauvaise hiérarchie. Les 74 avertissements PropertyBinding ne sont plus reproduits dans les tests.
- Restauration de quatre traînées animées du synthétiseur à partir de l’export autonome précédemment vérifié : 239 cibles morph par surface, boucle de huit secondes, sans dépendance au scroll.
- Restauration des surfaces portables de la fusée et des accessoires à partir de l’export SPARKY vérifié, avec leurs textures cuites et leurs normales. Les nœuds, parents et cibles d’animation de la ville sont conservés. Aucune géométrie du personnage riggé n’est remplacée.
- Ajout d’une déclaration UTF-8 pour éviter les libellés français corrompus sur la page de test.

Les compléments `public/models/city-render/SparkySurfaces.glb` et `SynthTrails.glb` contiennent uniquement les données nécessaires aux réparations de surfaces et morphs. Ils ne remplacent pas la ville et n’ajoutent pas de décor.

## Vérifications

- `camera_code_preservation.json` : les quatre sections de code protégées sont identiques à l’original sauvegardé.
- `verification.json` : hash des 188 poses de caméra identique avant/après, 62 clips valides, aucune piste partiellement liée, aucun avertissement PropertyBinding, 17 programmes de façades, 12 réparations de surfaces, quatre traînées avec fermeture de boucle vérifiée.
- Vérification dans le navigateur de la vue initiale et de deux sections du parcours ; captures `apres_vue1.png`, `apres_vue2.png`, `apres_vue3.png`.
- Les surfaces lumineuses et leurs couleurs restent visibles quand les bâtiments sont sombres. Les toits ne reçoivent plus le motif de fenêtres via les anciennes coordonnées UV.
- La compilation Astro finale passe : neuf pages produites. Le seul avertissement de build concerne la taille du bundle Three.js.
- Le dernier chargement de `/test-ville` dans le navigateur ne signale aucune erreur. La capture `rendu_final.png` présente le rendu normal, sans panneau de diagnostic.
- `files_preserved.json` confirme que l’empreinte du GLB principal est identique à celle relevée avant les modifications.

## Sauvegarde et réglages

Sauvegarde du composant original : `.backups/city-render-2026-10-29/CityExperience.astro` dans le projet. Une seconde copie de référence se trouve à côté de ce compte rendu. Le GLB n’ayant pas été modifié, sa conservation est contrôlée par son empreinte plutôt que par une nouvelle copie de 690 Mo.

Le mode `/test-ville?city-audit=1`, en développement uniquement, permet de comparer les niveaux lumineux sans réexporter ou réécrire le modèle. Le rendu normal de `/test-ville` n’affiche pas ce contrôle.

## Limites connues

- Le volume Blender et les disques Area ne sont pas identiques à un brouillard de profondeur et à des sources rectangulaires. Le rendu n’est pas une copie pixel à pixel de Blender.
- Le rendu EEVEE de référence en arrière-plan a rencontré des erreurs de compilation GPU. L’image `blender_reference_1.png` a donc été calculée avec Cycles sur CPU, sans sauvegarde du changement de moteur. Elle sert de référence de matériaux et de contraste, pas de preuve d’identité avec EEVEE.
- Dix images de l’ancien kit Modular SciFi sont déjà absentes du fichier Blender sur disque. Elles n’ont pas été remplacées par des textures inventées ; leurs matériaux devront être reliés aux fichiers originaux si ces éléments doivent être restaurés exactement.
- Le décalage temporel d’une image identifié à l’extrémité du clip caméra n’a pas été modifié : la navigation est volontairement conservée à l’identique dans cette intervention.
- Three.js signale encore la dépréciation de `Clock`, héritée du composant. Cela n’affecte pas les données d’animation. Les avertissements de précision du compilateur ANGLE observés lors des essais ne sont pas des échecs de compilation de shader.

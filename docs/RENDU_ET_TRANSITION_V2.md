# Raccord hyperspace, rendu et interface — 30 octobre 2026

Sauvegardes : `.backups/cinematic-polish-2026-10-30`. Modifications web uniquement ; fichier Blender, GLB et données originales d’animation inchangés.

## Raccord
L’effet officiel Seer commence dès la montée. Une révélation progressive depuis le haut de l’image mélange la ville post-traitée et les étoiles. Le rendu de la ville conserve son exposition, le mélange se fait en espace linéaire. Le ciel est entièrement remplacé à l’arrivée à l’image 188, puis le même champ d’étoiles continue sans réinitialisation. Le profil lent/accélération/ralentissement et le fondu vers les projets restent en place.

Tests instrumentés avec les vraies classes Three.js et Seer : 126 images de montée, 216 images hyperspace, 84 images de fondu ; aucune création d’un second contexte WebGL ni d’une seconde boucle de rendu Seer. Test d’intégration sur le GLB : Sparky/levier synchronisés, mêmes échantillons d’animation, même matrice caméra finale 188, 8 néons du train préservés.

## Entrée et navigation
Le préchauffage des scènes futures n’est plus programmé une seconde après l’entrée : cette compilation pouvait interrompre le premier scroll. Il intervient une seule fois pendant l’interaction verrouillée de Sparky. L’inertie d’entrée est plus réactive (constante 11 au lieu de 7). Les programmes graphiques asynchrones ne constituent pas une condition d’accès.

Un composant commun reprend les effets d’origine du SVG : déformation élastique au pointeur, glow par tracé, glitch bleu/violet et scintillement. L’algorithme de déformation et ses paramètres sont ceux d’Intro.astro ; les mises à jour sont évitées quand le titre est masqué ou au repos. Pas de délai de sortie imposé avant de pouvoir défiler.

Les liens VERSION 2D / VERSION 3D sont fixes et disponibles sur la ville (chargement, visite, interaction, hyperspace, projets), la version 2D et les fiches projets. Les deux sens ont été testés dans le navigateur.

## Chargement
Nouvel habillage bleu-violet reprenant la direction artistique de l’introduction : fond dégradé sombre, cadre fin, lignes lumineuses, animation de signal, barre dégradée et conseil casque. Les phrases sur les projets et leur minuterie ont été supprimées. Respect de la préférence de réduction des animations. Aperçu réel conservé dans `chargement_da_v2.png`.

## Rendu
- Budget maximal porté à 3,6 millions de pixels, DPR plafonné à 1,5 et réduction adaptative limitée à 1 : éviter le rendu sous-résolu flou.
- SMAA avant OutputPass en espace linéaire, selon l’implémentation Three.js installée ; filtrage anisotrope jusqu’à 8 pour les textures.
- Brouillard lointain ramené de 0,0065 à 0,0032 ; couche basse plus fine, densité 0,012 et hauteur 4,8 ; contribution basse maximale 0,45. Réduction du voile bleu uniforme, maintien des nappes locales animées avec deux échelles de bruit et nuances violet/cyan.
- Environnement PBR léger avec gradient nocturne et bandes de lumière étroites pour donner du relief aux métaux, sans passe de réflexion du sol.
- Deux rebonds ponctuels locaux cyan/violet à portée limitée, sans ombres supplémentaires. Les lumières et émissions existantes ne sont pas supprimées.
- Bloom légèrement resserré sur les sources lumineuses (seuil 1,05).

## Vérification et limites
Compilation Astro et tests de séquence réussis. Chargement, SVG d’entrée et liens des deux versions vérifiés dans le navigateur intégré. Le contexte WebGL de cet aperçu est toujours désactivé ; l’aspect final du rendu, les shaders sur le pilote utilisateur et la fluidité restent à confirmer dans son navigateur. Les tests instrumentés ne remplacent pas une validation visuelle GPU.

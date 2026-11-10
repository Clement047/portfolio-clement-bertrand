# Chargement allégé et page orbitale d’origine — 30 octobre 2026

Sauvegardes des sources avant modification : `.backups/orbit-fast-2026-10-30`. Fichier Blender, GLB FINAL et variante WEB précédents conservés.

## Page classique
Le lien VERSION 2D pointe toujours vers `/portfolio-2d/`, dont le contenu est maintenant la véritable page sauvegardée : MainLayout, Intro, Presentation, ProjectOrbit avec `/project-orbit/`, BlackHoleLoader et atmosphère d’origine. La liste statique de remplacement a été retirée. Le composant orbital et ses ressources n’ont pas été modifiés.
Les fiches projets reviennent vers `/portfolio-2d/#project-orbit`. Le lien permanent VERSION 3D est visible même pendant le chargement classique.
Le chargement classique imposait 20 secondes d’attente minimale : cette durée est ramenée à 700 ms, puis la sortie est raccourcie. Le chargement ne masque donc plus une page prête pendant 20 secondes. En cas d’absence de WebGL, son overlay est retiré pour laisser lire le contenu.

## Ville : compression sans perte supplémentaire
- Variante WEB précédente : 245 811 156 octets.
- Nouvelle variante `villeportfolio_FAST.glb` avec EXT_meshopt_compression : 164 776 624 octets.
- Transfert `villeportfolio_FAST.glb.gz` : 127 847 028 octets, soit environ 48 % de moins que WEB.
- Encodage Meshopt version 0, sans réordonnancement, quantification, simplification ou réduction d’image supplémentaire.
- 3 357 vues compressées décompressées avec le décodeur réellement fourni par Three.js : comparaison octet pour octet avec les données WEB réussie.
- Nœuds, scènes, animations, accesseurs, maillages, armatures, matériaux et références d’images strictement identiques. Toutes les images, dont REFLECTIONS, conservent leurs octets.
- Gzip décompressé en streaming via l’API native ; fallback vers le GLB standard pour les navigateurs non compatibles. Prise en charge des serveurs qui décompressent déjà les réponses HTTP.
- DistrictAdditions, SparkySurfaces et SynthTrails commencent à se charger en parallèle du modèle principal ; un cache de promesses évite les requêtes et analyses en double.
- Des mesures `City startup timing` distinguent le modèle/décodage de la préparation graphique dans la console locale.

## Finition du rendu
Une légère atténuation des bords est intégrée dans la passe de sortie existante : aucune passe plein écran ni texture de rendu supplémentaire. 96 poussières fines apparaissent seulement près de la caméra dans les rues, avec nuances cyan-violet, mouvement lent et profondeur testée ; un seul appel de rendu supplémentaire. Les réglages récents de lumière PBR, SMAA et brume localisée sont conservés. Pas de nouvelles réflexions coûteuses au sol.

## Vérifications
- Test complet via HTTP localhost : gzip, décodage Meshopt réel et GLTFLoader réel réussis, avec textures remplacées uniquement par des objets factices pour le test CPU. 62 clips applicables à la ville, 56 étrangers, aucun clip mixte. Données d’animation identiques, empreinte `042f0f80cfe3574ddba181f0ada7984fc65aa4e31bf4ec285eeec53e905f53b0` (empreinte complète dans le JSON de vérification).
- Test de transport : décompression identique au GLB FAST, SHA256 `dafe277b2b0d8fab62393f04e52a8e1d83be69185429d8d6b0a4c12d5f630f82`, fallback sans DecompressionStream validé.
- Cache : trois ressources démarrées en parallèle, pas de requête dupliquée.
- Régressions caméra 188, Sparky/levier, 8 néons du train et raccord Seer : tests réussis.
- Compilation Astro : 10 pages réussies, avertissement non bloquant sur la taille du module Three.js.
- Page originale affichée et bouton d’entrée contrôlé dans le navigateur ; composant orbital retrouvé. L’aperçu intégré n’a toujours pas de contexte WebGL : l’animation orbitale, le rendu 3D et les temps réels de chargement/rendu sur le navigateur utilisateur restent à confirmer. La baisse de volume transféré est mesurée ; elle ne garantit pas une baisse proportionnelle du temps total, qui inclut le décodage des images et leur préparation GPU.

# Scène spatiale — composition issue de la référence, 30 octobre 2026

Source éditable : Documents/Blender/Portfolio/ESPACE_PROJETS/ESPACE_PROJETS.blend.
Export intégré : public/models/space/ESPACE_PROJETS.glb.
Sauvegarde native précédente : ESPACE_PROJETS/backup_before_reference_recomposition.

La planète a été réduite et éloignée ; ses anneaux ont été réorientés en diagonale et élargis. Les cartes disposent d’une ancre indépendante devant le décor : ellipse 12 × 8, inclinaison 20°, facteur de taille 1,15. Le rapprochement forcé de la caméra a été supprimé. Le titre garde sa construction originale, devient émissif puis s’efface pendant l’approche.

Le GLB comporte 180 astéroïdes utilisant les maillages partagés et 900 étoiles géométriques à plusieurs profondeurs. Lumière principale froide depuis le haut à droite, faible remplissage, arrière-plan sombre et source lumineuse éloignée. Le navigateur ajoute le halo atmosphérique et un dégradé stellaire continu pour éviter les paliers d’alpha de la texture portable.

Vérifications : GLB réellement chargé par GLTFLoader ; sept cartes réelles contrôlées sur 720 positions de rotation, totalité de leurs volumes dans le cadre en 16:9 et 16:10 ; navigation réelle vers les pages projets ; comportement 2D inchangé ; tests du fondu Seer et du retour ; compilation des onze routes. La ville GLB FAST conserve son empreinte SHA-256. Les pages projets n’ont pas été modifiées.

Les aperçus Blender montrent le décor natif, sans les cartes vidéo ajoutées par Three.js. La fidélité visuelle finale dans le navigateur reste à contrôler sur le poste de l’utilisateur : le navigateur intégré n’a pas de contexte WebGL disponible.

## Correction : titre fixe et orbite sur Saturne
Le titre ne rétrécit plus et ne flotte plus : sa transformation reste constante. Le parcours spatial passe à sa gauche puis derrière son emplacement. Aucune modification du parcours de la ville. L’ancre des projets est désormais enfant de Saturne et hérite du plan incliné des anneaux ; le rayon de 23 unités reste dans leur couronne et la hauteur locale de 1,5 les soulève légèrement de la surface. Vérification sur 720 positions avec les sept cartes réelles, et comparaison du titre sur les 241 frames du trajet.

Correction du dégagement des cartes : hauteur locale 9 au-dessus du plan des anneaux. Les anciens contrôles validaient le centre des cartes ; le nouveau contrôle vérifie les huit coins de leur volume englobant, sur 720 positions. Ils restent tous au-dessus du plan et à l’intérieur du cadre. Le titre, la trajectoire et l’orientation des anneaux ne sont pas modifiés.

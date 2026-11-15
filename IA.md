# Assistance par intelligence artificielle

État au **15 novembre 2026**. Je présente ici les usages de l’IA que j’ai pu retracer avec l’aide de Codex. Je ne considère pas toutes les propositions comme retenues, et je ne prétends pas encore maîtriser chaque ligne du code.

## Répartition des rôles et niveau de preuve

J’ai conçu mes maquettes, fourni mes références, mes médias et mes fichiers Blender, puis guidé le travail par mes corrections visuelles et mes choix. J’ai principalement sollicité les IA pour le code. L’historique montre aussi une assistance sur des adaptations de scènes Blender, des exports, des matériaux, la conversion des cheveux du portrait et l’intégration de ressources tierces. Je distingue donc **ma conception et ma validation**, **les ressources personnelles ou tierces que j’ai fournies**, et **l’exécution technique assistée**.

Je n’ai pas procédé par une génération unique : j’ai formulé des demandes précises, examiné les propositions et les captures, signalé les problèmes et demandé de nouvelles corrections. Mes retours comme « ça ne marche pas » et mes refus de rendu documentent mes arbitrages ; je ne les présente pas comme des tests automatisés.

Pour reconstituer mes usages, je m’appuie sur les sources suivantes : code actuel, `docs/`, rapports locaux, sauvegardes, commits et conversations accessibles. Les messages rapportant un résultat sont identifiés comme tels lorsqu’aucun relevé brut n’a été retrouvé. Les historiques de conversations ne sont pas tous publics ni nécessairement exhaustifs.

## Codex — OpenAI

| Étape | Pour quoi faire | Mes interventions, corrections ou refus | Preuves |
|---|---|---|---|
| Exploration du portfolio | Recherche d’un intérieur de vaisseau, préparation d’une copie Blender de Soma04 et écrans provisoires. | Choix d’une base retravaillable ; demande de plusieurs inspirations plutôt qu’une copie d’un seul exemple. Cette exploration n’est pas présentée comme la scène finale. | Conversation « Trouver un intérieur de vaisseau », 5–6 septembre ; livrable local `2026-09-05/es/outputs/Soma04_portfolio.blend`. |
| Ville cyberpunk | Scripts de matériaux, enseignes, textures, éclairages et exports, puis adaptation Blender → Three.js. | Je conserve ma scène et ma trajectoire ; je refuse les fenêtres sur les toits, la répétition des façades et les panneaux mal placés, et je demande des corrections sur références. | Conversation « Vérifier l’accès local à Blender », 28–30 octobre ; `outputs/rapport_ville_cyberpunk.md`, `outputs/ville_finale/Compte_rendu.md` ; [corrections web](docs/CITY_RENDER_CORRECTIONS.md). |
| Caméra et transitions | Parcours au scroll, Sparky/levier, raccord au ciel, hyperspace Seer, arrivée spatiale et retours. | Refus du déclenchement après avoir dépassé Sparky, de la coupure au ciel et des défilements inversés ; validation progressive du raccord. | [RENDU_ET_TRANSITION_V2.md](docs/RENDU_ET_TRANSITION_V2.md), [arrival.js](src/lib/city-render/arrival.js), [hyperspace.js](src/lib/city-render/hyperspace.js). |
| Saturne et Contact | Assemblage de scène à partir de ressources, anneaux, orbite partagée, coordonnées 3D et passage vers le formulaire. | Demande de proximité et lisibilité des cartes ; suppression du vaisseau optionnel ; suppression de Saturne au centre de l’orbite 2D après essai ; réglage des coordonnées et du sens de lecture. | [SCENE_SPATIALE.md](docs/SCENE_SPATIALE.md), [experience.js](src/lib/space/experience.js), [CREDITS.txt](public/models/space/CREDITS.txt), conversations d’octobre et novembre. |
| Pages issues de Figma | Lecture des maquettes, récupération des médias, conversion en composants Astro, intégration des fiches. | Je réalise et fournis les maquettes, puis je demande une reproduction fidèle et fais corriger les espacements, les portraits et les éléments manquants. | [composants projets](src/components/projects/), sauvegardes `project-pages-v2-2026-11-07`, `sull-prompt-2026-11-14`, conversation du 14 novembre. |
| Portrait personnel | Copie de la tête fournie, essais de cheveux, couleurs, export web et éclairage ; interaction cliquable et découpe d’un fichier de grognements. | Interdiction initiale de modifier le visage ; chignon essayé puis abandonné au profit de boucles ; demandes sur volume, regard et contraste ; rotation libre remplacée par une réaction au clic. | Conversation du 13 novembre ; [about-avatar.js](src/lib/about-avatar.js), [portfolio-audio.js](src/lib/portfolio-audio.js), dossier local `avatar/`. |
| Studio et audio | Intégration d’un modèle tiers, cartes musicales 3D, spectres, persistance des morceaux, sons d’interaction. | Je choisis le studio, les couleurs et la vitre ; je refuse le panneau rectangulaire devant le mobilier, les teintes pastel et les coupures audio, et je demande le retrait du son de glissement. | [music-studio.js](src/lib/music-studio.js), [portfolio-audio.js](src/lib/portfolio-audio.js), conversation du 11 novembre et suivantes. |
| Contact et finitions | Formulaire, pièce jointe, messages d’erreur, footer, mentions et réglages des dialogues. | Maquette et animation de champs fournies ; identifiants agrandis ; footer d’accueil allégé, footer studio retiré ; rappel du scroll après chargement et temps de lecture prolongé. | [ContactLanding](src/components/ContactLanding.astro), [contact-form.js](src/lib/contact-form.js), [scroll-intro.js](src/lib/city-render/scroll-intro.js), échanges du 15 novembre. |
| Tests et documentation | Scripts de contrôle ciblés, compilation, inventaires et rédaction des documents demandés. | Je demande des corrections à partir du rendu réel et précise mon rôle, les objectifs de mes réseaux et mon choix d’activer le formulaire à la fin du site. | Rapports locaux `work/check-*.mjs`, journaux de build ; [QUALITE.md](QUALITE.md). Ces scripts locaux ne sont pas tous livrés dans le dépôt. |

Je ne limite pas le rôle de Codex à des conseils : l’assistant a produit ou modifié des fichiers et des scripts, sous ma direction et à partir de mes retours.

## Claude Code — Anthropic

Je m’appuie ici sur le compte rendu de mon travail avec Claude Code, intitulé « Contexte : portfolio BUT MMI… », pour la période du **9–15 novembre 2026**. Je présente les mesures matérielles comme des **résultats rapportés par ce compte rendu** ; je ne les ai pas fait reproduire pour cette rédaction.

| Étape | Pour quoi faire | Arbitrage, correction ou refus | Preuves et limites |
|---|---|---|---|
| Hébergement | Départ du VPS scolaire vers un VPS personnel PulseHeberg ; Debian 13, Nginx, ufw, clés SSH, HTTPS et certbot ; DNS Infomaniak. | Choix d’un hébergement séparé, le VPS scolaire étant rapporté presque plein. | Compte rendu fourni ; [deploy.ps1](deploy.ps1) confirme la cible et les commandes de publication. Configuration serveur non réauditée ici. |
| Publication | Build temporaire, comparaison des fichiers, transfert incrémental, versions et retour arrière. | Éviter de réenvoyer tous les médias à chaque publication. | `deploy.ps1`, commit `aacd6b2` daté du 10 novembre. |
| Chargement Chrome | Diagnostic de compilation shader Direct3D/ANGLE, compilation parallèle et boucles d’éclairage compactes ; préparation du parcours et préchargements. | Priorité au chargement et au premier scroll, sans dégrader le rendu ; comparaison de pixels déclarée identique pour les boucles. | [startup.js](src/lib/city-render/startup.js), [light-loops.js](src/lib/city-render/light-loops.js), [pipeline.js](src/lib/city-render/pipeline.js). Résultats rapportés : environ 59 s → 8 s après téléchargement ; blocages de 2,9 s et 25 s supprimés. |
| Limite Firefox et GPU | Diagnostic du chargement sans compilation parallèle sur la configuration testée, coût de l’éclairage et résolution adaptative. | Ne pas annoncer une résolution universelle du problème. | Compte rendu : environ 90 s sous Firefox non résolus ; environ 32 ms/million de pixels, 90 % d’éclairage, 47 lumières, résolution adaptative à 0,72 sur Radeon 840M. Relevés bruts à joindre. |
| Qualité visuelle | Essais CAS, ombres 4096, anisotropie 16× et résolution calibrée. | J’ai demandé l’annulation de ces essais après leur implémentation, car je ne constatais pas un bénéfice suffisant. | Compte rendu Claude transmis ; sauvegarde `render-quality-2026-11-14`. Ne pas présenter ces essais comme des réglages actuels. |
| Autres pistes | Seuil d’éclairage, GTAO et précalcul Cycles. | Seuil/GTAO rejetés dans le contexte rapporté, notamment parce que le seuil assombrissait des façades ; référence Cycles réalisée, piste de précalcul écartée pour l’instant. | Compte rendu transmis ; à distinguer des rendus Cycles de contrôle déjà employés dans les rapports d’octobre. |

[À COMPLÉTER PAR CLÉMENT : conserver ou joindre les relevés Claude Code des mesures Chrome/Firefox/GPU et de la configuration serveur, avec protocole et dates d’essai ; ne pas les remplacer par une mesure supposée.]

## ChatGPT — OpenAI

Lors de mon premier bilan du 15 novembre, je n’avais pas distingué d’autres usages. La relecture assistée de mes conversations fait cependant apparaître les usages de ChatGPT suivants, distincts de Codex :

| Étape | Pour quoi faire | Mes choix ou corrections | Source |
|---|---|---|---|
| Références et positionnement | Exemples de portfolios 2D/3D, références de contact et direction cinématographique. | Demande d’autres exemples 2D avant développement, puis de contacts plus immersifs. | « Exemples de portfolios », 8 octobre ; « Concevoir un portfolio 3D », 12–13 novembre. |
| Textes | Proposition de présentation, descriptions courtes des projets et texte de collaboration pour Derrière le prompt. | Je fournis les faits et demande une reformulation adaptée à ma maquette. | « Conception 3D du portfolio », 25 septembre ; « Exemples de portfolios », 8 octobre ; « Concevoir un portfolio 3D », 14 novembre. |
| Préparation des médias | Conseils d’export Blender/WebM et de captation des démonstrations. | Je règle mes exports et vérifie le cadrage ; je ne considère pas chaque conseil comme une étape effectivement mise en œuvre. | « Animation de Sparky en bibliothèque », 19 septembre ; « Organisation du portfolio projets », 21 octobre. |
| Sound design | Discussion d’une ambiance commune 2D/3D et d’effets peu nombreux. | J’indique vouloir composer moi-même la musique et limiter les sons d’interface. | « soundesign portfolio », 28–29 octobre, selon dates des messages accessibles. |
| Briefs et demandes graphiques | Formulation de prompts d’intégration Figma, demandes de signature et de texture. | Je fais corriger la composition, la sobriété et la transparence. | « Conception 3D du portfolio », 25–27 septembre ; « Générer scène Sparky PNG », 30 septembre ; « Conception de l’intro cinéma », 30 octobre. La présence de demandes ne prouve pas l’utilisation d’un résultat final. |

[À COMPLÉTER PAR CLÉMENT : préciser si une signature, texture ou image proposée/générée dans ces échanges a été retenue dans le portfolio final ; sinon indiquer explicitement qu’elle a été écartée.]

## Autres outils de génération

J’utilise Figma et Blender comme outils de création ; leur présence ne signifie pas que j’ai utilisé leurs fonctions IA. Je n’ai pas déclaré d’usage de Figma AI ni de génération musicale, et les fichiers examinés n’en établissent pas. Je présente mes sons et vidéos comme mes créations personnelles.

[À COMPLÉTER PAR CLÉMENT : confirmer la liste finale des autres outils IA éventuellement employés pour les images, sons, textes ou modèles, ou écrire « aucun autre outil » après vérification des essais graphiques mentionnés ci-dessus.]

## Ce que je sais expliquer — préparation de la soutenance

J’utilise cette liste comme **support de révision**, pas comme une attestation de maîtrise. Pour chaque fichier, je dois pouvoir reformuler le mécanisme, le montrer dans le code et expliquer au moins une limite.

| Fichier | Ce que je dois pouvoir expliquer |
|---|---|
| [CityExperience.astro](src/components/home/CityExperience.astro) | Assemble la ville, charge les modèles, relie le scroll à la caméra et orchestre les phases jusqu’à l’espace. |
| [pipeline.js](src/lib/city-render/pipeline.js) | Configure le rendu, les matériaux adaptés, l’exposition et les passes graphiques ; distinguer fidélité visuelle et coût GPU. |
| [startup.js](src/lib/city-render/startup.js) | Prépare textures et variantes de shaders ; utilise la compilation parallèle quand le navigateur la propose et un chemin de repli sinon. |
| [light-loops.js](src/lib/city-render/light-loops.js) | Réduit le volume de code GLSL déroulé pour certaines lumières, sans remplacer les calculs d’éclairage par une approximation revendiquée. |
| [model-loading.js](src/lib/city-render/model-loading.js) | Télécharge le gzip, gère sa décompression et le repli GLB ; distinguer poids transféré, décodage et préparation GPU. |
| [arrival.js](src/lib/city-render/arrival.js) | Sépare interaction, temps de lecture, montée, hyperspace et fondu ; le temps de lecture peut maintenir la caméra immobile sans changer les temps absolus du clip acteur. |
| [scroll-intro.js](src/lib/city-render/scroll-intro.js) | Compte le temps de lecture visible du rappel initial et produit le texte progressif des dialogues. |
| [journey-scroll.js](src/lib/space/journey-scroll.js) | Maintient une cible et une position lissée ; définit quand les projets tournent et quand leurs descriptions peuvent être montrées. |
| [experience.js](src/lib/space/experience.js) | Assemble Saturne et Contact et calcule les poses de caméra entre les étapes. |
| [initProjectOrbit.js](src/scripts/initProjectOrbit.js) | Réutilise les cartes dans les deux parcours, gère les vidéos, la sélection et la description de la carte lisible. |
| [about-avatar.js](src/lib/about-avatar.js) | Charge le portrait et déclenche sa réaction au clic ; expliquer le correctif des timestamps de première image. |
| [portfolio-audio.js](src/lib/portfolio-audio.js) | Gère les morceaux, préférences et effets ; les grognements sont volontairement indépendants du mute d’ambiance dans l’état actuel. |
| [contact-form.js](src/lib/contact-form.js) | Valide les champs et la pièce jointe, envoie à FormSubmit et distingue succès, activation nécessaire et erreur. |
| [deploy.ps1](deploy.ps1) | Construit, compare, publie et prévoit un retour arrière ; aucune clé privée ne doit être mise dans le dépôt. |

[À COMPLÉTER PAR CLÉMENT : parcourir cette liste et noter les mécanismes réellement compris, ceux qu’il faut encore travailler et un exemple de modification que je saurais expliquer moi-même.]

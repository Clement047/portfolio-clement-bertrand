# Qualité du portfolio — état au 15 novembre 2026

J’évalue ici **mon site actuel**, et non un modèle générique. Je distingue l’examen assisté du code, l’inventaire local, les résultats historiques rapportés et les vérifications que je dois encore effectuer. Je ne revendique aucun score Lighthouse, aucune conformité RGAA/WCAG ni aucun bilan carbone ou délai réseau qui n’aurait pas été mesuré.

J’ai limité cette mise à jour aux documents, sans faire modifier le code, les médias ou le serveur. Lorsque j’indique une correction « à faire », je ne la présente pas comme déjà réalisée.

## 1. Accessibilité

| Critère et importance pour ce site | Vérification précise | Résultat établi | Correction réalisée ou restant à faire |
|---|---|---|---|
| Alternative à la ville : le parcours principal dépend de WebGL, du GPU et du scroll. | Désactiver WebGL, ouvrir `/portfolio-2d/`, atteindre les fiches et le contact sans passer par la ville ; tester un lecteur d’écran. | Version 2D et liens de bascule présents. Elle conserve un accueil 3D, des cartes vidéo et un portrait WebGL : alternative **partielle**, non assimilable à une version statique accessible. Sources : [portfolio-2d.astro](src/pages/portfolio-2d.astro), [ModeSwitch](src/components/ModeSwitch.astro), [initProjectOrbit.js](src/scripts/initProjectOrbit.js). | À faire : proposer une liste HTML de projets et leurs liens indépendamment du canvas ; valider l’accès au contenu en cas d’échec WebGL. |
| Clavier : les cartes et scènes ne doivent pas obliger à viser avec la souris. | Parcourir Tab/Shift+Tab/Entrée/Espace, flèches et PageUp/PageDown, sans souris ; vérifier le focus et les retours de navigation. | Gestion de touches dans CityExperience et bouton canvas du portrait avec Entrée/Espace. Les liens du header et du footer sont HTML. **À vérifier** : accès clavier complet aux cartes de l’orbite et de la vitre du studio, absence de pièges. | Conserver les liens standards ; prévoir des choix HTML accessibles pour toutes les interactions 3D. Les boutons du studio masqués visuellement ne prouvent pas un parcours clavier confortable. |
| Tactile : lecture possible sans molette. | Tester sur de vrais appareils tactiles, portrait/paysage, zoom et changement d’orientation. | Événements tactiles et conversion de déplacement présents : [experience-controls.js](src/lib/experience-controls.js), [CityExperience](src/components/home/CityExperience.astro). **À vérifier** en conditions réelles. | Ajuster sensibilité, cibles et gestes si nécessaire ; ne pas annoncer une validation mobile sur la seule présence d’événements. |
| Réduction des mouvements : voyages, vagues et glitches sont importants dans la direction artistique. | Émuler `prefers-reduced-motion: reduce`, recharger puis parcourir ville, 2D, portrait et studio. | Prise en compte dans le portrait, les effets de titres, le formulaire et certains contrôles ; le rappel initial compte le temps visible. Protection **partielle** : pas de preuve d’un parcours entier sans mouvement, hyperspace compris. | À faire : tester toutes les phases et prévoir une transition courte/statique lorsque la préférence est active. Sources : [about-avatar.js](src/lib/about-avatar.js), [contact-form.js](src/lib/contact-form.js), [hyperspace.js](src/lib/city-render/hyperspace.js). |
| Textes alternatifs : les captures de projets et vidéos portent des informations. | Examiner chaque image significative et sa transcription avec NVDA/Firefox ou équivalent. | De nombreuses captures de fiches ont `alt=""`, par exemple [PromptDesktop](src/components/projects/PromptDesktop.astro). Les portraits et certains SVG ont des libellés. Les contenus utiles des vidéos/canvas ne sont pas transcrits intégralement. | À faire : donner des alternatives aux captures informatives et garder `alt=""` pour le décor seulement ; ajouter des descriptions textuelles des démonstrations. |
| Son et contrôle : ambiance immersive et grognements du portrait. | Profil navigateur vierge, premier clic, mute, interaction avec la tête, changement de page et retour. | [portfolio-audio.js](src/lib/portfolio-audio.js) initialise `muted` à vrai **seulement si** la préférence enregistrée vaut `'true'`. Le premier geste déverrouille l’audio : le son n’est donc pas coupé par défaut. Les grognements restent volontairement indépendants du mute d’ambiance. | À faire : décider d’un vrai opt-in audio et d’un contrôle identifiable pour tous les sons. Documenter cette exception plutôt que déclarer le mute universel. |
| Lecture des textes : petits corps, néon, fonds animés et dialogue progressif. | Mesurer les contrastes sur captures représentatives, vérifier à 200 % et sur petit écran, chronométrer la lecture. | Réglages présents : rappel initial de 6 s visibles ; au moins 12 s d’interaction Sparky avant montée ; première réplique pendant 5 s puis seconde, écriture comprise. Sources : [scroll-intro.js](src/lib/city-render/scroll-intro.js), [arrival.js](src/lib/city-render/arrival.js), CityExperience. **À vérifier** : confort réel et contrastes, pas de ratio mesuré ici. | À faire : offrir si nécessaire une avance manuelle/pause, vérifier les typographies étroites et les pages projets mises à l’échelle. |
| Sous-titres/transcriptions des médias : l’information doit rester disponible sans audio ou vidéo. | Inventorier les vidéos parlées, désactiver le son, rechercher les pistes `<track>` et les transcriptions. | Vidéos avec contrôles dans les fiches ; absence de piste de sous-titres dans les démonstrations examinées. **À vérifier** : lesquelles contiennent réellement des paroles ou une information exclusivement sonore. | Ajouter sous-titres/transcription aux médias concernés ; ne pas exiger de sous-titres à un simple décor muet. |
| Langue, titres et structure : les pages doivent être repérables hors du rendu visuel. | Inspecter `lang`, landmarks et plan des titres dans l’arbre d’accessibilité. | `lang="fr"` dans les layouts et le gabarit générique. Fiches V2 : `h1` masqué visuellement, mais de nombreux titres de sections sont des paragraphes. MainLayout ne fournit pas de titre principal à lui seul. | À faire : contrôler chaque route, notamment ville et accueil 2D ; employer une hiérarchie de vrais titres et conserver les intitulés lisibles par les technologies d’assistance. |

[À COMPLÉTER PAR CLÉMENT : consigner les résultats des parcours clavier, lecteur d’écran, tactile, zoom, contrastes et réduction des mouvements, avec navigateur, appareil et date ; laisser « À vérifier » tant que ces essais ne sont pas réalisés.]

## 2. Sobriété et performance

### Inventaire local des ressources sollicitées

Mesure du **15 novembre 2026**, obtenue avec `Get-Item ... | Select-Object Length` sur les fichiers locaux, puis addition des chemins réellement chargés par le code. Un Mio vaut 1 048 576 octets. Il s’agit du **poids sur disque des ressources identifiées**, pas d’une capture HAR ni du poids exact d’une visite réseau.

| Ressource | Octets | Moment identifiable dans le code |
|---|---:|---|
| `public/models/villeportfolio_RUNTIME.glb.gz` | 91 864 509 | Ville, préchargée puis téléchargée par model-loading.js. |
| `public/models/city-render/DistrictAdditions.glb` | 4 977 440 | Préchargement de la ville. |
| `public/models/city-render/SparkySurfaces.glb` | 7 371 488 | Préchargement de la ville. |
| **Sous-total de ces trois ressources** | **104 213 437 ≈ 99,39 Mio** | Base identifiée, hors complément de traînées. |
| `public/models/city-render/SynthTrails.glb` | 34 398 264 | Demande démarrée après lecture du modèle principal ; préparation graphique différée. |
| **Ville et compléments identifiés** | **138 611 701 ≈ 132,19 Mio** | Ne pas compter en plus la variante GLB standard si seul le gzip a été téléchargé. |
| `public/models/space/ESPACE_PROJETS.glb` | 4 579 636 | Préparation de Saturne. |
| `public/models/space/CONTACT_LUNAIRE.glb` | 1 895 096 | Préparation de Contact. |
| `public/models/space/background.glb` | 286 840 | Fond du contact, préfetch possible en fin de parcours. |
| **Sous-total identifié jusqu’au contact** | **145 373 273 ≈ 138,64 Mio** | Hors code, polices, sons, vidéos et autres requêtes. |
| `public/models/villeportfolio_RUNTIME.glb` | 124 705 864 | Variante standard de repli ; ne pas l’ajouter systématiquement au gzip. |
| `public/models/avatar/clement-tete.glb` | 16 454 080 | Portrait de la présentation 2D. |
| `public/models/music-studio.glb` | 7 109 720 | Studio, visite optionnelle distincte. |

Sources du périmètre : [CityExperience](src/components/home/CityExperience.astro), [model-loading.js](src/lib/city-render/model-loading.js), [experience.js](src/lib/space/experience.js), [backdrop.js](src/lib/space/backdrop.js), [about-avatar.js](src/lib/about-avatar.js).

Pour la page 2D, le modèle d’accueil spatial, le portrait et le fond représentent **21 320 556 octets ≈ 20,33 Mio** identifiés, hors vidéos, sons, scripts et polices. La 2D évite la ville mais conserve plusieurs rendus animés ; elle ne doit pas être présentée comme une page légère sans mesure complète.

### Médias lourds constatés

- `images/projects/v2/prompt-demonstration.mp4` : **212 734 892 octets** ; copie de même taille dans `project-orbit/assets/derriere-le-prompt/derriere-le-prompt.mp4`.
- `images/projects/v2/ebene-demonstration.mp4` : **61 365 617 octets** ; copie de même taille dans l’orbite.
- `images/projects/sull-demo.mp4` : **19 908 101 octets**.
- Plusieurs PNG de fiches/répertoires d’images atteignent environ **15,1 Mo** ; exemple `images/projects/v2/8e4e0dfd-f79e-46b4-ba52-de718ca5a057.png` : **15 127 200 octets**.

Ces valeurs viennent de `Get-ChildItem public -Recurse -File | Sort-Object Length -Descending` avec filtrage des médias. Une duplication sur disque n’implique pas automatiquement deux téléchargements par visite ; le `preload="metadata"` et le streaming empêchent aussi d’assimiler taille totale de vidéo et transfert immédiat.

### Mesures historiques rapportées par Claude Code

Source : compte rendu de mon travail avec Claude Code pour la période **9–15 novembre 2026**, repris dans [IA.md](IA.md). Configuration annoncée : PC Windows, Radeon 840M.

| Observation rapportée | Valeur et portée |
|---|---|
| Avant correction, Chrome, première visite | Environ **59 s entre fin du téléchargement et bouton Enter**, puis blocages de **2,9 s** et **25 s** au premier défilement ; pas un temps total de visite. |
| Après correction, Chrome | Environ **8 s** sur ce même intervalle et plus de blocage de scroll dans l’essai rapporté. |
| Firefox sur la configuration testée | Environ **90 s**, problème non résolu dans le compte rendu ; ne pas généraliser cette absence de compilation parallèle à toutes les versions futures. |
| Rendu GPU | Environ **32 ms/million de pixels**, dont **90 % d’éclairage**, **47 lumières** ; résolution adaptative descendue à **0,72** dans l’essai rapporté. |

Je n’ai pas fait remesurer ces valeurs pour rédiger les documents. Les boucles compactes et la préparation parallèle existent dans [light-loops.js](src/lib/city-render/light-loops.js) et [startup.js](src/lib/city-render/startup.js). L’identité par comparaison de pixels est **rapportée**, pas recertifiée ici. Les rendus et compressions documentés en octobre concernent d’autres états des modèles : ne pas en substituer les poids à ceux de l’inventaire actuel.

| Critère et importance | Méthode de vérification | Résultat établi | Correction / suite |
|---|---|---|---|
| Poids réel d’une visite complète | Profil vierge, cache désactivé, Network « Preserve log », parcours ville → contact, export HAR ; refaire avec cache, puis séparément en 2D. Distinguer transfert compressé et taille décodée. | Inventaire ci-dessus mesuré ; **transfert réel complet À vérifier**. Aucun chiffre global de visite réseau n’est revendiqué. | Réduire d’abord modèles/médias effectivement transférés ; compléter audio, HLS, polices et scripts dans le HAR. |
| Compilation et premier scroll | Chrome/Firefox, même machine et dimensions, cache froid puis chaud ; relever téléchargement, parse, shaders, Enter et première interaction séparément. | Amélioration Chrome rapportée ; Firefox non résolu. Préchargement, workers Meshopt et compilation parallèle présents. | Conserver les phases instrumentées ; rechercher un chemin d’entrée plus léger pour les configurations lentes. |
| Coût GPU et durée des animations | Profiler après chargement à plusieurs résolutions, vérifier les pics et la qualité adaptative ; observer au repos et onglet masqué. | Budget et adaptations présents : [experience-controls.js](src/lib/experience-controls.js), [pipeline.js](src/lib/city-render/pipeline.js). Aucun nouveau relevé FPS/ms fourni. | Arbitrer éclairages et résolution avec comparaison visuelle ; ne pas confondre faible réseau et faible coût GPU. |
| Vidéos et captures | Inventaire ci-dessus, panneau Network et couverture des images réellement affichées. | Vidéos et PNG volumineux ; plusieurs images de fiches chargées en `eager` après correction d’un problème de lazy-loading sur artboard transformé. | À faire : encodages adaptés, variantes d’images et chargement progressif compatible avec les transformations ; conserver une qualité contrôlée. |
| Réutilisation des ressources | Inspecter loaders, cache de promesses, géométries et renderer partagé. | Réutilisation de l’orbite, instances documentées pour les astéroïdes, hyperspace sur le renderer existant. Sources : [assets.js](src/lib/city-render/assets.js), [hyperspace.js](src/lib/city-render/hyperspace.js), [SCENE_SPATIALE.md](docs/SCENE_SPATIALE.md). | Vérifier les requêtes en double et la libération des contextes sur navigation ; ne pas annoncer une absence absolue de fuite sans test prolongé. |
| Cache Nginx et compression HTTP | Lire la configuration active puis relever `Cache-Control`, `Content-Encoding`, `Vary`, réponses 304 et types MIME avec DevTools ou `curl -I`. | VPS/Nginx déclarés ; gzip de ville explicitement géré côté client. **En-têtes et compression serveur À vérifier** ; deploy.ps1 ne les établit pas. | Configurer cache et compression selon les types ; éviter un cache immuable incorrect sur des URL non versionnées. |
| Publication des fichiers lourds | Vérifier `.gitignore`, `git check-ignore` et la liste des fichiers suivis ; comparer le manifeste de publication. | Nouvelle copie `prompt-demonstration.mp4` non ignorée, au-delà de 100 Mo. Exclusions de tests présentes dans deploy.ps1. | À faire avant ajout Git : traiter cette copie et documenter l’accès des évaluateurs aux médias exclus. Ne pas modifier `.gitignore` dans cette tâche documentaire. |

[À COMPLÉTER PAR CLÉMENT : joindre les HAR 3D/2D cache froid et chaud, les mesures Chrome/Firefox/GPU et le relevé des en-têtes Nginx, avec dates, matériel et conditions ; préciser la provenance des anciens chiffres Claude.]

## 3. Référencement

| Critère et importance | Vérification précise | Résultat établi | Correction / suite |
|---|---|---|---|
| Titres de pages : distinguer les projets et les parcours | Inspecter le HTML généré de chaque route. | Titres fournis par MainLayout et les layouts projets. Source : [MainLayout](src/layouts/MainLayout.astro), [ProjectCaseStudyV2](src/layouts/ProjectCaseStudyV2.astro), [gabarit générique](src/pages/projets/[slug].astro). | À vérifier : pertinence et unicité de toutes les formulations, indexation de l’état publié. |
| Meta descriptions : expliquer le contenu sans rendu WebGL | Examiner `meta[name=description]` pour chaque route. | Présentes dans les layouts projets, souvent génériques pour V2. MainLayout n’en fournit pas pour accueil, studio, contact et mentions. | À faire : description propre à chaque page principale et description éditoriale de chaque projet. |
| Open Graph et partage sur LinkedIn | Inspecter `og:title`, `og:description`, `og:image`, puis aperçu de partage. | Balises Open Graph non repérées dans les layouts examinés. | À faire : métadonnées et image de partage, URL absolue ; tester le rendu de l’aperçu. |
| Sitemap et robots | Vérifier les fichiers du build publié et les réponses `/sitemap.xml`, `/robots.txt`. | Fichiers non présents dans `public/` lors de l’inventaire ; pas d’intégration sitemap dans astro.config.mjs. **Réponses du serveur À vérifier**. | À faire : sitemap des routes publiques, politique robots et canonicals cohérents. Un robots.txt ne protège pas une page privée. |
| Pages de test | Vérifier exclusions de build publié, puis statut HTTP des routes de test sur le domaine. | `/test-ville/` et `/test-espace/` exclus par deploy.ps1 ; présents dans le projet local. | À faire : confirmer leur absence publique, prévenir une publication par une autre procédure ; ne pas déclarer un `noindex` déjà présent. |
| Contenu compréhensible hors canvas | Lire le HTML sans scripts et comparer aux informations graphiques des projets. | Fiches textuelles et routes propres existantes ; navigation de l’orbite principalement graphique. | À faire : liens et liste de projets indexables indépendamment de la 3D ; éviter les titres de section réduits à des paragraphes ou SVG sans équivalent. |
| Domaine, HTTPS et URL propres | Vérifier redirections HTTP/HTTPS et racine/www, liens internes, canonicals et absence de 404. | URLs Astro lisibles ; domaine et HTTPS rapportés dans le compte rendu Claude, non contrôlés en ligne ici. | Vérifier la publication réelle ; ne pas déduire les redirections du seul script de déploiement. |

## 4. Conformité juridique et transparence

J’identifie dans cette section les pièces disponibles et les écarts à traiter ; je ne certifie pas la conformité juridique de mon site.

| Critère et importance | Vérification précise | Résultat établi | Correction / suite |
|---|---|---|---|
| Éditeur et hébergeur | Comparer la page aux informations de l’éditeur et au contrat d’hébergement. | [mentions-legales.astro](src/pages/mentions-legales.astro) existe, contrairement à l’ancien état cité dans le prompt. je suis identifié comme éditeur ; Infomaniak y est encore présenté comme hébergeur prévu. Le compte rendu indique **PulseHeberg pour le VPS et Infomaniak pour le DNS**. | Priorité : corriger l’hébergeur avec ses coordonnées vérifiées et retirer la mention prévisionnelle après confirmation. Ne pas inventer d’adresse privée ni d’information légale. |
| Licence Mabry Pro | Retrouver l’achat ou l’autorisation, lire les droits desktop/webfont et de redistribution dans un dépôt public. | J’indique avoir le droit pour mon utilisation ; je dois encore verser le justificatif à mon dossier de preuves. | Conserver la preuve et vérifier la redistribution du fichier `.ttf` ; ne pas transformer une utilisation étudiante en exemption supposée. |
| Autres polices | Inventorier les fontes réellement utilisées et les notices correspondantes. | OFL présents pour Artifika, Babylonica, Baskervville. Notices non repérées pour Le Murmure, Jersey et Lexend. Agency FB est citée dans les scènes ; des textes sont exportés en maillages. | Retrouver les licences à la source et respecter les obligations de chaque fichier ; vérifier aussi les sources Blender. La mention OFL du prompt pour Le Murmure reste à étayer. |
| Modèles et textures tiers | Rapprocher chaque asset effectivement utilisé de sa source, auteur, licence et modifications. | [CREDITS.txt](public/models/space/CREDITS.txt) couvre plusieurs ressources : Sereib, Noah Lupowitz, DanielAndersson. Source/licence de Saturne et des roches incomplète ; enseignes de ville documentées dans un rapport local. | Compléter la chaîne de provenance et les crédits accessibles publiquement ; distinguer modèle conservé, modifié et désactivé. |
| Sons, vidéos et extraits | Identifier les créateurs et les éléments tiers incorporés, y compris dans les captures de projets. | Je présente mes sons et vidéos comme mes créations personnelles. Le fichier fourni pour les grognements était nommé « Male Grunts - Sound Effect for editing.mp3 » : ce nom ne prouve ni une origine personnelle ni une licence. Des œuvres tierces sont visibles dans des captures, notamment du cinéma et Star Wars. | Demander les justificatifs/provenances des exceptions ; ne pas conclure que tous les droits sont établis parce que la capture ou le montage est personnel. |
| Formulaire et réception | Premier envoi, activation de mon formulaire dans le mail FormSubmit, puis essai d’un message et d’une pièce jointe ; vérifier aussi les erreurs. | Information de confidentialité ajoutée, champs nécessaires et fichier facultatif indiqués. J’ai choisi de différer l’activation jusqu’à la fin du site ; je n’ai **pas encore validé la réception**, conformément à [contact-reception.md](docs/contact-reception.md). | Faire l’activation et un essai réel au moment choisi ; tester l’email de secours. Aucun envoi n’a été fait pour cet audit. |
| Données personnelles | Vérifier finalité, base légale, destinataires, durée, droits et services de transmission/stockage. | Page de confidentialité présente ; envoi via FormSubmit et messagerie Gmail documentés. Conservation formulée de manière générale, prestataires et transferts à préciser selon leurs conditions réelles. | Définir une politique de conservation applicable et informer sur les prestataires effectifs ; ne pas annoncer une suppression automatique non implémentée. |
| Cookies et stockage local | DevTools Application/Storage et Network sur profil vierge avant/après interactions et envoi ; inventorier domaines et finalités. | Préférences `localStorage` et `sessionStorage` pour l’audio/navigation repérées. Aucun outil publicitaire/analytics identifié dans les sources examinées ; **comportement réseau complet et services tiers À vérifier**. | Documenter les stockages effectifs ; déterminer les obligations de consentement à partir de leurs usages réels, sans déclarer « aucun traceur » sur une simple recherche de code. |
| Bibliothèques et IA | Vérifier notices livrées et cohérence entre contributions décrites et traces. | Notices Three.js, hls.js et Seer présentes. Dans IA.md, je distingue ma direction artistique, le code et les adaptations assistés, mes médias et les modèles tiers. | Maintenir les notices et déclarations ; confirmer les essais graphiques finalement retenus. |

[À COMPLÉTER PAR CLÉMENT : confirmer le contrat PulseHeberg, ses coordonnées légales et la configuration de publication ; réunir les justificatifs de polices, modèles, médias et grognements ; préciser la durée de conservation réellement appliquée aux messages.]

## Corrections prioritaires avant la soutenance

Les niveaux ci-dessous sont des priorités d’action, pas des corrections réalisées dans cette tâche.

1. **Bloquant pour le contact** : activer FormSubmit à la fin du site, vérifier réception réelle et pièce jointe, conserver une preuve d’essai sans donnée personnelle publique.
2. **Bloquant pour la publication documentée** : corriger PulseHeberg/Infomaniak dans les mentions ; réunir les droits Mabry Pro, les licences manquantes et les exceptions de médias/modèles.
3. **Bloquant pour un ajout Git fiable** : traiter la nouvelle vidéo de 212 734 892 octets non ignorée et expliquer la récupération des médias exclus ; ne pas publier de secrets SSH ou `.env`.
4. **Impact fort sur l’accès** : vraie alternative HTML aux cartes/scènes, clavier, focus, alternatives textuelles et contenu des vidéos ; revoir le son activé au premier geste et le contrôle des grognements.
5. **Impact fort sur la première visite** : mesurer le transfert réel et les phases de préparation, reprendre le cas Firefox, réduire les médias lourds avec validation de la qualité.
6. **Lecture et mobile** : tester les artboards de fiches, le zoom, les contrastes néon et les temps de dialogue sur appareils réels ; compléter la réduction des mouvements.
7. **Visibilité professionnelle** : descriptions principales, Open Graph, sitemap, robots/canonicals, absence publique des tests et contrôle des redirections du domaine.

## Provenance des résultats

- Code, chemins de médias et notices : dépôt local consulté le 15 novembre ; inventaire PowerShell des longueurs en octets.
- Résultats historiques : rapports `docs/` et compte rendu de mon travail avec Claude Code, explicitement séparés des mesures locales.
- Derniers contrôles fonctionnels ciblés retrouvés dans les notes locales : démarrage de réaction du portrait, isolation audio des grognements, garde de description d’orbite, durée de lecture et transitions. Ils ne remplacent ni un audit d’accessibilité ni un profil réseau ; scripts `work/check-portrait-click-timing.mjs`, `work/check-avatar-audio-and-orbit.mjs`, `work/check-city-scroll-intro.mjs`, `work/check-orbit-dialogue-reading.mjs` du dossier de travail Codex.
- Dernier build retrouvé : `work/build-orbit-dialogue-reading.log`, 15 novembre, « 15 page(s) built ». Aucun build nouveau n’est revendiqué pour la seule rédaction de ces documents.
- Repères institutionnels pour préparer les vérifications : [Service Public — mentions](https://entreprendre.service-public.gouv.fr/vosdroits/F37351), [CNIL — information lors de la collecte](https://www.cnil.fr/fr/exemples-de-formulaire-de-collecte-de-donnees-caractere-personnel). Je dois tenir compte de mon statut d’étudiant et des fonctions réelles de mon site pour appliquer ces repères.

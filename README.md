# Portfolio de Clément Bertrand — BUT MMI

Je présente dans ce portfolio étudiant mon travail en création audiovisuelle, en design et en 3D. État documentaire : **15 novembre 2026**.

- **Parcours 3D** : ville cyberpunk → Sparky → montée et hyperspace → Saturne et projets → planète Contact → formulaire en 2D.
- **Version 2D** : accueil spatial, orbite de cartes vidéo, présentation avec portrait interactif et formulaire. Elle utilise encore WebGL : ce n’est pas une alternative entièrement statique.
- **Studio** : choix musical dans une scène 3D.
- **Projets** : SULL, SPARKY, ÉBÈNE, Derrière le prompt, REFLECTIONS. VOID et NOKTURNE STUDIO sont annoncés comme indisponibles dans l’orbite.

J’ai défini la direction artistique, réalisé mes maquettes, fourni mes contenus et arbitré les choix du portfolio. Je me suis appuyé sur les IA pour le code, mais aussi pour certaines adaptations et certains exports Blender ainsi que des reformulations éditoriales. Dans [IA.md](IA.md), je distingue mes créations et décisions, les interventions assistées et les ressources tierces.

## Technologies réellement utilisées

| Technologie | Utilisation et source |
|---|---|
| Astro 7.4.2 | Pages, composants, génération statique et ClientRouter : [package.json](package.json), [MainLayout](src/layouts/MainLayout.astro). Version installée relevée localement ; dépendance déclarée `^7.4.2`. |
| Three.js 0.186.1 | Rendu, caméras, animations, shaders et post-traitement : [CityExperience](src/components/home/CityExperience.astro). Dépendance déclarée `^0.186.1`. |
| Meshopt | Décodeur fourni avec Three.js, workers et ville compressée : [startup.js](src/lib/city-render/startup.js), [model-loading.js](src/lib/city-render/model-loading.js). |
| Draco | `DRACOLoader` du portrait et décodeurs locaux `/vendor/draco/` : [about-avatar.js](src/lib/about-avatar.js). |
| hls.js | Vidéos HLS de l’orbite : import local dans [initProjectOrbit.js](src/scripts/initProjectOrbit.js). Le module vendorié indique 1.6.13. |
| Seer.js Hyperspace | Effet adapté au renderer et à l’horloge de la ville : [intégration](src/lib/city-render/hyperspace.js), [notice MIT](src/lib/city-render/vendor/SEER-NOTICE.md). |
| FormSubmit | Envoi du formulaire et de sa pièce jointe : [contact-form.js](src/lib/contact-form.js). Activation encore nécessaire. |
| Blender | Création, préparation et export des scènes et animations ; comptes rendus dans [docs/](docs/). Sources `.blend` principalement locales. |

Astro et Three.js sont les seules dépendances directes déclarées dans `package.json`. Les autres composants cités sont importés depuis Three.js ou conservés localement.

## Installation et commandes

Prérequis déclaré : **Node.js ≥ 22.23.4**, d’après [package.json](package.json).

```powershell
npm install
npm run dev
npm run build
npm run preview
```

`npm ci` permet de suivre exactement le verrouillage existant. Le serveur affiche son URL et peut choisir un autre port si nécessaire. Pour le travail de mon assistant de développement, [AGENTS.md](AGENTS.md) demande le mode arrière-plan :

```powershell
npx astro dev --background
npx astro dev status
npx astro dev logs
npx astro dev stop
```

Pour publier depuis Windows, j’utilise mes accès au serveur :

```powershell
# Compile et compare sans publier.
powershell -ExecutionPolicy Bypass -File .\deploy.ps1 -Simulation

# Publie explicitement.
powershell -ExecutionPolicy Bypass -File .\deploy.ps1

# Retour arrière prévu par le script.
ssh root@45.147.96.184 portfolio rollback
```

[deploy.ps1](deploy.ps1) construit dans un dossier temporaire, exclut les exports inutilisés et pages de test, compare les empreintes, transmet les changements et bascule vers une version datée. Je documente ces commandes ici ; je n’ai déclenché aucune publication dans le cadre de cette mise à jour documentaire.

## Arborescence

```text
src/pages/                 routes Astro
src/components/            accueil, orbite, présentation, contact et fiches
src/layouts/               enveloppes des pages
src/lib/city-render/       rendu et préparation de la ville, séquence Sparky
src/lib/space/             Saturne, orbite et parcours Contact
src/scripts/               initialisation de l’orbite partagée
src/styles/                styles globaux et pages projets
public/models/             modèles et compléments de rendu
public/project-orbit/      cartes, bibliothèques et médias HLS
public/images/             captures, portraits et démonstrations
public/audio/              musiques et effets
public/fonts/              polices locales
docs/                      comptes rendus techniques historiques
deploy.ps1                 publication incrémentale
IA.md                      transparence sur l’assistance IA
JOURNAL.md                 chronologie sourcée
QUALITE.md                 vérifications et priorités
```

## Routes

| Route | Contenu |
|---|---|
| `/` | Ville et parcours 3D vers l’espace. |
| `/portfolio-2d/` | Accueil classique ; ancres `#project-orbit`, `#presentation`, `#contact`. |
| `/saturne/` | Accès direct à la scène spatiale. |
| `/contact/` | Formulaire, également destination finale du parcours immersif. |
| `/musiques/` | Studio musical. |
| `/mentions-legales/` | Mentions et confidentialité, hébergeur encore à rectifier. |
| `/projets/sull/`, `/projets/sparky/`, `/projets/ebene/` | Fiches dédiées. |
| `/projets/derriere-le-prompt/`, `/projets/reflections/` | Fiches dédiées. |
| `/projets/nokturne-studio/`, `/projets/void/` | Routes générées par `[slug].astro` ; disponibilité à harmoniser avec les cartes d’attente. |
| `/test-ville/`, `/test-espace/` | Tests locaux exclus de la publication par `deploy.ps1`. |

Sources : [src/pages/](src/pages/), [projects.js](src/data/projects.js). `?from=space` conserve « Revenir à Saturne » sur les fiches.

## Médias lourds et clonage

Mon dépôt ne contient pas tous les médias nécessaires à une reproduction complète du portfolio. Le bloc « Médias lourds » du [.gitignore](.gitignore) exclut exactement :

```text
public/models/villeportfolio_RUNTIME.glb
public/models/villeportfolio_RUNTIME.glb.gz
public/models/city-render/SynthTrails.glb
public/models/black_hole.glb
public/project-orbit/assets/derriere-le-prompt/derriere-le-prompt.mp4
public/project-orbit/assets/ebene/ebene.mp4
public/images/projects/v2/ebene-demonstration.mp4
public/images/projects/sull-demo.mp4
```

Le bloc des exports Blender inutilisés exclut aussi :

```text
public/models/villeportfolio_FINAL.glb
public/models/villeportfolio_EXPORT.glb
public/models/villeportfolio_WEB.glb
public/models/villeportfolio_FAST.glb
public/models/villeportfolio_FAST.glb.gz
```

Les dépendances, le build, les variables d’environnement, les sauvegardes et diagnostics sont également ignorés ; consulter le fichier pour les motifs complets.

**Écart relevé le 15 novembre** : `public/images/projects/v2/prompt-demonstration.mp4` pèse **212 734 892 octets**, sans être couvert par les exclusions actuelles (`Get-Item`, `git check-ignore`). Cette nouvelle copie dépasse le seuil de fichier GitHub de 100 Mo mentionné dans le contexte de publication. Je dois traiter ce point avant de l’ajouter au dépôt.

[À COMPLÉTER PAR CLÉMENT : indiquer comment un évaluateur autorisé récupère les médias exclus, sans publier d’identifiants ni d’accès au serveur.]

## Hébergement

Site : **clementbertrandportfolio.store**, avec `www`. Dépôt distant configuré : [Clement047/portfolio-clement-bertrand](https://github.com/Clement047/portfolio-clement-bertrand).

Le compte rendu de mon travail avec Claude Code pour la période du 9 au 15 novembre indique : VPS personnel **PulseHeberg**, Debian 13, Nginx, ufw, SSH par clé uniquement, HTTPS Let’s Encrypt et renouvellement automatique certbot testé. **Infomaniak gère le DNS** (A, AAAA et CNAME `www`), pas l’hébergement du VPS. `deploy.ps1` confirme la cible `45.147.96.184` ; il ne prouve pas la configuration active du serveur.

Le VPS scolaire `185.157.244.202`, accueillant notamment les sous-domaines SULL et TiKTaK selon ce même compte rendu, n’a pas été retenu pour le portfolio : il n’avait plus que **481 Mo libres** au moment de la décision. Valeur historique rapportée, non remesurée. Je n’ai pas fait effectuer de nouvel accès SSH ni de contrôle DNS/HTTPS pour cette documentation. Voir [QUALITE.md](QUALITE.md).

## Crédits et licences

[CREDITS.txt](public/models/space/CREDITS.txt) identifie notamment :

- **Astéroïdes** : Sereib, *Asteroid Field (100 x low-Poly)*, CC BY 4.0 ; séparation, instances et matériaux adaptés.
- **Studio** : Noah Lupowitz, *Recording Studio*, CC BY ; matériaux et éclairage adaptés.
- **Navette** : Daniel / DanielAndersson, *Ministry-class Shuttle*, CC BY ; piste essayée puis désactivée dans le parcours actuel.
- **Saturne** : archive fournie `saturn.zip` ; auteur et licence d’origine non précisés.
- **Roches lunaires** : fichiers locaux `moon_rock_01_4k.blend` à `moon_rock_03_4k.blend` ; origine et licence à préciser.

Le compte rendu local `outputs/ville_finale/Compte_rendu.md` identifie aussi [Japanese Neon Street Sign](https://sketchfab.com/3d-models/japanese-neon-street-sign-c91524e74c8c463ca3ddf71bc73911db) — McManus Media / Jackmcm — et [Neon Wire Sign Japanese](https://sketchfab.com/3d-models/neon-wire-sign-japanese-b80db604c2824c0b8fb0e97a6d5f7d8f) — PolyDavid — sous CC BY 4.0. Adaptations rapportées : placements, échelles, couleurs, fixations et textures allégées. Le report exhaustif dans les crédits publics reste à vérifier.

Notices logicielles : [Three.js](public/project-orbit/vendor/LICENSE-three.txt), [hls.js](public/project-orbit/vendor/LICENSE-hls.txt), [Seer.js](src/lib/city-render/vendor/SEER-NOTICE.md).

| Police présente | État documentaire |
|---|---|
| Le Murmure | Utilisée ; aucun fichier de licence repéré dans l’inventaire public. Licence exacte et redistribution à confirmer. |
| Mabry Pro | J’indique être autorisé pour mon utilisation ; je dois encore réunir le justificatif et vérifier les droits webfont et de redistribution. |
| Artifika, Babylonica, Baskervville | Notices `*-OFL.txt` présentes dans `public/fonts/project-pages/`. |
| Jersey 10, Jersey 15, Lexend | Fichiers présents ; notices correspondantes non repérées dans l’inventaire public. |
| Agency FB | Textes de scènes exportés en maillages selon les comptes rendus ; vérifier les droits de la police source et son éventuelle inclusion dans les `.blend`. |

[À COMPLÉTER PAR CLÉMENT : réunir les justificatifs Mabry Pro, les licences manquantes et les sources de Saturne, des roches et des autres assets de la ville.]

Je considère mes sons et vidéos comme mes créations personnelles. Je dois néanmoins documenter les droits des extraits d’œuvres visibles dans mes captures et préciser l’origine des grognements, comme indiqué dans [QUALITE.md](QUALITE.md).

## État et limites

- Je n’ai **pas encore activé FormSubmit ni validé la réception** au 15 novembre : [procédure](docs/contact-reception.md).
- Mentions légales présentes mais hébergeur encore incorrect/prévisionnel ; droits à documenter.
- Les temps Chrome/Firefox rapportés ne sont pas des scores Lighthouse ; l’inventaire des poids n’est pas une capture réseau.
- Les comptes rendus de [docs/](docs/) décrivent des états successifs : certains chemins et nombres de pages y sont historiques.
- Git contient deux commits du **25 octobre 2026**, puis des commits de structuration du **10 novembre**. Voir [JOURNAL.md](JOURNAL.md) pour les preuves et les périodes sans trace.

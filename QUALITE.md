# Qualité du portfolio — état au 16 novembre 2026

Cette grille porte sur **mon** site : une ville 3D (accueil `/`), un voyage spatial vers Saturne et la planète Contact, une version 2D (`/portfolio-2d/`), un studio musical et cinq fiches projets. Ces choix créent des risques qu’un site classique n’a pas : contenu dessiné en WebGL, mouvements de caméra, vidéos en lecture automatique, modèles 3D lourds, son d’ambiance. J’ai retenu les critères en fonction de ces risques. Pour chacun, j’indique ce que j’ai vérifié, avec quel outil, le résultat obtenu et ce que j’ai corrigé.

**Conditions de mesure.**
- Lighthouse 12 sous Microsoft Edge (profil ordinateur), le 16 novembre 2026.
- Il a été lancé sur le build de production, servi en local avec compression. C’est ce build qui est publié.
- Les en-têtes HTTP, les redirections et les statuts ont été relevés sur le site en ligne avec `curl -I`.
- Les poids des fichiers viennent d’un relevé disque (`stat`). Un Mio vaut 1 048 576 octets.

## Résultats Lighthouse après corrections

Les quatre chiffres sont, dans l’ordre : performance, accessibilité, bonnes pratiques et référencement.

| Page | Scores | LCP | TBT | CLS | Transfert mesuré |
|---|---|---|---|---|---|
| `/` (ville 3D) | 62 / 100 / 100 / 100 | 1,7 s | 2,3 s | 0,008 | 57 à 68 Mio pendant la mesure |
| `/portfolio-2d/` | 70 / 100 / 100 / 100 | 0,9 s | 0,7 à 0,9 s | 0 | 15,6 à 19,2 Mio |
| `/contact/` | 98 / 100 / 100 / 100 | 0,7 s | 0 ms | 0,083 | 491 Kio |
| `/mentions-legales/` | 94 / 100 / 100 / 100 | 0,7 s | 180 ms | 0,001 | 488 Kio |
| `/musiques/` | 63 / 100 / 100 / 100 | 0,8 s | 3,2 s | 0 | 4,0 Mio |
| `/saturne/` | 47 à 78 / 100 / 100 / 100 | 0,9 à 9,9 s | 0,4 à 0,6 s | 0,002 | 15,1 Mio |
| `/projets/sull/` | 96 / 100 / 100 / 100 | 1,4 s | 0 ms | 0 | 1,7 Mio |
| `/projets/sparky/` | 99 / 100 / 100 / 100 | 1,0 s | 0 ms | 0 | 842 Kio |
| `/projets/ebene/` | 90 / 96 / 100 / 100 | 2,0 s | 0 ms | 0 | 4,2 Mio |
| `/projets/derriere-le-prompt/` | 96 / 100 / 100 / 100 | 1,3 s | 0 ms | 0 | 1,8 Mio |
| `/projets/reflections/` | 93 / 100 / 100 / 100 | 1,8 s | 0 ms | 0 | 1,9 Mio |
| `/projets/void/` | 99 / 100 / 100 / 100 | 0,7 s | 0 ms | 0,069 | 438 Kio |

**Avant corrections**, sur le site en ligne le 16 novembre :

| Page | Scores | Problèmes relevés |
|---|---|---|
| `/portfolio-2d/` | 65 / 100 / 100 / 90 | TBT 1,0 s, 15,1 Mio |
| `/projets/sull/` | 80 / 100 / 100 / 100 | CLS **0,43**, 9,0 Mio |
| `/mentions-legales/` | 96 / 100 / 100 / 90 | — |
| `/projets/void/` | 72 (performance) | Police chargée depuis Google Fonts, qui bloquait le premier affichage de 2,2 s |

Ces scores ne remplacent pas les essais manuels décrits plus bas : un 100 en accessibilité ne couvre que les contrôles automatiques.

Les deux pages notées sous 100 en accessibilité ou en performance sont des choix assumés :
- **Le 96 d’Ébène** vient d’une seule alerte de contraste. Elle porte sur le logo ÉBÈNE beige posé sur fond blanc, dans la planche « Logos (couleurs et texturés) ». C’est la présentation de cette variante de logo. Le critère WCAG 1.4.3 exclut explicitement les logotypes. Je l’ai déclaré comme image (`role="img"`, « Logo ÉBÈNE, version beige »).
- **Les performances de `/`, `/musiques/` et `/saturne/`** reflètent le coût des scènes WebGL. Je le détaille en section 2.

## 1. Accessibilité

| Critère et pourquoi il compte ici | Vérification | Résultat | Correction réalisée |
|---|---|---|---|
| **Alternative à la 3D.** Le parcours principal dépend de WebGL, du GPU et du défilement. | Lecture du HTML de chaque page. Navigation au clavier sur `/portfolio-2d/`. Accès direct aux fiches sans passer par la ville. | Le lien « Version 2D ↗ » est présent sur toutes les scènes 3D et accessible au clavier. Mais l’orbite 2D n’affichait les projets que dans le canvas : aucun projet n’était atteignable sans souris. | J’ai ajouté une liste HTML de liens vers les sept projets dans l’orbite. Elle est masquée visuellement, mais s’affiche au-dessus de l’orbite dès qu’elle reçoit le focus clavier. Toutes les fiches sont des pages HTML indexables. |
| **Parcours clavier.** Visiteurs sans souris. | Tabulation réelle, simulée dans le navigateur, sur `/portfolio-2d/`. Relevé de l’élément focalisé et de `:focus-visible` à chaque pas. | Ordre logique : version 3D, découvrir les projets, les 7 projets, contact (email, Instagram, LinkedIn), formulaire, liens de pied de page, en-tête, FR/EN, bouton son. Chaque lien a un contour de focus. Les champs du formulaire n’ont pas de contour, mais leur libellé remonte et le trait du champ s’éclaire. Le champ anti-spam est exclu de la tabulation (`tabindex="-1"`, `aria-hidden`). | Liste des projets ajoutée (ligne précédente). Le bouton FR/EN, qui est un lien construit lettre par lettre pour l’animation, reçoit le focus et l’activation au clavier. |
| **Nom accessible des commandes.** | Audit Lighthouse `label-content-name-mismatch`. | Le bouton affichait « EN », mais son nom accessible était « Switch the site to English » : un utilisateur de commande vocale qui dit « EN » ne le trouvait pas (WCAG 2.5.3). | Le nom est devenu « EN — switch the site to English » (« FR — afficher le site en français » en version anglaise). |
| **Réduction des mouvements.** La direction artistique repose sur des voyages de caméra, l’hyperespace et des glitchs. | Recherche de `prefers-reduced-motion` dans le code. Lecture des scripts de la ville, de l’espace, de l’orbite et des titres. | La 2D, les titres, le portrait, le formulaire et le chargement respectaient déjà la préférence. Le voyage 3D et les vidéos de l’orbite 2D, eux, l’ignoraient. | Avec cette préférence, l’accueil redirige vers la version 2D, avant le chargement de tout modèle. La 3D reste accessible volontairement par son lien. Dans la 2D, les cartes de l’orbite affichent une image fixe au lieu de boucler leur vidéo. |
| **Mobile et zoom.** | Simulation 375 × 812 px de l’accueil 2D et des cinq fiches. Contrôle de `scrollWidth`. Redirection mobile. | Sur téléphone, `/` redirige vers la 2D sans charger la ville. Aucun défilement horizontal à 375 px. Les fiches passent sous 900 px sur une mise en page recomposée, ce qui couvre aussi le zoom à 200 % sur un écran de 1440 px. | Redirection mobile vérifiée après le passage de la 3D à l’accueil. |
| **Textes alternatifs.** Les captures des fiches portent l’information des projets. | Inventaire des `<img>` par composant. Planches contact numérotées de chaque image, examinées une par une. | 49 images avaient `alt=""` sur les fiches ordinateur. 38 étaient informatives : maquettes, écrans, rendus, affiches. Les 216 images du configurateur Ébène sont des calques, déjà décrits par les `aria-label` des choix. | 38 descriptions rédigées, traduites en anglais. `alt=""` conservé pour les 11 décors (cercles, cadres, textures, flèche, icônes non cliquables). Les composants `*Mobile.astro` ne sont utilisés par aucune page et ne sont pas publiés. |
| **Contrastes.** Néon, petits corps, fonds animés. | Audit `color-contrast` de Lighthouse sur les 12 pages publiques. | Aucune alerte, sauf le logo beige d’Ébène, exempté (voir plus haut). | — |
| **Titres et structure.** Les titres principaux sont dessinés en WebGL ou en image. | Comptage des `<h1>` dans le HTML généré de chaque page. | Pas de `<h1>` sur `/`, `/portfolio-2d/`, `/contact/` et `/saturne/`. | Un `<h1>` est désormais présent sur chaque page. Il est masqué visuellement là où le titre est dessiné. `lang` vaut `fr` ou `en` selon la langue choisie, car le bouton FR/EN met à jour `<html lang>`. |
| **Son.** Musique d’ambiance et grognements du portrait. | Lecture de `portfolio-audio.js` et `about-avatar.js`. Parcours au clavier. | La musique démarre au premier geste du visiteur, jamais avant. Le bouton « Couper le son » est atteignable au clavier, porte un nom et un `title`, et le choix est mémorisé. Les grognements ne jouent qu’au clic sur la tête. | Conforme au critère WCAG 1.4.2 (moyen d’arrêter le son). Libellés du bouton son traduits en anglais. |
| **Sous-titres.** | Détection des pistes audio dans les fichiers MP4/WebM. Contenu vérifié avec moi-même, auteur des vidéos. | Les démos SULL, SPARKY, ÉBÈNE et Derrière le prompt ont une piste son, qui ne contient que de la musique, sans parole. Les vidéos de l’orbite sont muettes. | Pas de sous-titres nécessaires : aucune information n’est portée par la parole. |

## 2. Sobriété et performance

### Poids des ressources

| Ressource | Avant (relevé du 15 novembre) | Maintenant |
|---|---:|---:|
| Modèles du parcours 3D complet : ville `.gz`, compléments, traînées, espace, navette, Contact, fond | 138,6 Mio | **82,6 Mio** |
| Images des fiches (92 PNG de plus de 250 Kio) | 200,3 Mio | **18,9 Mio** (WebP) |
| Vidéo Derrière le prompt | 203 Mio | **34,5 Mio** |
| Fiche SULL, poids d’une visite | 9,0 Mio | **1,7 Mio** |

| Critère et pourquoi il compte ici | Vérification | Résultat | Correction réalisée |
|---|---|---|---|
| **Poids des modèles 3D.** La ville est la ressource la plus lourde du site. | Relevé disque des fichiers chargés par le code. Contrôle visuel avant/après. | 82,6 Mio pour le parcours 3D complet. | Modèles nettoyés (`dedup`) et quantifiés (glTF-Transform), compression meshopt. Ville servie en `.gz`. |
| **Images.** Les fiches utilisaient des PNG jusqu’à 14,4 Mio. | Liste des PNG référencés dans le code (`sharp`). Comparaison pixel par pixel, sur fond neutre, entre l’original et la conversion (PSNR). | 92 images concernées. | Conversion en WebP (qualité 90, transparence conservée, largeur plafonnée à 2880 px, soit deux fois la maquette). PSNR de **36,4 dB au minimum** : aucune différence visible. |
| **Stabilité de la mise en page.** | Audit CLS de Lighthouse. Recherche de l’élément qui bouge. | Sur SULL, le pied de page sautait (CLS 0,43). La hauteur de la page était calculée par un script différé, après le premier affichage. | La hauteur est calculée dans un script en ligne, juste après le contenu et avant le premier affichage. CLS de 0 sur les cinq fiches. |
| **Blocage du fil principal** sur l’accueil 2D. | Tâches longues et temps de script relevés par Lighthouse. | Deux copies de Three.js étaient chargées : l’une pour l’accueil, l’autre pour l’orbite. S’y ajoutait la compilation synchrone des shaders du titre. TBT de 1,0 s en ligne et de 3,1 s mesuré en local. | L’orbite utilise la même copie de Three.js que l’accueil. Le rendu de secours en Canvas 2D n’est téléchargé que sans WebGL. Les shaders de l’accueil sont compilés en parallèle (`compileAsync`). TBT de 0,7 à 0,9 s. |
| **Polices.** | Lighthouse (ressources bloquant l’affichage). Recherche des domaines externes dans le build. | Lexend était chargée depuis Google Fonts sur toutes les pages : 2,2 s de blocage du premier affichage, et l’adresse IP du visiteur transmise à Google. | Lexend est servie depuis le site. VOID passe de 72 à 99, Contact de 90 à 98. |
| **Coût des scènes WebGL.** | Lighthouse sur `/`, `/musiques/` et `/saturne/`. Relevés GPU antérieurs : environ 32 ms par million de pixels, dont 90 % d’éclairage. | TBT de 2,3 à 3,2 s : c’est la préparation des scènes. La page reste affichée et le chargement est annoncé. Sur `/saturne/`, le LCP varie de 0,9 à 9,9 s selon que la description du projet apparaît ou non, une fois la scène chargée, pendant la mesure. | La 3D est réservée aux ordinateurs : téléphones et mouvement réduit vont en 2D. Compilation des shaders en parallèle, résolution adaptative au temps de rendu (plancher 0,72), boucles d’éclairage compactes, vidéos décodées seulement pour les trois cartes visibles. |
| **Cache et compression HTTP.** | `curl -I` sur le site en ligne. | Compression gzip active. Fichiers `/_astro/` (noms changeant à chaque build) : cache d’un an `immutable`. Modèles : 7 jours. Pages HTML : `no-cache`. En-tête `X-Content-Type-Options: nosniff`. | — |
| **Fichiers lourds hors Git.** | `.gitignore` et `git check-ignore`. | La vidéo Derrière le prompt est ignorée. Les originaux non compressés sont conservés hors du dépôt. | — |

## 3. Référencement

| Critère et pourquoi il compte ici | Vérification | Résultat | Correction réalisée |
|---|---|---|---|
| **Descriptions.** Le contenu de la ville est invisible pour un robot. | `meta[name=description]` dans le HTML généré de chaque page. Audit SEO de Lighthouse. | Description absente sur `/`, la 2D, Contact, le Studio, les mentions et Saturne. Descriptions génériques (« SULL — Projet de Clément Bertrand ») sur les fiches. | Une description rédigée pour chaque page. Les fiches reprennent la description éditoriale de chaque projet. SEO à 100 sur les 12 pages. |
| **Partage LinkedIn (Open Graph).** Le portfolio sera partagé à des recruteurs. | Recherche de `og:*` dans le HTML. | Aucune balise. | `og:title`, `og:description`, `og:url`, `og:image` (1200 × 630, titre « Enter the experience »), `og:locale` (fr et en) et carte Twitter, via un composant commun (`SeoHead.astro`). |
| **URL canonique.** La 2D a deux entrées, et le site répond en HTTP, en HTTPS et sur `www`. | Recherche de `rel=canonical`. `curl -I` sur `http://` et sur `www`. | Aucune URL canonique. HTTP redirige en 301 vers HTTPS. | URL canonique absolue sur chaque page (`site` déclaré dans `astro.config.mjs`). |
| **Sitemap et robots.** | `curl` de `/robots.txt` et `/sitemap.xml` sur le site en ligne. | Les deux répondaient 404. | `robots.txt` (pages de test exclues, sitemap déclaré). `sitemap.xml` généré au build à partir de la liste des projets : 13 URL publiques. |
| **Pages de test.** | Statut HTTP en ligne. | `/test-ville/` et `/test-espace/` répondent 404 : elles sont exclues par `deploy.ps1`. | `noindex` ajouté en plus, au cas où elles seraient publiées par une autre procédure. |
| **Liens explorables.** | Audit `crawlable-anchors`. | Sur `/saturne/`, un lien caché n’avait pas de `href`. | Adresse par défaut `/contact/`. Le script la remplace par le bon contact. |
| **Contenu hors canvas.** | Lecture du HTML sans scripts. | Les fiches sont du texte HTML. L’orbite expose désormais ses sept liens. Les images informatives ont un texte alternatif. | Voir la section 1. |

## 4. Conformité juridique

| Critère et pourquoi il compte ici | Vérification | Résultat | Correction réalisée |
|---|---|---|---|
| **Éditeur et hébergeur.** | Comparaison de la page avec l’hébergeur réel du VPS. | La page indiquait Infomaniak comme hébergeur « prévu ». | Hébergeur : SAS PulseHeberg, 9 boulevard de Strasbourg, 83000 Toulon — RCS Toulon 824 070 619. |
| **Ressources de tiers sous CC BY.** La licence impose de créditer l’auteur, visiblement. | Comparaison de `public/models/space/CREDITS.txt` avec les modèles réellement chargés. | Les crédits existaient dans un fichier texte, mais n’étaient affichés nulle part sur le site. | Section « Ressources de tiers » dans les mentions légales, avec auteur, licence, lien source et modifications : astéroïdes (Sereib, CC BY 4.0), navette (Daniel Andersson, CC BY), studio (Noah Lupowitz, CC BY), roches lunaires (Poly Haven, CC0). Saturne est indiquée comme libre de droits et adaptée. |
| **Polices.** | Inventaire des polices réellement servies et de leurs fichiers de licence. | Polices libres de droits. Notices OFL présentes pour Artifika, Babylonica et Baskervville, absentes pour Lexend, Jersey et Le Murmure. Agency FB n’est utilisée que comme contours vectorisés dans les modèles 3D. | Notices OFL ajoutées à côté de Lexend, Jersey et Le Murmure. Licences listées dans les mentions légales. |
| **Sons, musiques et vidéos.** | Inventaire des fichiers audio et vidéo. | Mes créations, ou des ressources libres de droits (grognements compris). | Mention ajoutée aux crédits. |
| **Œuvres et marques citées.** Affiches Star Wars, films dans SULL. | Lecture des fiches. | Projets d’étude et fan art. | Mention que les marques et œuvres citées restent la propriété de leurs titulaires. La navette est signalée comme « modèle de fan inspiré de Star Wars ». |
| **Données du formulaire (RGPD).** | Lecture du formulaire, du script d’envoi et de la page de confidentialité. Repères : fiche CNIL sur l’information lors de la collecte. | Finalité, base légale (intérêt légitime), destinataires (FormSubmit, Gmail), transferts hors UE et droits étaient indiqués. La durée de conservation restait floue. | Durée fixée : **trois ans au plus après le dernier contact, puis suppression**. Les champs obligatoires et facultatifs sont indiqués sur le formulaire. |
| **Traceurs et requêtes vers des tiers.** | Recherche de tous les domaines externes dans le build. Inventaire de `localStorage` et `sessionStorage`. | Deux tiers étaient contactés à chaque visite : Google Fonts (Lexend) et jsDelivr (bibliothèque `opentype.js`, appelée par le chargeur de police de Three.js pour le titre CONTACT). Aucun cookie, aucune mesure d’audience. | Lexend est servie localement. La police du titre CONTACT a été convertie une fois au format Three.js, ce qui supprime l’appel à jsDelivr. Le site ne contacte plus aucun tiers pendant la navigation, sauf FormSubmit à l’envoi du formulaire. La page de confidentialité liste les stockages réels (langue, son, musique, position dans le parcours 3D) et indique l’absence de cookie, de mesure d’audience et de publicité. |
| **Bibliothèques.** | Notices dans le dépôt. | Three.js (MIT), hls.js (Apache 2.0), effet d’hyperespace adapté de Seer.js (MIT), Astro (MIT). | Mentionnées dans les crédits. Notice Seer conservée dans `src/lib/city-render/vendor/`. |
| **Réception du formulaire.** | Procédure décrite dans `docs/contact-reception.md`. | FormSubmit exige que le propriétaire de l’adresse confirme le formulaire une seule fois, par un lien reçu par email. | Je fais un premier envoi, je confirme le lien reçu, puis un second envoi avec une pièce jointe pour contrôler la réception. Aucun envoi automatique n’a été fait pendant le développement. |

## Outils et méthode

- **Lighthouse 12** (Edge, profil ordinateur) : 4 catégories sur les 12 pages publiques, avant et après corrections.
- **Navigateur simulé** (Chromium) : tabulation réelle, simulation 375 px, version anglaise pour repérer les textes non traduits, contrôle du rendu de chaque page.
- **`curl -I`** : statuts, redirections, cache, compression et en-têtes de sécurité du site en ligne.
- **`sharp`** : inventaire et conversion des images, comparaison PSNR.
- **Recherche dans le build** : domaines externes, balises `<h1>`, `description`, `og:*`, `canonical`.
- **Planches contact numérotées** : rédaction des textes alternatifs.

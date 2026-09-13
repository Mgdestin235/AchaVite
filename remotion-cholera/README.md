# Vidéo de sensibilisation — Choléra (AJASD)

Projet [Remotion](https://www.remotion.dev/) qui génère la vidéo « LE
CHOLÉRA, C'EST QUOI ? » (campagne AJASD) à partir du texte de narration
fourni, repris mot pour mot. Le texte de chaque réplique est animé à l'écran
(sous-titrage intégré), avec un habillage graphique par icônes et couleurs
selon le ton du message (alerte, neutre, positif, marque). Durée ~1 min 50
(durée cible demandée), carton de titre en ouverture.

Ce dossier est un projet Node autonome, indépendant de l'application
Next.js/e-commerce à la racine du dépôt (ses dépendances ne se mélangent
pas avec `package.json` à la racine).

## ⚠️ Important : ce projet n'a pas pu être rendu dans cette session

L'environnement d'exécution utilisé pour écrire ce code n'a pas accès au
réseau pour installer des paquets npm ni de binaire `ffmpeg`/moteur de
synthèse vocale (TTS) disponible. Le code ci-dessous est donc complet et
prêt à l'emploi, mais **n'a pas pu être compilé ni rendu en `.mp4` ici** —
il faut le faire sur une machine avec accès Internet (ta machine, ou un
pipeline CI).

## Installation et prévisualisation

```bash
cd remotion-cholera
npm install
npm start          # ouvre Remotion Studio (prévisualisation + lecture)
```

## Générer le fichier vidéo final

```bash
npm run build       # -> out/cholera-campaign.mp4
```

Format par défaut : 1080×1920 (vertical, 9:16), 30 im/s, ~1 min 52 —
adapté à un partage WhatsApp/Facebook/Statuts. Pour un format paysage
16:9 (YouTube, TV), modifie `WIDTH`/`HEIGHT` dans `src/lib/timing.ts`.

## Ajouter une voix off (narration)

Aucune voix off n'est incluse : cet environnement ne dispose d'aucun outil
de synthèse vocale (TTS) ni d'accès réseau vers un service en ligne. Pour en
ajouter une :

1. Enregistre une vraie narration, ou génère-la avec un outil TTS de ton
   choix (ex. ElevenLabs, Azure/Google TTS, etc.) à partir du texte exact du
   script (voir `src/data/script.ts`).
2. Place le fichier audio dans `public/narration.mp3`.
3. Dans `src/Video.tsx`, ajoute `Audio, staticFile` à l'import de
   `"remotion"` et décommente/ajoute :
   ```tsx
   <Audio src={staticFile("narration.mp3")} />
   ```
4. Si la narration réelle est plus longue ou plus courte que le rythme de
   lecture estimé, ajuste `WORDS_PER_SECOND` dans `src/lib/timing.ts` (ou
   remplace le calcul par les timestamps réels de ta narration).

La vidéo reste compréhensible sans son grâce au texte affiché à l'écran.

## Remplacer les animations par de vraies images/vidéos

Le style actuel est du motion design (texte + icônes + fonds colorés) car
aucune banque d'images/vidéos n'était disponible pour ce montage. Pour
utiliser de vraies photos/vidéos (mains lavées, eau potable, etc.) :

1. Place les fichiers dans `public/` (ex. `public/media/lavage-mains.jpg`).
2. Dans une scène (`src/scenes/*.tsx`), remplace ou superpose le fond par
   `<Img src={staticFile("media/lavage-mains.jpg")} />` (image) ou
   `<OffthreadVideo src={staticFile("media/clip.mp4")} />` (vidéo), importés
   depuis `"remotion"`.

## Structure du projet

```
src/
  data/script.ts       Texte du script, découpé en séquences ("beats")
  types.ts              Types des séquences (statement / list / pillars / credits)
  theme.ts               Couleurs par ton (alerte, neutre, positif, marque)
  lib/timing.ts          Calcul des durées (fps, résolution, timeline)
  components/            Fond animé, texte animé, icônes SVG
  scenes/                 4 gabarits de scène pilotés par les données du script
  Video.tsx               Compose toute la timeline
  Root.tsx / index.ts     Déclaration Remotion (résolution, durée, fps)
```

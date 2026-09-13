import { beats } from "../data/script";
import type { Beat } from "../types";

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

/** Réglé pour viser ~1 min 50 sur ce script (durée cible demandée). */
const WORDS_PER_SECOND = 2.7;
/** Plancher pour qu'une réplique courte ("Oui.", "Non.") reste lisible à l'écran. */
const MIN_STATEMENT_FRAMES = 33;
/** Petite marge de respiration ajoutée à chaque séquence. */
const BREATH_FRAMES = 5;
/** Frames supplémentaires pour une réplique "big" (accent visuel plus fort). */
const BIG_EXTRA_FRAMES = 8;

const TITLE_FRAMES = 105;
const PILLARS_FRAMES = 96;
const CREDITS_FRAMES = 126;

const countWords = (text: string): number => text.trim().split(/\s+/).filter(Boolean).length;

export const durationForText = (text: string, extraFrames = 0): number => {
  const seconds = countWords(text) / WORDS_PER_SECOND;
  return Math.max(MIN_STATEMENT_FRAMES, Math.round(seconds * FPS)) + BREATH_FRAMES + extraFrames;
};

export const durationForBeat = (beat: Beat): number => {
  switch (beat.type) {
    case "title":
      return TITLE_FRAMES;
    case "statement":
      return durationForText(beat.text, beat.big ? BIG_EXTRA_FRAMES : 0);
    case "list": {
      const titleFrames = durationForText(beat.title);
      const itemFrames = beat.items.reduce((sum, item) => sum + durationForText(item.text), 0);
      return titleFrames + itemFrames;
    }
    case "pillars":
      return PILLARS_FRAMES;
    case "credits":
      return CREDITS_FRAMES;
    default:
      return MIN_STATEMENT_FRAMES;
  }
};

export type TimelineEntry = { beat: Beat; from: number; durationInFrames: number };

export const getBeatTimeline = (): TimelineEntry[] => {
  let cursor = 0;
  return beats.map((beat) => {
    const durationInFrames = durationForBeat(beat);
    const entry: TimelineEntry = { beat, from: cursor, durationInFrames };
    cursor += durationInFrames;
    return entry;
  });
};

export const getTotalDurationInFrames = (): number =>
  getBeatTimeline().reduce((sum, entry) => sum + entry.durationInFrames, 0);

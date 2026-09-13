import { beats } from "../data/script";
import type { Beat } from "../types";

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

const WORDS_PER_SECOND = 2.2;
/** Plancher pour qu'une réplique courte ("Oui.", "Non.") reste lisible à l'écran. */
const MIN_STATEMENT_FRAMES = 45;
/** Petite marge de respiration ajoutée à chaque séquence. */
const BREATH_FRAMES = 8;

const countWords = (text: string): number => text.trim().split(/\s+/).filter(Boolean).length;

export const durationForText = (text: string, extraFrames = 0): number => {
  const seconds = countWords(text) / WORDS_PER_SECOND;
  return Math.max(MIN_STATEMENT_FRAMES, Math.round(seconds * FPS)) + BREATH_FRAMES + extraFrames;
};

export const durationForBeat = (beat: Beat): number => {
  switch (beat.type) {
    case "statement":
      return durationForText(beat.text, beat.big ? 15 : 0);
    case "list": {
      const titleFrames = durationForText(beat.title);
      const itemFrames = beat.items.reduce((sum, item) => sum + durationForText(item.text), 0);
      return titleFrames + itemFrames;
    }
    case "pillars":
      return 150;
    case "credits":
      return 200;
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

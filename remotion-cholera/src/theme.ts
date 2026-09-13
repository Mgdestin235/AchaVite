import type { Tone } from "./types";

export const TONE_COLORS: Record<Tone, { from: string; to: string; accent: string }> = {
  neutral: { from: "#0B3B5C", to: "#08283F", accent: "#4FB8E0" },
  alert: { from: "#7A1F1F", to: "#4A1010", accent: "#F2704A" },
  positive: { from: "#0E6E55", to: "#084535", accent: "#4ED6A8" },
  brand: { from: "#123B6B", to: "#0A2647", accent: "#F2C14E" },
};

import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { TONE_COLORS } from "../theme";
import type { Tone } from "../types";

export const Background: React.FC<{ tone: Tone }> = ({ tone }) => {
  const frame = useCurrentFrame();
  const { from, to, accent } = TONE_COLORS[tone];
  const pulse = 0.5 + 0.5 * Math.sin(frame / 45);

  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, ${from}, ${to})` }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% ${25 + pulse * 12}%, ${accent}33, transparent 62%)`,
        }}
      />
    </AbsoluteFill>
  );
};

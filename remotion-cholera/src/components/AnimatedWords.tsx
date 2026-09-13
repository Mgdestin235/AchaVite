import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export const AnimatedWords: React.FC<{
  text: string;
  fontSize: number;
  delay?: number;
  color?: string;
}> = ({ text, fontSize, delay = 0, color = "white" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(" ");

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "0.3em",
        rowGap: "0.15em",
      }}
    >
      {words.map((word, i) => {
        const wordDelay = delay + i * 3;
        const progress = spring({ frame: frame - wordDelay, fps, config: { damping: 200 } });
        const opacity = interpolate(progress, [0, 1], [0, 1]);
        const y = interpolate(progress, [0, 1], [24, 0]);

        return (
          <span
            key={i}
            style={{
              opacity,
              transform: `translateY(${y}px)`,
              fontSize,
              fontWeight: 800,
              color,
              textShadow: "0 4px 24px rgba(0,0,0,0.35)",
              lineHeight: 1.15,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};

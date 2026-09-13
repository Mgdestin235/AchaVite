import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Background } from "../components/Background";
import { Icon } from "../components/Icon";
import type { TitleBeat } from "../types";

export const TitleScene: React.FC<{ beat: TitleBeat }> = ({ beat }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [0, 20], [16, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <Background tone="brand" />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: "0 80px",
          gap: 26,
          opacity,
          transform: `translateY(${y}px)`,
        }}
      >
        <Icon name="shield" size={90} />
        <span
          style={{
            color: "white",
            fontSize: 76,
            fontWeight: 900,
            textAlign: "center",
            lineHeight: 1.2,
            letterSpacing: 1,
          }}
        >
          {beat.title}
        </span>
        <span
          style={{
            color: "#F2C14E",
            fontSize: 34,
            fontWeight: 700,
            textAlign: "center",
            letterSpacing: 1,
          }}
        >
          {beat.subtitle}
        </span>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

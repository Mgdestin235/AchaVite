import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Background } from "../components/Background";
import { Icon } from "../components/Icon";

export const CreditsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 25], [0, 1], {
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
          padding: "0 90px",
          gap: 28,
          opacity,
        }}
      >
        <Icon name="shield" size={110} />
        <span
          style={{
            color: "white",
            fontSize: 40,
            fontWeight: 700,
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          Une campagne de sensibilisation de l'Association Jeun'Action pour la Sensibilisation et
          le Développement
        </span>
        <span
          style={{
            color: "#F2C14E",
            fontSize: 44,
            fontWeight: 900,
            letterSpacing: 3,
            textAlign: "center",
          }}
        >
          PRÉVENTION · ÉDUCATION · DÉVELOPPEMENT
        </span>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

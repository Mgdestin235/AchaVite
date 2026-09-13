import React from "react";
import { AbsoluteFill } from "remotion";
import { AnimatedWords } from "../components/AnimatedWords";
import { Background } from "../components/Background";
import { Icon } from "../components/Icon";
import type { StatementBeat } from "../types";

export const StatementScene: React.FC<{ beat: StatementBeat }> = ({ beat }) => {
  return (
    <AbsoluteFill>
      <Background tone={beat.tone} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: "0 90px",
          gap: 40,
        }}
      >
        {beat.icon && (
          <div style={{ opacity: 0.9 }}>
            <Icon name={beat.icon} size={beat.big ? 140 : 100} />
          </div>
        )}
        <AnimatedWords text={beat.text} fontSize={beat.big ? 96 : 64} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

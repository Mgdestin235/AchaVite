import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Background } from "../components/Background";
import { Icon } from "../components/Icon";
import type { PillarsBeat } from "../types";

export const PillarsScene: React.FC<{ beat: PillarsBeat }> = ({ beat }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      <Background tone={beat.tone} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 50,
            padding: "0 70px",
          }}
        >
          {beat.items.map((item, i) => {
            const progress = spring({ frame: frame - i * 6, fps, config: { damping: 200 } });
            const scale = interpolate(progress, [0, 1], [0.6, 1]);
            const opacity = interpolate(progress, [0, 1], [0, 1]);
            return (
              <div
                key={i}
                style={{
                  opacity,
                  transform: `scale(${scale})`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 16,
                  background: "rgba(255,255,255,0.08)",
                  borderRadius: 28,
                  padding: "36px 20px",
                }}
              >
                <Icon name={item.icon} size={72} />
                <span style={{ color: "white", fontSize: 32, fontWeight: 800, textAlign: "center" }}>
                  {item.text}
                </span>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

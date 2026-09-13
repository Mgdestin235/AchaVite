import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { AnimatedWords } from "../components/AnimatedWords";
import { Background } from "../components/Background";
import { Icon } from "../components/Icon";
import { durationForText } from "../lib/timing";
import type { ListBeat } from "../types";

export const ListScene: React.FC<{ beat: ListBeat }> = ({ beat }) => {
  const frame = useCurrentFrame();
  const titleDuration = durationForText(beat.title);

  let cursor = titleDuration;
  const revealFrames = beat.items.map((item) => {
    const revealAt = cursor;
    // Les répliques suivantes chevauchent légèrement pour que la liste
    // complète tienne à l'écran tout en restant lisible.
    cursor += durationForText(item.text) * 0.55;
    return revealAt;
  });

  return (
    <AbsoluteFill>
      <Background tone={beat.tone} />
      <AbsoluteFill style={{ alignItems: "center", padding: "110px 80px 0" }}>
        <div
          style={{
            opacity: interpolate(frame, [0, 20, titleDuration - 10, titleDuration], [0, 1, 1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          <AnimatedWords text={beat.title} fontSize={58} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 26, marginTop: 60 }}>
          {beat.items.map((item, i) => {
            const revealAt = revealFrames[i];
            const opacity = interpolate(frame, [revealAt, revealAt + 15], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const x = interpolate(frame, [revealAt, revealAt + 15], [-40, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 24,
                  opacity,
                  transform: `translateX(${x}px)`,
                }}
              >
                <Icon name={item.icon} size={60} />
                <span style={{ color: "white", fontSize: 38, fontWeight: 700, maxWidth: 760 }}>
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

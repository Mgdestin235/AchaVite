import React from "react";
import { Composition } from "remotion";
import { CholeraCampaign } from "./Video";
import { FPS, HEIGHT, WIDTH, getTotalDurationInFrames } from "./lib/timing";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="CholeraCampaign"
      component={CholeraCampaign}
      durationInFrames={getTotalDurationInFrames()}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};

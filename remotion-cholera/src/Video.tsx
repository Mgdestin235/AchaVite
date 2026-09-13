import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { getBeatTimeline } from "./lib/timing";
import { CreditsScene } from "./scenes/CreditsScene";
import { ListScene } from "./scenes/ListScene";
import { PillarsScene } from "./scenes/PillarsScene";
import { StatementScene } from "./scenes/StatementScene";

export const CholeraCampaign: React.FC = () => {
  const timeline = getBeatTimeline();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "black",
        fontFamily: "-apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      }}
    >
      {/*
        Pour ajouter une voix off :
        1. Place ton fichier audio (narration enregistrée, ou générée par un
           outil de synthèse vocale de ton choix) dans public/narration.mp3.
        2. Ajoute en haut de ce fichier : import { Audio, staticFile } from "remotion";
        3. Ajoute juste ici : <Audio src={staticFile("narration.mp3")} />
        Le texte de chaque réplique est déjà affiché à l'écran (sous-titrage
        intégré), donc la vidéo reste compréhensible même sans son — utile
        pour les partages WhatsApp/Facebook, souvent regardés en muet.
      */}

      {timeline.map(({ beat, from, durationInFrames }, i) => (
        <Sequence key={i} from={from} durationInFrames={durationInFrames}>
          {beat.type === "statement" && <StatementScene beat={beat} />}
          {beat.type === "list" && <ListScene beat={beat} />}
          {beat.type === "pillars" && <PillarsScene beat={beat} />}
          {beat.type === "credits" && <CreditsScene />}
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

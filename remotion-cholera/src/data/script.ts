import type { Beat } from "../types";

/**
 * Texte exact de la narration "LE CHOLÉRA, C'EST QUOI ?" (AJASD), découpé en
 * séquences ("beats") pour la vidéo. Chaque réplique est reprise mot pour
 * mot — le texte affiché à l'écran sert aussi de sous-titrage intégré.
 */
export const beats: Beat[] = [
  {
    type: "title",
    title: "LE CHOLÉRA, C'EST QUOI ?",
    subtitle: "Campagne de sensibilisation AJASD",
  },
  {
    type: "statement",
    text: "Une simple gorgée d'eau peut-elle rendre malade ?",
    tone: "neutral",
    icon: "drop",
  },
  { type: "statement", text: "Oui.", tone: "alert", big: true },
  {
    type: "statement",
    text: "Si cette eau est contaminée.",
    tone: "alert",
    icon: "warning",
  },
  {
    type: "statement",
    text: "Aujourd'hui, parlons du choléra.",
    tone: "brand",
    big: true,
  },
  {
    type: "statement",
    text: "Le choléra est une maladie infectieuse qui provoque une diarrhée importante.",
    tone: "neutral",
    icon: "drop",
  },
  {
    type: "statement",
    text: "Cette diarrhée peut entraîner une déshydratation sévère et dangereuse, surtout lorsqu'elle n'est pas prise en charge rapidement.",
    tone: "alert",
    icon: "warning",
  },
  {
    type: "statement",
    text: "Le choléra se transmet principalement lorsqu'une personne consomme de l'eau ou des aliments contaminés par la bactérie responsable de la maladie.",
    tone: "neutral",
    icon: "food",
  },
  { type: "statement", text: "Mais alors...", tone: "neutral" },
  {
    type: "statement",
    text: "Est-ce simplement parce qu'on a bu beaucoup d'eau qu'on attrape le choléra ?",
    tone: "neutral",
  },
  { type: "statement", text: "Non.", tone: "alert", big: true },
  {
    type: "statement",
    text: "Le problème vient surtout de l'eau contaminée, du manque d'hygiène et de mauvaises conditions d'assainissement.",
    tone: "alert",
    icon: "warning",
  },
  {
    type: "statement",
    text: "Alors, comment pouvons-nous nous protéger ?",
    tone: "brand",
    big: true,
  },
  {
    type: "list",
    title: "Comment se protéger",
    tone: "positive",
    items: [
      {
        icon: "hands",
        text: "D'abord, lavons-nous régulièrement les mains avec de l'eau et du savon.",
      },
      { icon: "drop", text: "Consommons une eau sûre et propre." },
      { icon: "food", text: "Protégeons nos aliments contre toute contamination." },
      { icon: "storage", text: "Conservons correctement notre eau." },
      { icon: "toilet", text: "Utilisons des toilettes propres et bien entretenues." },
      { icon: "leaf", text: "Gardons notre environnement propre." },
      {
        icon: "people",
        text: "Et surtout, adoptons de bonnes pratiques d'hygiène au sein de nos familles et dans nos communautés.",
      },
    ],
  },
  {
    type: "pillars",
    tone: "positive",
    items: [
      { icon: "drop", text: "Une eau sûre." },
      { icon: "hands", text: "Des mains propres." },
      { icon: "leaf", text: "Un environnement sain." },
      { icon: "toilet", text: "Des installations bien entretenues." },
    ],
  },
  {
    type: "statement",
    text: "Voilà des gestes simples qui peuvent faire toute la différence.",
    tone: "positive",
  },
  {
    type: "statement",
    text: "Le choléra peut être évité.",
    tone: "positive",
    big: true,
    icon: "shield",
  },
  {
    type: "statement",
    text: "Une bonne hygiène et une eau sûre peuvent sauver des vies.",
    tone: "positive",
  },
  {
    type: "statement",
    text: "La lutte contre le choléra nous concerne tous.",
    tone: "brand",
  },
  { type: "statement", text: "C'est une affaire nationale.", tone: "brand", big: true },
  {
    type: "statement",
    text: "Peuple tchadien, associons notre voix à celle de l'Association Jeun'Action pour la Sensibilisation et le Développement, A-J-A-S-D, ainsi qu'à celle du Ministère de la Santé Publique.",
    tone: "brand",
  },
  { type: "statement", text: "Ensemble, informons.", tone: "brand" },
  { type: "statement", text: "Ensemble, adoptons les bons gestes.", tone: "brand" },
  {
    type: "statement",
    text: "Ensemble, protégeons nos familles et nos communautés.",
    tone: "brand",
  },
  {
    type: "statement",
    text: "Ensemble, luttons contre le choléra.",
    tone: "brand",
    big: true,
  },
  {
    type: "statement",
    text: "Hygiène, plus eau sûre, égale protection.",
    tone: "positive",
    big: true,
    icon: "shield",
  },
  { type: "credits" },
];

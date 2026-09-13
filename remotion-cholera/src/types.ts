export type Tone = "neutral" | "alert" | "positive" | "brand";

export type IconName =
  | "drop"
  | "hands"
  | "food"
  | "storage"
  | "toilet"
  | "leaf"
  | "people"
  | "shield"
  | "warning";

export type StatementBeat = {
  type: "statement";
  text: string;
  tone: Tone;
  icon?: IconName;
  big?: boolean;
};

export type ListBeat = {
  type: "list";
  title: string;
  tone: Tone;
  items: { icon: IconName; text: string }[];
};

export type PillarsBeat = {
  type: "pillars";
  tone: Tone;
  items: { icon: IconName; text: string }[];
};

export type CreditsBeat = { type: "credits" };

export type Beat = StatementBeat | ListBeat | PillarsBeat | CreditsBeat;

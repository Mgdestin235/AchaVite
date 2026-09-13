import React from "react";
import type { IconName } from "../types";

/**
 * Petit set d'icônes en ligne (SVG à formes simples) pour éviter toute
 * dépendance externe — l'ensemble reste lisible même à petite taille.
 */
export const Icon: React.FC<{ name: IconName; size?: number; color?: string }> = ({
  name,
  size = 64,
  color = "white",
}) => {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 64 64",
    fill: "none" as const,
    stroke: color,
    strokeWidth: 4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "drop":
      return (
        <svg {...common}>
          <path
            d="M32 6 C40 20 50 32 50 42 A18 18 0 1 1 14 42 C14 32 24 20 32 6 Z"
            fill={color}
            fillOpacity={0.15}
          />
        </svg>
      );
    case "hands":
      return (
        <svg {...common}>
          <rect x="12" y="34" width="40" height="18" rx="9" fill={color} fillOpacity={0.15} />
          <circle cx="24" cy="20" r="3" fill={color} />
          <circle cx="34" cy="14" r="3" fill={color} />
          <circle cx="42" cy="22" r="3" fill={color} />
        </svg>
      );
    case "food":
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="20" fill={color} fillOpacity={0.15} />
          <line x1="20" y1="14" x2="20" y2="50" />
          <line x1="16" y1="14" x2="16" y2="24" />
          <line x1="24" y1="14" x2="24" y2="24" />
          <path d="M44 14 V28 C44 31 41 33 38 33 V50" />
        </svg>
      );
    case "storage":
      return (
        <svg {...common}>
          <rect x="24" y="8" width="14" height="12" rx="3" fill={color} fillOpacity={0.15} />
          <rect x="14" y="20" width="36" height="36" rx="6" fill={color} fillOpacity={0.15} />
          <line x1="14" y1="38" x2="50" y2="38" />
        </svg>
      );
    case "toilet":
      return (
        <svg {...common}>
          <path d="M32 6 L56 24 H8 Z" fill={color} fillOpacity={0.15} />
          <rect x="14" y="24" width="36" height="30" rx="4" fill={color} fillOpacity={0.15} />
          <rect x="26" y="36" width="12" height="18" rx="2" />
        </svg>
      );
    case "leaf":
      return (
        <svg {...common}>
          <path
            d="M32 8 C50 8 54 26 40 40 C30 50 16 50 12 54 C12 36 14 20 32 8 Z"
            fill={color}
            fillOpacity={0.15}
          />
          <line x1="14" y1="52" x2="36" y2="20" />
        </svg>
      );
    case "people":
      return (
        <svg {...common}>
          <circle cx="20" cy="22" r="8" fill={color} fillOpacity={0.15} />
          <path d="M8 50 C8 38 14 34 20 34 C26 34 32 38 32 50" />
          <circle cx="44" cy="22" r="8" fill={color} fillOpacity={0.15} />
          <path d="M32 50 C32 38 38 34 44 34 C50 34 56 38 56 50" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path
            d="M32 6 L54 16 V32 C54 46 44 56 32 60 C20 56 10 46 10 32 V16 Z"
            fill={color}
            fillOpacity={0.15}
          />
          <polyline points="22,32 29,39 44,24" />
        </svg>
      );
    case "warning":
      return (
        <svg {...common}>
          <path d="M32 8 L58 54 H6 Z" fill={color} fillOpacity={0.15} />
          <line x1="32" y1="26" x2="32" y2="40" />
          <circle cx="32" cy="46" r="1.5" fill={color} />
        </svg>
      );
    default:
      return null;
  }
};

// Palette facts used by the outfit engine (Phase 3) and the UI swatches.
// Pure data, no I/O. lightness is 0 (black) to 100 (white).

import type { Color } from "../types";

export type ColorFamily = "neutral" | "blue" | "earth" | "warm";

export type ColorInfo = {
  label: string;
  hex: string;
  lightness: number;
  family: ColorFamily;
};

export const COLOR_INFO: Record<Color, ColorInfo> = {
  white: { label: "White", hex: "#FFFFFF", lightness: 98, family: "neutral" },
  off_white: { label: "Off-white", hex: "#F4F1EA", lightness: 94, family: "neutral" },
  cream: { label: "Cream", hex: "#EFE4C8", lightness: 90, family: "neutral" },
  beige: { label: "Beige", hex: "#D8C6A5", lightness: 80, family: "earth" },
  light_grey: { label: "Light grey", hex: "#C9CBCF", lightness: 80, family: "neutral" },
  grey: { label: "Grey", hex: "#8E9196", lightness: 58, family: "neutral" },
  charcoal: { label: "Charcoal", hex: "#3F4246", lightness: 28, family: "neutral" },
  black: { label: "Black", hex: "#141414", lightness: 5, family: "neutral" },
  navy: { label: "Navy", hex: "#1F2A44", lightness: 18, family: "blue" },
  royal_blue: { label: "Royal blue", hex: "#2F4FB0", lightness: 38, family: "blue" },
  bright_blue: { label: "Bright blue", hex: "#2F7DE1", lightness: 52, family: "blue" },
  light_blue_denim: { label: "Light blue denim", hex: "#A9C1DB", lightness: 75, family: "blue" },
  mid_blue_denim: { label: "Mid blue denim", hex: "#5E7FA8", lightness: 50, family: "blue" },
  dark_blue_denim: { label: "Dark blue denim", hex: "#2C3E5C", lightness: 25, family: "blue" },
  tan: { label: "Tan", hex: "#C19A6B", lightness: 62, family: "earth" },
  camel: { label: "Camel", hex: "#B98B53", lightness: 58, family: "earth" },
  brown: { label: "Brown", hex: "#7B5233", lightness: 35, family: "earth" },
  dark_brown: { label: "Dark brown", hex: "#4A3020", lightness: 20, family: "earth" },
  burgundy: { label: "Burgundy", hex: "#6D1F2C", lightness: 22, family: "warm" },
  olive: { label: "Olive", hex: "#6B6B3A", lightness: 40, family: "earth" },
  red: { label: "Red", hex: "#C0392B", lightness: 42, family: "warm" },
  other: { label: "Other", hex: "#A0A0A0", lightness: 50, family: "neutral" },
};

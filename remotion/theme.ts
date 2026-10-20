import { loadFont as loadPoppins } from "@remotion/google-fonts/Poppins";
import { loadFont as loadGrotesk } from "@remotion/google-fonts/SpaceGrotesk";

// Same type pairing as the app: Poppins for UI text, Space Grotesk for headings
export const { fontFamily: body } = loadPoppins("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});
export const { fontFamily: heading } = loadGrotesk("normal", {
  weights: ["500", "600", "700"],
  subsets: ["latin"],
});

// Hex equivalents of the app's OKLCH tokens (globals.css)
export const C = {
  primary: "#245bff",
  cyan: "#30d5ff",
  gold: "#ebae51",
  ink: "#131b26",
  muted: "#5e6d83",
  bg: "#ebf1f8",
  card: "#fafcff",
  border: "#dbe3ee",
  navy: "#0a1222",
  navy2: "#13213d",
  green: "#15803d",
  greenBg: "#dcfce7",
  amber: "#b45309",
  amberBg: "#fef3c7",
  red: "#dc2626",
  redBg: "#fee2e2",
  slateBg: "#eef2f7",
};

export const GRADIENT = `linear-gradient(135deg, ${C.primary} 0%, ${C.cyan} 100%)`;
export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

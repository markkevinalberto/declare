/**
 * Typed access to the native capability surface the Electron desktop shell
 * (../../../../electron/) injects via a preload script's contextBridge.
 * `window.declareDesktop` only exists there — every browser (and the
 * deployed website itself) leaves it undefined, so `isElectron()` is a
 * reliable runtime check for "am I running inside the desktop app."
 *
 * `DisplayInfo` intentionally matches display-preferences.tsx's
 * `ScreenDetailed` shape so the Electron-sourced display list is a drop-in
 * for the Window Management API-sourced one — no changes needed downstream
 * in ScreenPicker/screenLabel.
 */
export type DisplayInfo = {
  label: string;
  left: number;
  top: number;
  width: number;
  height: number;
  isPrimary: boolean;
};

type PresenterBounds = {
  left: number;
  top: number;
  width: number;
  height: number;
} | null;

declare global {
  interface Window {
    declareDesktop?: {
      isElectron: true;
      platform: string;
      getDisplays(): Promise<DisplayInfo[]>;
      openPresenterWindow(
        kind: "projector" | "stage",
        url: string,
        bounds: PresenterBounds
      ): Promise<void>;
    };
  }
}

export function isElectron(): boolean {
  return typeof window !== "undefined" && window.declareDesktop?.isElectron === true;
}

export function getDesktopBridge() {
  return typeof window !== "undefined" ? window.declareDesktop : undefined;
}

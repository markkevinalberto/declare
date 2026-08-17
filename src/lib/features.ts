/**
 * Soft feature toggles — flip a flag back to `true` to bring a feature back.
 * Nothing downstream of these (routes, components, database schema) is
 * deleted when a flag is off; only nav entries, page tabs, and marketing
 * copy stop pointing at it. The routes themselves stay reachable directly
 * (e.g. /present/[serviceId], /plan/[shareToken]) — this only removes
 * discoverability, not the underlying feature.
 */
export const FEATURES = {
  /** Service plan builder (songs/scripture/segments flow) and its public share link. */
  planning: false,
  /** Live presenter console (projector/stage output) and the desktop app, which exists solely to run it. */
  presenter: false,
} as const;

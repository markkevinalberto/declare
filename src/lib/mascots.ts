// Chibi media-team stickers in /public/mascot, matched to roles by keyword.
// Each rule lists stickers in order of fit, so a second matching role gets the next one.
const RULES: Array<[RegExp, string[]]> = [
  [/camera|photo|videograph/, ["camera", "mm_camera3"]],
  [/video|record|film/, ["mm_camera3", "camera"]],
  [/sound|audio|mix|foh/, ["mm_mixer", "mm_headset2"]],
  [/stream|switch|live|vmix|obs|broadcast/, ["mm_laptop2", "laptop"]],
  [/slide|lyric|present|projection|screen|graphic/, ["laptop", "mm_laptop2", "mm_girl_tablet"]],
  [/light|stage|cable|setup|rig|crew/, ["mm_cables2", "clipboard"]],
  [/direct|produc|tech|media|operat/, ["mm_headset2", "mm_mixer", "clipboard"]],
  [/worship|prayer|devotion|intercess|pastor|preach/, ["prayer", "mm_girl_peace"]],
  [/host|\bmc\b|emcee|announce|welcome|greet|usher/, ["waving", "mm_thumbsup"]],
  [/vocal|sing|choir|band|music|guitar|drum|keys|bass|piano/, ["mm_girl_peace", "mm_duo_smile"]],
  [/social|content|story|design|creativ|writ/, ["mm_girl_tablet", "idea"]],
  [/coordinat|manag|lead|admin|schedul|plan/, ["clipboard", "checkmark"]],
  [/check|attend|registr|count/, ["checkmark", "clipboard"]],
  [/hospitality|care|kid|child|nursery|connect/, ["heart", "mm_duo_smile"]],
];

// Generic poses suit any role; gear poses (cameras, mixers…) are a last resort for unmatched roles.
const GENERIC = [
  "mm_thumbsup", "cheer", "idea", "mm_duo_smile", "checkmark",
  "heart", "mm_girl_tablet", "waving", "mm_girl_peace",
];
const GEAR = [
  "mm_headset2", "clipboard", "laptop", "mm_laptop2", "mm_cables2",
  "prayer", "mm_mixer", "camera", "mm_camera3",
];

const toSrc = (key: string) => `/mascot/${key}.png`;
const toKey = (src: string) => src.replace(/^\/mascot\/|\.png$/g, "");

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function candidates(names: string[]): string[] {
  return names.flatMap((name) => {
    const n = name.toLowerCase();
    return RULES.find(([re]) => re.test(n))?.[1] ?? [];
  });
}

/** Best keyword match for the first name that has one; otherwise a stable generic pick. */
export function mascotFor(...names: string[]): string {
  return toSrc(candidates(names)[0] ?? GENERIC[hash(names[0] ?? "") % GENERIC.length]);
}

/**
 * One sticker per item with no repeats (until all 18 are used), preferring keyword
 * matches. `taken` stickers (e.g. one already on screen nearby) are avoided too.
 */
export function distinctMascots(items: string[][], taken: string[] = []): string[] {
  const used = new Set(taken.map(toKey));
  return items.map((names) => {
    const start = hash(names[0] ?? "") % GENERIC.length;
    const rotated = [...GENERIC.slice(start), ...GENERIC.slice(0, start), ...GEAR];
    const pick =
      [...candidates(names), ...rotated].find((k) => !used.has(k)) ??
      candidates(names)[0] ??
      rotated[0];
    used.add(pick);
    return toSrc(pick);
  });
}

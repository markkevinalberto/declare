// Chibi media-team stickers in /public/mascot, matched to roles by keyword.
// Each rule lists stickers in order of fit, so a second matching role gets the next one.
// Tripod rigs first, then the handheld camcorder and gimbal
const VIDEO_CAMS = ["crew_tripod", "team_tripod", "mm_camera3", "crew_camcorder", "crew_gimbal"];

const RULES: Array<[RegExp, string[]]> = [
  // Specific roles first: photo → DSLR; camera channels → video cameras only
  [/photo/, ["camera"]],
  [/hollyland|gimbal|steadicam|\bch\s*5\b/, ["crew_gimbal", "crew_camcorder"]],
  [/roving|follow|handheld|\bch\s*2\b/, ["crew_camcorder", "crew_gimbal"]],
  [/camera|\bcam\b|\bcam\s*\d|\bch\s*\d|videograph|bleacher|tripod|video|record|film/, VIDEO_CAMS],
  [/main ops|\bpc\b|computer/, ["team_editing", "crew_live", "laptop"]],
  [/media director|intercom|talkback/, ["team_headset_mic", "crew_walkie", "crew_headset_tablet"]],
  [/technical director|\btd\b|console|switcher/, ["crew_live", "crew_audio", "crew_director"]],
  [/drone|aerial/, ["team_drone"]],
  [/edit|post[- ]?prod/, ["team_editing", "crew_live"]],
  [/sound|audio|mix|foh/, ["crew_audio", "mm_mixer"]],
  [/stream|switch|live|vmix|obs|broadcast|gpx|graphic/, ["crew_live", "mm_laptop2", "team_laptop_chart", "laptop"]],
  [/slide|lyric|present|projection|screen/, ["laptop", "team_laptop_chart", "mm_laptop2"]],
  [/light|stage|cable|setup|rig|crew/, ["mm_cables2", "crew_walkie", "clipboard"]],
  [
    /direct|produc|tech|media|operat|\bops\b/,
    ["crew_director", "crew_headset_tablet", "team_headset_mic", "mm_headset2", "crew_walkie", "clipboard"],
  ],
  [/floor|walkie|radio|comms|coordinat/, ["crew_walkie", "clipboard"]],
  [/worship|prayer|devotion|intercess|pastor|preach/, ["prayer", "mm_girl_peace"]],
  [/host|\bmc\b|emcee|announce|welcome|greet|usher/, ["waving", "mm_thumbsup"]],
  [/vocal|sing|choir|band|music|guitar|drum|keys|bass|piano/, ["mm_girl_peace", "mm_duo_smile"]],
  [/social|content|story|design|creativ|writ/, ["mm_girl_tablet", "team_laptop_chart", "idea"]],
  [/manag|lead|admin|schedul|plan/, ["clipboard", "checkmark"]],
  [/check|attend|registr|count/, ["checkmark", "clipboard"]],
  [/hospitality|care|kid|child|nursery|connect/, ["heart", "mm_duo_smile"]],
];

// Generic poses suit any role; gear poses (cameras, mixers…) are a last resort for unmatched roles.
const GENERIC = [
  "mm_thumbsup", "cheer", "idea", "mm_duo_smile", "checkmark",
  "heart", "mm_girl_tablet", "waving", "mm_girl_peace",
];
const GEAR = [
  "mm_headset2", "crew_headset_tablet", "team_headset_mic", "crew_walkie", "clipboard",
  "team_laptop_chart", "laptop", "mm_laptop2", "crew_live", "team_editing", "mm_cables2",
  "prayer", "crew_audio", "mm_mixer", "crew_director", "crew_tripod", "team_tripod",
  "crew_gimbal", "crew_camcorder", "camera", "mm_camera3", "team_drone",
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

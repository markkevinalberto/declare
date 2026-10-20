// Chibi media-team stickers in /public/mascot, matched to roles by keyword.
const RULES: Array<[RegExp, string]> = [
  [/camera|photo|videograph/, "camera"],
  [/video|record|film/, "mm_camera3"],
  [/sound|audio|mix|foh/, "mm_mixer"],
  [/stream|switch|live|vmix|obs|broadcast/, "mm_laptop2"],
  [/slide|lyric|present|projection|screen|graphic/, "laptop"],
  [/light|stage|cable|setup|rig|crew/, "mm_cables2"],
  [/direct|produc|tech|media|operat/, "mm_headset2"],
  [/worship|prayer|devotion|intercess|pastor|preach/, "prayer"],
  [/host|\bmc\b|emcee|announce|welcome|greet|usher/, "waving"],
  [/vocal|sing|choir|band|music|guitar|drum|keys|bass|piano/, "mm_girl_peace"],
  [/social|content|story|design|creativ|writ/, "mm_girl_tablet"],
  [/coordinat|manag|lead|admin|schedul|plan/, "clipboard"],
  [/check|attend|registr|count/, "checkmark"],
  [/hospitality|care|kid|child|nursery|connect/, "heart"],
];

// Unmatched roles still get a sticker, spread across the set so neighbours differ.
const FALLBACK = [
  "mm_thumbsup",
  "cheer",
  "idea",
  "mm_duo_smile",
  "checkmark",
  "heart",
  "mm_girl_tablet",
  "mm_headset2",
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** First name that matches a keyword wins; otherwise a stable pick from the fallback set. */
export function mascotFor(...names: string[]): string {
  for (const name of names) {
    const n = name.toLowerCase();
    const hit = RULES.find(([re]) => re.test(n));
    if (hit) return `/mascot/${hit[1]}.png`;
  }
  return `/mascot/${FALLBACK[hash(names[0] ?? "") % FALLBACK.length]}.png`;
}

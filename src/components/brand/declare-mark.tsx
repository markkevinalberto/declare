/**
 * The Declare brand mark — a "D" rendered as a speech bubble with a play/arrow
 * cutout. `fill="currentColor"` so it inherits whatever text color the badge
 * around it sets (matches how the lucide icon it replaced worked).
 */
export function DeclareMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="20 20 265 300"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="
          M 40,40 H 125 C 215,40 265,100 265,150 C 265,200 215,260 125,260 H 85 L 40,300 Z
          M 120,95 L 210,150 L 120,205 Z"
      />
    </svg>
  );
}

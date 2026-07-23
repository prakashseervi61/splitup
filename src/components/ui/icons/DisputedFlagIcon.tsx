type IconProps = { size?: number; color?: string; className?: string };

export default function DisputedFlagIcon({ size = 24, color = "currentColor", className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <g>
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
        <circle cx="14" cy="10" r="0.5" fill={color} stroke="none" opacity="0.8" />
      </g>
    </svg>
  );
}

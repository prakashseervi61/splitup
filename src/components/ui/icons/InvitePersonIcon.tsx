type IconProps = { size?: number; color?: string; className?: string };

export default function InvitePersonIcon({ size = 24, color = "currentColor", className = "" }: IconProps) {
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
        <circle cx="10" cy="8" r="3.5" />
        <path d="M3 21v-2a4 4 0 014-4h6a4 4 0 014 4v2" />
        <line x1="19" y1="8" x2="19" y2="14" />
        <line x1="16" y1="11" x2="22" y2="11" />
      </g>
    </svg>
  );
}

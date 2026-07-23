type IconProps = { size?: number; color?: string; className?: string };

export default function GroupPeopleIcon({ size = 24, color = "currentColor", className = "" }: IconProps) {
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
        <circle cx="9" cy="7" r="3" />
        <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
        <circle cx="17" cy="8" r="2.5" />
        <path d="M21 21v-1.5a3 3 0 00-2-2.83" />
      </g>
    </svg>
  );
}

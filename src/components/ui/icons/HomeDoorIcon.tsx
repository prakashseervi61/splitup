type IconProps = { size?: number; color?: string; className?: string };

export default function HomeDoorIcon({ size = 24, color = "currentColor", className = "" }: IconProps) {
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
        <path d="M3 12l9-9 9 9" />
        <path d="M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" />
        <circle cx="14" cy="15" r="0.5" fill={color} stroke="none" />
      </g>
    </svg>
  );
}

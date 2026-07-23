type IconProps = { size?: number; color?: string; className?: string };

export default function PendingClockIcon({ size = 24, color = "currentColor", className = "" }: IconProps) {
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
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
        <circle cx="12" cy="2" r="1.5" fill={color} stroke="none" />
      </g>
    </svg>
  );
}

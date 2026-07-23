type IconProps = { size?: number; color?: string; className?: string };

export default function RecurringIcon({ size = 24, color = "currentColor", className = "" }: IconProps) {
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
        <path d="M21 12a9 9 0 01-15.36 6.36" />
        <polyline points="21 6 21 12 15 12" />
        <path d="M3 12a9 9 0 0115.36-6.36" />
        <polyline points="3 18 3 12 9 12" />
      </g>
    </svg>
  );
}

type IconProps = { size?: number; color?: string; className?: string };

export default function SplitArrowIcon({ size = 24, color = "currentColor", className = "" }: IconProps) {
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
        <line x1="12" y1="5" x2="12" y2="16" />
        <polyline points="8 12 12 16 16 12" />
        <line x1="12" y1="16" x2="6" y2="21" />
        <line x1="12" y1="16" x2="18" y2="21" />
        <polyline points="3 20 6 21 6 18" />
        <polyline points="21 20 18 21 18 18" />
      </g>
    </svg>
  );
}

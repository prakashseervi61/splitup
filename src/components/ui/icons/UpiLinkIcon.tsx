type IconProps = { size?: number; color?: string; className?: string };

export default function UpiLinkIcon({ size = 24, color = "currentColor", className = "" }: IconProps) {
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
        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
        <path d="M19 7l1 1" strokeWidth="1.5" opacity="0.5" />
        <path d="M21 5l1 1" strokeWidth="1.5" opacity="0.5" />
      </g>
    </svg>
  );
}

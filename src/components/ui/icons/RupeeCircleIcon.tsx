type IconProps = { size?: number; color?: string; className?: string };

export default function RupeeCircleIcon({ size = 24, color = "currentColor", className = "" }: IconProps) {
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
      <circle cx="12" cy="12" r="10" />
      <path d="M8 8h8" />
      <path d="M8 12h6" />
      <path d="M10 12c0-2 1-3 2-3s2 1 2 3-1 3-2 3-2 1-2 3" />
    </svg>
  );
}

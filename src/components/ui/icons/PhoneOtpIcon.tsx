type IconProps = { size?: number; color?: string; className?: string };

export default function PhoneOtpIcon({ size = 24, color = "currentColor", className = "" }: IconProps) {
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
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <line x1="10" y1="18" x2="14" y2="18" />
        <circle cx="8" cy="8" r="0.8" fill={color} stroke="none" />
        <circle cx="12" cy="8" r="0.8" fill={color} stroke="none" />
        <circle cx="16" cy="8" r="0.8" fill={color} stroke="none" />
      </g>
    </svg>
  );
}

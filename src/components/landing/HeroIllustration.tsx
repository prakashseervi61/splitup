export default function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 400 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
      aria-hidden="true"
    >
      {/* Warm decorative circles — background atmosphere */}
      <circle cx="100" cy="260" r="80" fill="var(--color-primary-subtle)" opacity="0.5" />
      <circle cx="320" cy="60" r="60" fill="var(--color-primary-subtle)" opacity="0.4" />

      {/* Left person */}
      <g>
        {/* Head */}
        <circle cx="100" cy="100" r="22" fill="var(--color-primary)" opacity="0.8" />
        {/* Body */}
        <rect x="86" y="128" width="28" height="50" rx="10" fill="var(--color-primary)" opacity="0.6" />
        {/* Arm holding phone — extended toward center */}
        <path
          d="M114 142 Q140 135 160 145"
          stroke="var(--color-primary)"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
          opacity="0.5"
        />
      </g>

      {/* Right person */}
      <g>
        {/* Head */}
        <circle cx="300" cy="100" r="22" fill="var(--color-text-heading)" opacity="0.7" />
        {/* Body */}
        <rect x="286" y="128" width="28" height="50" rx="10" fill="var(--color-text-heading)" opacity="0.5" />
      </g>

      {/* Center phone / card */}
      <g>
        <rect
          x="155"
          y="110"
          width="90"
          height="120"
          rx="14"
          fill="var(--color-surface)"
          stroke="var(--color-border)"
          strokeWidth="1.5"
          filter="url(#shadow)"
        />
        {/* Phone top bar */}
        <rect x="180" y="118" width="40" height="4" rx="2" fill="var(--color-border)" />
        {/* Amount on screen */}
        <text
          x="200"
          y="155"
          textAnchor="middle"
          fill="var(--color-text-heading)"
          fontSize="22"
          fontFamily="var(--font-outfit)"
          fontWeight="700"
        >
          ₹500
        </text>
        {/* Divider */}
        <line x1="175" y1="168" x2="225" y2="168" stroke="var(--color-border)" strokeWidth="1" />
        {/* Settle button on screen */}
        <rect x="170" y="180" width="60" height="24" rx="6" fill="var(--color-primary)" />
        <text
          x="200"
          y="196"
          textAnchor="middle"
          fill="white"
          fontSize="11"
          fontFamily="var(--font-sans)"
          fontWeight="600"
        >
          Settle
        </text>
        {/* Phone bottom bar */}
        <rect x="185" y="220" width="30" height="3" rx="1.5" fill="var(--color-border)" />
      </g>

      {/* Arrow from left person through phone to right */}
      <path
        d="M130 145 Q170 80 240 100"
        stroke="var(--color-primary)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        strokeDasharray="6 4"
      />
      {/* Arrowhead */}
      <path
        d="M235 88 L244 100 L232 104"
        stroke="var(--color-primary)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* UPI badge on arrow */}
      <rect x="156" y="70" width="50" height="18" rx="4" fill="var(--color-primary)" />
      <text
        x="181"
        y="83"
        textAnchor="middle"
        fill="white"
        fontSize="9"
        fontFamily="var(--font-sans)"
        fontWeight="600"
      >
        UPI
      </text>

      {/* Rupee coin falling into right person's pocket */}
      <g>
        <circle cx="310" cy="190" r="8" fill="var(--color-success)" opacity="0.8" />
        <text
          x="310"
          y="194"
          textAnchor="middle"
          fill="white"
          fontSize="10"
          fontFamily="var(--font-sans)"
          fontWeight="700"
        >
          ₹
        </text>
      </g>

      {/* Shadow filter */}
      <defs>
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="var(--color-text-heading)" floodOpacity="0.08" />
        </filter>
      </defs>
    </svg>
  );
}

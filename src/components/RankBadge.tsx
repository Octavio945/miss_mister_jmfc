// Médaille de rang dessinée (remplace les emojis 🥇🥈🥉).
// 1 = or, 2 = argent, 3 = bronze, au-delà = pastille neutre.

const TIERS = {
  1: { from: "#F7E199", to: "#B8892B", ribbon: "#8A6A1F", text: "#4A3608", label: "1er" },
  2: { from: "#F1F3F6", to: "#9AA3AF", ribbon: "#6B7280", text: "#1F2937", label: "2e" },
  3: { from: "#F2C29B", to: "#A0582C", ribbon: "#7A4220", text: "#3B1D0B", label: "3e" },
} as const;

interface RankBadgeProps {
  rank: number;
  size?: number;
  className?: string;
}

export default function RankBadge({ rank, size = 44, className = "" }: RankBadgeProps) {
  const tier = TIERS[rank as keyof typeof TIERS];

  if (!tier) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-full bg-black/70 text-white font-bold shadow-md ${className}`}
        style={{ width: size * 0.82, height: size * 0.82, fontSize: size * 0.32 }}
        aria-label={`Rang ${rank}`}
      >
        #{rank}
      </span>
    );
  }

  const id = `rank-${rank}`;
  return (
    <svg
      width={size}
      height={size * 1.2}
      viewBox="0 0 40 48"
      className={`drop-shadow-md ${className}`}
      role="img"
      aria-label={`${tier.label} place`}
    >
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={tier.from} />
          <stop offset="100%" stopColor={tier.to} />
        </linearGradient>
      </defs>
      {/* Rubans */}
      <path d="M11 30 L6 46 L13 42 L17 47 L20 33 Z" fill={tier.ribbon} />
      <path d="M29 30 L34 46 L27 42 L23 47 L20 33 Z" fill={tier.ribbon} />
      {/* Médaille */}
      <circle cx="20" cy="19" r="17" fill={`url(#${id}-fill)`} />
      <circle cx="20" cy="19" r="13" fill="none" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="1.2" />
      <text
        x="20"
        y="24.5"
        textAnchor="middle"
        fontSize="15"
        fontWeight="800"
        fontFamily="var(--font-playfair), Georgia, serif"
        fill={tier.text}
      >
        {rank}
      </text>
    </svg>
  );
}

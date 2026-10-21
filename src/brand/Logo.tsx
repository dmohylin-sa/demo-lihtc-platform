// Everstead mark as used on the RFP cover: three stacked slanted bars beside a lowercase wordmark.
export function EversteadMark({ size = 22, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <svg width={size * 1.15} height={size} viewBox="0 0 30 26" aria-hidden="true">
      <g fill={color}>
        <polygon points="7,0 30,0 26,6 3,6" />
        <polygon points="5.5,10 28.5,10 24.5,16 1.5,16" />
        <polygon points="4,20 27,20 23,26 0,26" />
      </g>
    </svg>
  );
}

export default function Logo({ color = '#FFFFFF', size = 22, divider = true }: { color?: string; size?: number; divider?: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <EversteadMark size={size} color={color} />
      <span style={{ fontFamily: 'var(--font-head)', fontWeight: 600, fontSize: size * 1.12, color, letterSpacing: '-0.02em', lineHeight: 1 }}>
        everstead
      </span>
      {divider ? <span style={{ width: 1, height: size * 1.3, background: color, opacity: 0.35, marginLeft: 4 }} /> : null}
    </span>
  );
}

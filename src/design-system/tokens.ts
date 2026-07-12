/**
 * ═══════════════════════════════════════════════════════════
 * ZEVIAN DESIGN TOKENS
 * Single source of truth for all visual decisions.
 *
 * Usage in inline: style={{ background: colors.surface }}
 * Usage in CSS vars: var(--color-accent)
 *
 * This file mirrors zevian-ds/src/design/tokens.ts
 * ═══════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────
// COLORS
// ─────────────────────────────────────────────
export const colors = {
  bg: '#0a0c10',
  surface: '#111318',
  surface2: '#181c24',
  surface3: '#1e2330',

  border: 'rgba(255,255,255,0.07)',
  borderStrong: 'rgba(255,255,255,0.10)',   // grounded card border — more visible than default, sits below hover
  borderHover: 'rgba(255,255,255,0.13)',
  borderDashed: 'rgba(255,255,255,0.10)',

  text: '#f0f2f7',
  text2: '#8b93a8',
  // Muted / placeholder / timestamps. Lifted from #545d73 (≈2.4–2.8:1 on the card surfaces —
  // below WCAG) to #7c8499, which clears 4:1 on surface / surface-2 / surface-3 (≈4.2–5.0:1) so
  // subtext is legible without collapsing the tier below text2. Mirrored in globals.css.
  text3: '#7c8499',

  // ── Interactive chrome (greyscale) ───────────────────────────────────────
  // Formerly the blue brand accent; repointed to greyscale so navigation, tabs, links and buttons
  // stop competing with score data. Only score colors (green/warn/danger) and the AI blue/teal carry
  // meaning now. `accent` == text-primary so a link/active-tab reads as high-contrast white; pills
  // built from accentGlow+accent become quiet white-on-tint chips. Interactivity is signalled by
  // weight / underline-on-hover / border, never by hue (see the button + tab + nav treatments).
  accent: '#f0f2f7',                       // = text (chrome interactive foreground)
  accentHover: '#ffffff',
  accentGlow: 'rgba(255,255,255,0.06)',    // subtle raised tint for active-nav / soft chips
  accentBorder: 'rgba(255,255,255,0.13)',  // = borderHover

  // ── Brand (blue) ─────────────────────────────────────────────────────────
  // The one deliberate blue left in the product: the Zevian logo mark. Reads as identity, not as an
  // interactive affordance, so it never appears on a button, tab, or link.
  brand: '#5b7fff',
  brandBorder: 'rgba(91,127,255,0.28)',

  // ── AI accent (low-opacity blue) ─────────────────────────────────────────
  // AI / Ask surfaces keep blue, used low-opacity as their primary tint so "this is generated"
  // stays visually distinct from greyscale chrome. Teal remains the AI secondary.
  ai: '#5b7fff',
  aiHover: '#7090ff',
  aiGlow: 'rgba(91,127,255,0.14)',
  aiBorder: 'rgba(91,127,255,0.26)',

  teal: '#00d4aa',
  tealGlow: 'rgba(0,212,170,0.12)',

  green: '#10b981',
  greenGlow: 'rgba(16,185,129,0.12)',

  warn: '#f59e0b',
  warnGlow: 'rgba(245,158,11,0.12)',
  // Below-target amber for numbers / data — desaturated to the SAME saturation+lightness as
  // dangerMuted (hsl ~53% / 62%), just at the amber hue, so a muted-amber value sits beside a
  // muted-red value without one looking louder. Reserve the saturated `warn` for structural alerts
  // (dots, strips, borders).
  warnMuted: '#d1ac6b',
  warnMutedGlow: 'rgba(209,172,107,0.14)',

  // Saturated red — RESERVED for genuine at-risk *states*: the "N at risk" pill, at-risk status
  // dot, Needs Attention flag, and the "not addressed / score 0" skill flag. Never used for a
  // score number or a routine bar (those use dangerMuted) so that when this red appears it means
  // something rather than reading as a broken product.
  danger: '#f04438',
  dangerGlow: 'rgba(240,68,56,0.15)',
  // Below-target red — desaturated terracotta for score numbers / bars in the <5.0 band. Present
  // and legible (≈4.6:1 on card surfaces) but calm, so a screen of low scores informs instead of
  // alarms. Pairs with getScoreColor()'s reworked bands.
  dangerMuted: '#d1746b',
  dangerMutedGlow: 'rgba(209,116,107,0.14)',

  purple: '#8b5cf6',
  purpleGlow: 'rgba(139,92,246,0.12)',
} as const

// ─────────────────────────────────────────────
// TYPOGRAPHY
// ─────────────────────────────────────────────
export const typography = {
  fonts: {
    display: 'var(--font-display)',
    body: 'var(--font-body)',
    mono: 'var(--font-mono)',
    numeric: 'var(--font-numeric)',
  },
  googleFontsUrl:
    'https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Outfit:wght@100..900&display=swap',
  size: {
    xs: '10px',
    sm: '11px',
    base: '13px',
    lg: '14px',
    xl: '16px',
    '2xl': '18px',
    '3xl': '22px',
  },
  weight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 800,
    heavy: 700,
  },
  score: {
    sm: '16px',
    md: '22px',
    lg: '28px',
    xl: '36px',
    '2xl': '42px',
  },
  label: {
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.07em',
    textTransform: 'uppercase' as const,
    color: colors.text3,
  },
} as const

// ─────────────────────────────────────────────
// SPACING & LAYOUT
// ─────────────────────────────────────────────
export const layout = {
  sidebarWidth: '220px',
  headerHeight: '56px',
  contentPadding: '24px',
  contentPaddingMobile: '16px',
  modalSheetWidth: '580px',
  modalSheetWidthSm: '520px',
  maxContentWidth: '1280px',
} as const

// ─────────────────────────────────────────────
// BORDER RADIUS
// ─────────────────────────────────────────────
export const radius = {
  sm: '6px',
  md: '10px',
  lg: '16px',
  full: '9999px',
} as const

// ─────────────────────────────────────────────
// SHADOWS / GLOWS
// ─────────────────────────────────────────────
export const shadows = {
  // Chrome glows neutralized — greyscale chrome carries no colored halo. Kept as tokens (rather than
  // deleted) so the many call sites don't break; they now resolve to no glow / a neutral focus tint.
  accentGlow: 'none',
  accentGlowLg: 'none',
  logoGlow: 'none',
  greenGlow: '0 0 5px rgba(16,185,129,1)',
  cardHover: '0 8px 24px rgba(0,0,0,0.3)',
  inputFocus: '0 0 0 3px rgba(255,255,255,0.08)',
} as const

// ─────────────────────────────────────────────
// ANIMATION
// ─────────────────────────────────────────────
export const animation = {
  fast: '0.15s',
  base: '0.20s',
  slow: '0.30s',
  slower: '0.40s',
  ease: 'ease',
  easeOut: 'cubic-bezier(0.22, 0.68, 0, 1.2)',
  easeSmooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  keyframes: {
    fadeUp: 'fadeUp 0.3s ease both',
    slideIn: 'slideIn 0.28s cubic-bezier(0.22,0.68,0,1.2) both',
    pulseRing: 'pulse-ring 2.4s ease-in-out infinite',
    shimmer: 'shimmer 1.2s infinite',
    spin: 'spin 0.8s linear infinite',
  },
} as const

// ─────────────────────────────────────────────
// Z-INDEX SCALE
// ─────────────────────────────────────────────
export const zIndex = {
  base: 0,
  content: 1,
  sidebar: 100,
  header: 90,
  modal: 200,
  toast: 999,
} as const

// ─────────────────────────────────────────────
// BADGE TONES (count / status number badges)
// ─────────────────────────────────────────────
// Soft-badge pairs for the dark UI: a LOW-OPACITY tint of the color as the fill + the muted same-hue
// color for the number. The tint stays quiet against the dark surface while the text keeps ≥4:1
// against it. Amber uses the muted amber so it matches the muted red's saturation. Rendered as a
// rounded square (radius.sm) — the canonical number badge, mirrored from the Chip atom.
export const badgeTones = {
  neutral: { bg: 'rgba(255,255,255,0.07)', text: '#8b93a8' }, // text2
  // Chrome badge tone — greyscale (formerly blue). Slightly brighter fill + near-white text so it
  // reads a step above `neutral` without reintroducing a hue.
  accent:  { bg: 'rgba(255,255,255,0.10)', text: '#f0f2f7' },
  // AI badge tone — low-opacity blue, for generated / AI-scored chips only.
  ai:      { bg: 'rgba(91,127,255,0.16)',  text: '#7a97ff' },
  teal:    { bg: 'rgba(0,212,170,0.16)',   text: '#00d4aa' },
  danger:  { bg: 'rgba(209,116,107,0.16)', text: '#d1746b' }, // dangerMuted
  warn:    { bg: 'rgba(209,172,107,0.16)', text: '#d1ac6b' }, // warnMuted — matches the red saturation
} as const

// ─────────────────────────────────────────────
// SCORE HELPER
// ─────────────────────────────────────────────
/**
 * Score → color, banded to the AI scoring rubric (see /api/ai/score-report), NOT to arbitrary
 * taste. The engine applies the same fixed rubric to every org, so the numbers have an absolute,
 * org-independent meaning we can color against:
 *   • ≥ 7.0  on-track  → green. 7.0 is the rubric's "has measurable outcomes" line — the point at
 *                        which the engine itself stops generating a coaching note.
 *   • 5.0–7.0 mid      → neutral text. The rubric calls this "plausible but thin evidence." It is
 *                        not a warning; most real reports land here, so it reads calm, not amber.
 *   • < 5.0  below-tgt → dangerMuted. Genuinely unsupported/evidence-free work. Muted, not
 *                        saturated — saturated red is reserved for discrete at-risk states (pills).
 */
export function getScoreColor(score: number | null | undefined): string {
  if (score == null) return colors.text3
  if (score >= 7.0) return colors.green
  if (score >= 5.0) return colors.text
  return colors.dangerMuted
}

/**
 * Bar-fill color. Same bands as getScoreColor, but the neutral middle uses a grey (not near-white)
 * so a mid-band bar reads as quiet progress rather than a full/loud track, and the low band uses
 * the muted red. Solid enough to read; never the saturated alarm red.
 */
export function getScoreBarColor(score: number | null | undefined): string {
  if (score == null) return colors.surface3
  if (score >= 7.0) return colors.green
  if (score >= 5.0) return colors.text2
  return colors.dangerMuted
}

/**
 * Low-opacity tint variant for bars that sit *under* a colored number — even quieter than
 * getScoreBarColor. Color hierarchy is reserved for status pills and the Needs Attention section;
 * these tints read as context, not competing alarms.
 */
export function getScoreBarFill(score: number | null | undefined): string {
  if (score == null) return colors.surface3
  if (score >= 7.0) return 'rgba(16,185,129,0.40)'    // green tint
  if (score >= 5.0) return 'rgba(139,147,168,0.28)'   // neutral grey tint
  return 'rgba(209,116,107,0.38)'                      // muted red tint
}

export function getScoreStatus(score: number | null | undefined): 'on-track' | 'review' | 'at-risk' | 'no-data' {
  if (score == null) return 'no-data'
  if (score >= 7.0) return 'on-track'
  if (score >= 5.0) return 'review'
  return 'at-risk'
}

// ─────────────────────────────────────────────
// AVATAR GRADIENT HELPER
// ─────────────────────────────────────────────
const GRADIENTS = [
  'linear-gradient(135deg, #5b7fff, #818cf8)',
  'linear-gradient(135deg, #00d4aa, #0ea5e9)',
  'linear-gradient(135deg, #f59e0b, #fb923c)',
  'linear-gradient(135deg, #8b5cf6, #ec4899)',
  'linear-gradient(135deg, #f04438, #f97316)',
  'linear-gradient(135deg, #10b981, #0ea5e9)',
]

/**
 * Curated avatar palette — 10 distinct hues spread evenly around the wheel at a shared saturation /
 * lightness so they read as one family, tuned to sit on the dark UI and carry white initials. A
 * fixed palette (not a continuous hash→hue) GUARANTEES people get visibly different colors instead
 * of occasionally landing on near-identical hues. Semantic score hues (green/amber/danger/accent)
 * are deliberately avoided-ish so an avatar never reads as a status.
 */
const AVATAR_PALETTE = [
  '#e05a7d', // rose
  '#e2694a', // coral
  '#c98a3e', // ochre
  '#3fa96b', // green
  '#1ba398', // teal
  '#2b8fb8', // cyan
  '#4a7fe0', // blue
  '#6d5fe0', // indigo
  '#9c56d4', // violet
  '#cf5bb0', // pink
] as const

/**
 * Deterministic name → avatar color pair. Solid fill from the curated palette + white initials, for
 * maximum at-a-glance distinguishability in rosters and report lists. { bg, fg } shape is kept so the
 * Avatar atom and its call sites don't change.
 */
export function getAvatarTones(name: string): { bg: string; fg: string } {
  let h = 5381
  for (let i = 0; i < name.length; i++) h = ((h << 5) + h) ^ name.charCodeAt(i)
  return {
    bg: AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length],
    fg: '#ffffff',
  }
}

// Back-compat for call sites that set an avatar background directly: returns the solid palette fill
// (see getAvatarTones) so overrides stay in sync with the Avatar atom.
export function getAvatarGradient(name: string): string {
  return getAvatarTones(name).bg
}

// ─────────────────────────────────────────────
// AI / ASK GRADIENT
// Ambient accent → teal gradient that signals the conversational/AI surfaces (Ask bar and
// its suggestion chips). `strong` for the primary input border, `subtle` for secondary
// affordances so they relate to the bar without competing with it.
// ─────────────────────────────────────────────
// Low-opacity blue-forward (teal as the secondary): AI surfaces read as a soft blue wash — distinct
// from greyscale chrome without the old saturated brand-blue border.
export const aiGradient = {
  strong: 'linear-gradient(120deg, rgba(91,127,255,0.30), rgba(0,212,170,0.20))',
  subtle: 'linear-gradient(120deg, rgba(91,127,255,0.18), rgba(0,212,170,0.12))',
} as const

// Build the two-layer background that paints a gradient *border* on a single element:
// surface fill clipped to the padding box, gradient clipped to the border box. Pair with
// `border: '1px solid transparent'` so the gradient shows evenly on all edges and corners.
export function gradientBorderBackground(gradient: string, fill: string): string {
  return `linear-gradient(${fill}, ${fill}) padding-box, ${gradient} border-box`
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

// ─────────────────────────────────────────────
// COMPONENT TOKENS
// ─────────────────────────────────────────────
// NOTE: componentTokens hold only *token values* (color, type, spacing, border,
// radius, fixed sizes, shadow, transition, cursor). Structural layout
// (display/position/flex/overflow/zIndex) lives in the consuming components, so
// a component can own its layout without fighting the token object.
export const componentTokens = {
  sidebar: {
    root: {
      width: layout.sidebarWidth, background: colors.surface,
      borderRight: `1px solid ${colors.border}`,
    },
    logo: {
      padding: '18px 20px 14px', gap: '10px',
      borderBottom: `1px solid ${colors.border}`,
    },
    logoMark: {
      width: '30px', height: '30px', background: colors.brand, borderRadius: radius.md,
      fontFamily: typography.fonts.display, fontWeight: typography.weight.extrabold,
      fontSize: '14px', color: '#fff', boxShadow: shadows.logoGlow,
    },
    logoText: {
      fontFamily: typography.fonts.display, fontWeight: typography.weight.bold,
      fontSize: '17px', letterSpacing: '-0.3px', color: colors.text,
    },
    nav: { padding: '12px 10px' },
    navLabel: {
      fontSize: '10px', fontWeight: typography.weight.semibold, color: colors.text3,
      letterSpacing: '0.08em', textTransform: 'uppercase' as const, padding: '8px 10px 4px',
    },
    navItem: {
      base: {
        gap: '10px', padding: '8px 10px',
        borderRadius: radius.md, cursor: 'pointer', color: colors.text2,
        fontSize: '13px', fontWeight: typography.weight.medium,
        transition: `all ${animation.fast}`,
      },
      hover: { background: colors.surface2, color: colors.text },
      // Active nav: high-contrast white text on a subtle raised tint + a hairline border. No hue —
      // the contrast jump + border carry "you are here".
      active: { background: colors.accentGlow, color: colors.text, border: `1px solid ${colors.accentBorder}` },
    },
    footer: { padding: '12px 10px', borderTop: `1px solid ${colors.border}` },
    // Primary CTA — "Raised neutral" (P3): dark raised surface + white label + hairline border.
    ctaButton: {
      gap: '8px',
      padding: '9px', background: colors.surface3, border: `1px solid ${colors.borderHover}`,
      borderRadius: radius.md, color: colors.text, fontSize: '13px',
      fontWeight: typography.weight.semibold, cursor: 'pointer',
      boxShadow: 'none', transition: `all ${animation.fast}`,
    },
  },
  header: {
    root: {
      background: 'rgba(10,12,16,0.90)',
      backdropFilter: 'blur(12px)', borderBottom: `1px solid ${colors.border}`,
      padding: '0 24px', gap: '10px',
    },
    title: {
      fontFamily: typography.fonts.display, fontSize: '16px',
      fontWeight: typography.weight.bold, letterSpacing: '-0.2px', color: colors.text,
    },
    iconButton: {
      width: '34px', height: '34px', background: colors.surface,
      border: `1px solid ${colors.border}`, borderRadius: radius.md,
      cursor: 'pointer', color: colors.text2,
    },
    avatar: {
      width: '34px', height: '34px',
      background: `linear-gradient(135deg, ${colors.brand}, ${colors.teal})`,
      borderRadius: radius.md, fontWeight: typography.weight.bold,
      fontSize: '12px', color: '#fff', cursor: 'pointer',
    },
  },
  avatar: {
    sizes: {
      sm: { width: '24px', height: '24px', fontSize: '8px', borderRadius: '6px' },
      md: { width: '30px', height: '30px', fontSize: '10px', borderRadius: '7px' },
      lg: { width: '32px', height: '32px', fontSize: '11px', borderRadius: '8px' },
      xl: { width: '40px', height: '40px', fontSize: '14px', borderRadius: '10px' },
      '2xl': { width: '52px', height: '52px', fontSize: '18px', borderRadius: '13px' },
    },
    gradients: GRADIENTS,
    stackOverlap: '-6px',
    stackBorder: `2px solid ${colors.surface}`,
  },
  modal: {
    overlay: {
      background: 'rgba(0,0,0,0.65)',
      backdropFilter: 'blur(4px)',
    },
    sheet: {
      width: layout.modalSheetWidth,
      background: colors.surface, borderLeft: `1px solid ${colors.border}`,
    },
    header: {
      padding: '20px 24px 16px', borderBottom: `1px solid ${colors.border}`,
      gap: '12px', background: colors.surface,
    },
    title: {
      fontFamily: typography.fonts.display, fontSize: '17px',
      fontWeight: typography.weight.extrabold, color: colors.text, letterSpacing: '-0.3px',
    },
    subtitle: { fontSize: '12px', color: colors.text3 },
    closeButton: {
      width: '30px', height: '30px', borderRadius: radius.md,
      background: colors.surface2, border: `1px solid ${colors.border}`,
      cursor: 'pointer', color: colors.text2, transition: `all ${animation.fast}`,
    },
    bodyNoPadding: {},
    footer: {
      padding: '16px 24px', borderTop: `1px solid ${colors.border}`,
      gap: '10px', background: colors.surface,
    },
  },
  button: {
    base: {
      gap: '7px',
      padding: '8px 16px', borderRadius: radius.md,
      fontSize: '13px', fontWeight: typography.weight.semibold,
      cursor: 'pointer', transition: `all ${animation.fast}`,
      fontFamily: typography.fonts.body, border: 'none',
    },
    sizes: {
      sm: { padding: '6px 12px', fontSize: '12px' },
      md: { padding: '8px 16px', fontSize: '13px' },
      lg: { padding: '10px 20px', fontSize: '14px' },
      icon: { width: '30px', height: '30px', padding: '0', borderRadius: radius.md },
    },
    variants: {
      // Primary "Raised neutral" (P3): dark raised surface + white label + hairline border.
      // Secondary "Ghost outline" (S2): transparent + defined border. Ghost: quietest, no rest border.
      primary: { background: colors.surface3, color: colors.text, border: `1px solid ${colors.borderHover}`, boxShadow: 'none' },
      secondary: { background: 'transparent', color: colors.text2, border: `1px solid ${colors.borderHover}` },
      ghost: { background: 'transparent', color: colors.text2 },
    },
  },
  card: {
    root: {
      background: colors.surface, border: `1px solid ${colors.borderStrong}`,
      borderRadius: radius.lg,
    },
    header: {
      padding: '16px 20px 14px', gap: '10px',
      borderBottom: `1px solid ${colors.borderStrong}`,
    },
    title: {
      fontWeight: typography.weight.semibold, fontSize: '14px', color: colors.text,
      gap: '8px',
    },
    action: {
      fontSize: '12px', color: colors.accent, fontWeight: typography.weight.medium,
      cursor: 'pointer', padding: '4px 8px', borderRadius: radius.sm,
      transition: `background ${animation.fast}`,
    },
    body: { padding: '20px' },
  },
} as const

// CSS Variables map
export const cssVariables = {
  '--color-bg': colors.bg,
  '--color-surface': colors.surface,
  '--color-surface-2': colors.surface2,
  '--color-surface-3': colors.surface3,
  '--color-border': colors.border,
  '--color-border-hover': colors.borderHover,
  '--color-text': colors.text,
  '--color-text-2': colors.text2,
  '--color-text-3': colors.text3,
  '--color-accent': colors.accent,
  '--color-accent-hover': colors.accentHover,
  '--color-accent-glow': colors.accentGlow,
  '--color-accent-border': colors.accentBorder,
  '--color-brand': colors.brand,
  '--color-brand-border': colors.brandBorder,
  '--color-ai': colors.ai,
  '--color-ai-hover': colors.aiHover,
  '--color-ai-glow': colors.aiGlow,
  '--color-ai-border': colors.aiBorder,
  '--color-teal': colors.teal,
  '--color-teal-glow': colors.tealGlow,
  '--color-green': colors.green,
  '--color-green-glow': colors.greenGlow,
  '--color-warn': colors.warn,
  '--color-warn-glow': colors.warnGlow,
  '--color-warn-muted': colors.warnMuted,
  '--color-warn-muted-glow': colors.warnMutedGlow,
  '--color-danger': colors.danger,
  '--color-danger-glow': colors.dangerGlow,
  '--color-danger-muted': colors.dangerMuted,
  '--color-danger-muted-glow': colors.dangerMutedGlow,
  '--color-purple': colors.purple,
  '--color-purple-glow': colors.purpleGlow,
  '--sidebar-width': layout.sidebarWidth,
  '--header-height': layout.headerHeight,

  // ── Semantic layer ──────────────────────────
  // Maps intent → primitive. Components should prefer these so a single
  // change here re-themes the product without touching every component.
  // Text
  '--color-text-primary': 'var(--color-text)',
  '--color-text-secondary': 'var(--color-text-2)',
  '--color-text-muted': 'var(--color-text-3)',
  // Surfaces (dark theme: higher number = lighter / more raised)
  '--color-surface-page': 'var(--color-bg)',
  '--color-surface-card': 'var(--color-surface)',
  '--color-surface-elevated': 'var(--color-surface-2)',
  '--color-surface-deep': 'var(--color-surface-3)',
  // Borders
  '--color-border-default': 'var(--color-border)',
  '--color-border-strong': 'var(--color-border-hover)',
  '--color-border-accent': 'var(--color-accent-border)',
  // Interactive
  '--color-interactive': 'var(--color-accent)',
  '--color-interactive-hover': 'var(--color-accent-hover)',
  // Semantic states
  '--color-success': 'var(--color-green)',
  '--color-warning': 'var(--color-warn)',
  '--color-error': 'var(--color-danger)',
} as const
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
  text3: '#545d73',

  accent: '#5b7fff',
  accentHover: '#7090ff',
  accentGlow: 'rgba(91,127,255,0.18)',
  accentBorder: 'rgba(91,127,255,0.28)',

  teal: '#00d4aa',
  tealGlow: 'rgba(0,212,170,0.12)',

  green: '#10b981',
  greenGlow: 'rgba(16,185,129,0.12)',

  warn: '#f59e0b',
  warnGlow: 'rgba(245,158,11,0.12)',

  danger: '#f04438',
  dangerGlow: 'rgba(240,68,56,0.15)',

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
    fontWeight: 700,
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
  accentGlow: '0 0 16px rgba(91,127,255,0.25)',
  accentGlowLg: '0 0 24px rgba(91,127,255,0.35)',
  logoGlow: '0 0 16px rgba(91,127,255,0.18)',
  greenGlow: '0 0 5px rgba(16,185,129,1)',
  cardHover: '0 8px 24px rgba(0,0,0,0.3)',
  inputFocus: '0 0 0 3px rgba(91,127,255,0.08)',
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
// SCORE HELPER
// ─────────────────────────────────────────────
export function getScoreColor(score: number | null | undefined): string {
  if (score == null) return colors.text3
  if (score >= 7.5) return colors.green
  if (score >= 6.0) return colors.warn
  return colors.danger
}

export function getScoreBarColor(score: number | null | undefined): string {
  return getScoreColor(score)
}

/**
 * Muted progress-bar fill. Returns a low-opacity tint of the status color so bars
 * read as quiet context rather than competing alarms — color hierarchy is reserved
 * for status pills, the Needs Attention section, and integrity flags. The numeric
 * score next to the bar keeps its full-saturation getScoreColor() value.
 */
export function getScoreBarFill(score: number | null | undefined): string {
  if (score == null) return colors.surface3
  if (score >= 7.5) return 'rgba(16,185,129,0.40)'   // green tint
  if (score >= 6.0) return 'rgba(245,158,11,0.40)'   // amber tint
  return 'rgba(240,68,56,0.40)'                        // danger tint
}

export function getScoreStatus(score: number | null | undefined): 'on-track' | 'review' | 'at-risk' | 'no-data' {
  if (score == null) return 'no-data'
  if (score >= 7.5) return 'on-track'
  if (score >= 6.0) return 'review'
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

export function getAvatarGradient(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length]
}

// ─────────────────────────────────────────────
// AI / ASK GRADIENT
// Ambient accent → teal gradient that signals the conversational/AI surfaces (Ask bar and
// its suggestion chips). `strong` for the primary input border, `subtle` for secondary
// affordances so they relate to the bar without competing with it.
// ─────────────────────────────────────────────
export const aiGradient = {
  strong: 'linear-gradient(120deg, rgba(91,127,255,0.55), rgba(0,212,170,0.45))',
  subtle: 'linear-gradient(120deg, rgba(91,127,255,0.32), rgba(0,212,170,0.26))',
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
      width: '30px', height: '30px', background: colors.accent, borderRadius: radius.md,
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
      active: { background: colors.accentGlow, color: colors.accent, border: `1px solid ${colors.accentBorder}` },
    },
    footer: { padding: '12px 10px', borderTop: `1px solid ${colors.border}` },
    ctaButton: {
      gap: '8px',
      padding: '9px', background: colors.accent, border: 'none',
      borderRadius: radius.md, color: '#fff', fontSize: '13px',
      fontWeight: typography.weight.semibold, cursor: 'pointer',
      boxShadow: '0 0 20px rgba(91,127,255,0.30)', transition: `all ${animation.fast}`,
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
      background: `linear-gradient(135deg, ${colors.accent}, ${colors.teal})`,
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
      primary: { background: colors.accent, color: '#fff', boxShadow: shadows.accentGlow },
      secondary: { background: colors.surface2, color: colors.text2, border: `1px solid ${colors.border}` },
      ghost: { background: 'transparent', color: colors.accent, border: `1px solid ${colors.accentBorder}` },
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
  '--color-teal': colors.teal,
  '--color-teal-glow': colors.tealGlow,
  '--color-green': colors.green,
  '--color-green-glow': colors.greenGlow,
  '--color-warn': colors.warn,
  '--color-warn-glow': colors.warnGlow,
  '--color-danger': colors.danger,
  '--color-danger-glow': colors.dangerGlow,
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
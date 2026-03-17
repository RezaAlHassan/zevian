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
    md: '13.5px',
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
    md: '20px',
    lg: '28px',
    xl: '36px',
    '2xl': '42px',
  },
  label: {
    fontSize: '10.5px',
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
  contentPadding: '28px',
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
  md: '8px',
  lg: '10px',
  xl: '12px',
  '2xl': '14px',
  '3xl': '16px',
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

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

// ─────────────────────────────────────────────
// COMPONENT TOKENS
// ─────────────────────────────────────────────
export const componentTokens = {
  sidebar: {
    root: {
      position: 'fixed' as const, left: 0, top: 0, bottom: 0,
      width: layout.sidebarWidth, background: colors.surface,
      borderRight: `1px solid ${colors.border}`,
      display: 'flex', flexDirection: 'column' as const, zIndex: zIndex.sidebar,
    },
    logo: {
      padding: '18px 20px 14px', display: 'flex', alignItems: 'center', gap: '10px',
      borderBottom: `1px solid ${colors.border}`,
    },
    logoMark: {
      width: '30px', height: '30px', background: colors.accent, borderRadius: radius.md,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: typography.fonts.display, fontWeight: typography.weight.extrabold,
      fontSize: '14px', color: '#fff', boxShadow: shadows.logoGlow,
    },
    logoText: {
      fontFamily: typography.fonts.display, fontWeight: typography.weight.bold,
      fontSize: '17px', letterSpacing: '-0.3px', color: colors.text,
    },
    nav: { padding: '12px 10px', flex: 1 },
    navLabel: {
      fontSize: '10px', fontWeight: typography.weight.semibold, color: colors.text3,
      letterSpacing: '0.08em', textTransform: 'uppercase' as const, padding: '8px 10px 4px',
    },
    navItem: {
      base: {
        display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px',
        borderRadius: radius.md, cursor: 'pointer', color: colors.text2,
        fontSize: '13.5px', fontWeight: typography.weight.medium,
        transition: `all ${animation.fast}`, marginBottom: '1px',
        textDecoration: 'none',
      },
      hover: { background: colors.surface2, color: colors.text },
      active: { background: colors.accentGlow, color: colors.accent, border: `1px solid ${colors.accentBorder}` },
    },
    footer: { padding: '12px 10px', borderTop: `1px solid ${colors.border}` },
    ctaButton: {
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
      width: '100%', padding: '9px', background: colors.accent, border: 'none',
      borderRadius: radius.md, color: '#fff', fontSize: '13px',
      fontWeight: typography.weight.semibold, cursor: 'pointer',
      boxShadow: '0 0 20px rgba(91,127,255,0.30)', transition: `all ${animation.fast}`,
    },
  },
  header: {
    root: {
      position: 'fixed' as const, left: layout.sidebarWidth, right: 0, top: 0,
      height: layout.headerHeight, background: 'rgba(10,12,16,0.90)',
      backdropFilter: 'blur(12px)', borderBottom: `1px solid ${colors.border}`,
      display: 'flex', alignItems: 'center', padding: '0 24px', gap: '10px', zIndex: zIndex.header,
    },
    title: {
      fontFamily: typography.fonts.display, fontSize: '16px',
      fontWeight: typography.weight.bold, letterSpacing: '-0.2px', color: colors.text,
    },
    iconButton: {
      width: '34px', height: '34px', background: colors.surface,
      border: `1px solid ${colors.border}`, borderRadius: radius.md,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', color: colors.text2,
    },
    avatar: {
      width: '34px', height: '34px',
      background: `linear-gradient(135deg, ${colors.accent}, ${colors.teal})`,
      borderRadius: radius.md, display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontWeight: typography.weight.bold,
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
      position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.65)',
      backdropFilter: 'blur(4px)', zIndex: zIndex.modal,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
    },
    sheet: {
      width: layout.modalSheetWidth, height: '100vh',
      background: colors.surface, borderLeft: `1px solid ${colors.border}`,
      display: 'flex', flexDirection: 'column' as const,
    },
    header: {
      padding: '20px 24px 16px', borderBottom: `1px solid ${colors.border}`,
      display: 'flex', alignItems: 'flex-start', gap: '12px', flexShrink: 0,
      background: colors.surface, position: 'sticky' as const, top: 0, zIndex: 10,
    },
    title: {
      fontFamily: typography.fonts.display, fontSize: '17px',
      fontWeight: typography.weight.extrabold, color: colors.text, letterSpacing: '-0.3px',
    },
    subtitle: { fontSize: '12px', color: colors.text3, marginTop: '2px' },
    closeButton: {
      width: '30px', height: '30px', borderRadius: radius.md,
      background: colors.surface2, border: `1px solid ${colors.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', color: colors.text2, transition: `all ${animation.fast}`,
    },
    bodyNoPadding: { flex: 1, overflowY: 'auto' as const },
    footer: {
      padding: '16px 24px', borderTop: `1px solid ${colors.border}`,
      display: 'flex', justifyContent: 'flex-end', gap: '10px', flexShrink: 0,
      background: colors.surface, position: 'sticky' as const, bottom: 0, zIndex: 10,
    },
  },
  button: {
    base: {
      display: 'inline-flex', alignItems: 'center', gap: '7px',
      padding: '8px 16px', borderRadius: radius.md,
      fontSize: '13px', fontWeight: typography.weight.semibold,
      cursor: 'pointer', transition: `all ${animation.fast}`,
      fontFamily: typography.fonts.body, border: 'none',
    },
    sizes: {
      sm: { padding: '6px 12px', fontSize: '12px' },
      md: { padding: '8px 16px', fontSize: '13px' },
      lg: { padding: '10px 20px', fontSize: '14px' },
      icon: { width: '30px', height: '30px', padding: '0', justifyContent: 'center' as const, borderRadius: radius.md },
    },
    variants: {
      primary: { background: colors.accent, color: '#fff', boxShadow: shadows.accentGlow },
      secondary: { background: colors.surface2, color: colors.text2, border: `1px solid ${colors.border}` },
      ghost: { background: 'transparent', color: colors.accent, border: `1px solid ${colors.accentBorder}` },
    },
  },
  card: {
    root: {
      background: colors.surface, border: `1px solid ${colors.border}`,
      borderRadius: radius['2xl'], overflow: 'hidden',
    },
    header: {
      padding: '16px 20px 14px', display: 'flex', alignItems: 'center', gap: '10px',
      borderBottom: `1px solid ${colors.border}`,
    },
    title: {
      fontWeight: typography.weight.semibold, fontSize: '14px', color: colors.text,
      display: 'flex', alignItems: 'center', gap: '8px', flex: 1,
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
} as const
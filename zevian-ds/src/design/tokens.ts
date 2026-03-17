/**
 * ═══════════════════════════════════════════════════════════
 *  ZEVIAN DESIGN TOKENS
 *  Single source of truth for all visual decisions.
 *
 *  Usage in Tailwind:    className={cn(tokens.card.base)}
 *  Usage in inline:      style={{ background: colors.surface }}
 *  Usage in CSS vars:    var(--color-accent)
 *
 *  This file is the reference Cursor uses when building
 *  or refactoring any Zevian component.
 * ═══════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────
// COLORS
// ─────────────────────────────────────────────
export const colors = {
  // Base backgrounds
  bg: '#0a0c10',   // page root background
  surface: '#111318',   // cards, sidebar, header
  surface2: '#181c24',   // nested card bg, input bg, hover bg
  surface3: '#1e2330',   // deepest nested, score bar tracks, skeleton

  // Borders
  border: 'rgba(255,255,255,0.07)',   // default border
  borderHover: 'rgba(255,255,255,0.13)',   // hovered border
  borderDashed: 'rgba(255,255,255,0.10)',   // dashed empty states

  // Text hierarchy
  text: '#f0f2f7',   // primary text
  text2: '#8b93a8',   // secondary / labels
  text3: '#545d73',   // muted / placeholders / timestamps

  // Brand accent (blue-violet)
  accent: '#5b7fff',
  accentHover: '#7090ff',
  accentGlow: 'rgba(91,127,255,0.18)',
  accentBorder: 'rgba(91,127,255,0.28)',

  // Secondary accent (teal / AI color)
  teal: '#00d4aa',
  tealGlow: 'rgba(0,212,170,0.12)',

  // Semantic colors
  green: '#10b981',
  greenGlow: 'rgba(16,185,129,0.12)',

  warn: '#f59e0b',
  warnGlow: 'rgba(245,158,11,0.12)',

  danger: '#f04438',
  dangerGlow: 'rgba(240,68,56,0.15)',

  purple: '#8b5cf6',
  purpleGlow: 'rgba(139,92,246,0.12)',
} as const;

// ─────────────────────────────────────────────
// TYPOGRAPHY
// ─────────────────────────────────────────────
export const typography = {
  // Font families
  fonts: {
    display: "'Syne', sans-serif",       // headings, scores, logo
    body: "'Syne', sans-serif",       // all UI text
    mono: "'DM Mono', monospace",     // numbers, weights, code
  },

  // Google Fonts import string
  googleFontsUrl:
    'https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@400;500;600;700;800&display=swap',

  // Size scale
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

  // Weight scale
  weight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  // Score-specific sizes (Syne font)
  score: {
    sm: '16px',
    md: '20px',
    lg: '28px',
    xl: '36px',
    '2xl': '42px',
  },

  // Label style (uppercase section headers)
  label: {
    fontSize: '10.5px',
    fontWeight: 700,
    letterSpacing: '0.07em',
    textTransform: 'uppercase' as const,
    color: colors.text3,
  },
} as const;

// ─────────────────────────────────────────────
// SPACING & LAYOUT
// ─────────────────────────────────────────────
export const layout = {
  sidebarWidth: '220px',
  headerHeight: '56px',

  // Content padding
  contentPadding: '28px',
  contentPaddingMobile: '16px',

  // Modal sheet width
  modalSheetWidth: '580px',
  modalSheetWidthSm: '520px',

  // Max content width
  maxContentWidth: '1280px',
} as const;

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
} as const;

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
} as const;

// ─────────────────────────────────────────────
// ANIMATION
// ─────────────────────────────────────────────
export const animation = {
  // Durations
  fast: '0.15s',
  base: '0.20s',
  slow: '0.30s',
  slower: '0.40s',

  // Easings
  ease: 'ease',
  easeOut: 'cubic-bezier(0.22, 0.68, 0, 1.2)',   // slight overshoot (sheet slide-in)
  easeSmooth: 'cubic-bezier(0.4, 0, 0.2, 1)',

  // Named keyframes (reference — define in global CSS)
  keyframes: {
    fadeUp: 'fadeUp 0.3s ease both',
    slideIn: 'slideIn 0.28s cubic-bezier(0.22,0.68,0,1.2) both',
    pulseRing: 'pulse-ring 2.4s ease-in-out infinite',
    shimmer: 'shimmer 1.2s infinite',
    spin: 'spin 0.8s linear infinite',
  },
} as const;

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
} as const;

// ─────────────────────────────────────────────
// COMPONENT TOKENS
// These are the exact className/style combos used per component
// ─────────────────────────────────────────────

export const componentTokens = {

  // ── SIDEBAR ──────────────────────────────────
  sidebar: {
    root: {
      position: 'fixed' as const,
      left: 0, top: 0, bottom: 0,
      width: layout.sidebarWidth,
      background: colors.surface,
      borderRight: `1px solid ${colors.border}`,
      display: 'flex',
      flexDirection: 'column' as const,
      zIndex: zIndex.sidebar,
    },
    logo: {
      padding: '18px 20px 14px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      borderBottom: `1px solid ${colors.border}`,
    },
    logoMark: {
      width: '30px', height: '30px',
      background: colors.accent,
      borderRadius: radius.md,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: typography.fonts.display,
      fontWeight: typography.weight.extrabold,
      fontSize: '14px',
      color: '#fff',
      boxShadow: shadows.logoGlow,
    },
    logoText: {
      fontFamily: typography.fonts.display,
      fontWeight: typography.weight.bold,
      fontSize: '17px',
      letterSpacing: '-0.3px',
      color: colors.text,
    },
    nav: {
      padding: '12px 10px',
      flex: 1,
    },
    navLabel: {
      fontSize: '10px',
      fontWeight: typography.weight.semibold,
      color: colors.text3,
      letterSpacing: '0.08em',
      textTransform: 'uppercase' as const,
      padding: '8px 10px 4px',
    },
    navItem: {
      base: {
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '8px 10px',
        borderRadius: radius.md,
        cursor: 'pointer',
        color: colors.text2,
        fontSize: '13.5px',
        fontWeight: typography.weight.medium,
        transition: `all ${animation.fast}`,
        marginBottom: '1px',
      },
      hover: {
        background: colors.surface2,
        color: colors.text,
      },
      active: {
        background: colors.accentGlow,
        color: colors.accent,
        border: `1px solid ${colors.accentBorder}`,
      },
      iconSize: '16px',
    },
    badge: {
      marginLeft: 'auto',
      background: colors.danger,
      color: '#fff',
      fontSize: '10px', fontWeight: typography.weight.bold,
      padding: '1px 6px',
      borderRadius: '10px',
    },
    footer: {
      padding: '12px 10px',
      borderTop: `1px solid ${colors.border}`,
    },
    // Primary CTA button in sidebar footer
    ctaButton: {
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
      width: '100%', padding: '9px',
      background: colors.accent,
      border: 'none',
      borderRadius: radius.md,
      color: '#fff',
      fontSize: '13px', fontWeight: typography.weight.semibold,
      cursor: 'pointer',
      boxShadow: '0 0 20px rgba(91,127,255,0.30)',
      transition: `all ${animation.fast}`,
    },
  },

  // ── HEADER ───────────────────────────────────
  header: {
    root: {
      position: 'fixed' as const,
      left: layout.sidebarWidth, right: 0, top: 0,
      height: layout.headerHeight,
      background: 'rgba(10,12,16,0.90)',
      backdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${colors.border}`,
      display: 'flex', alignItems: 'center',
      padding: '0 24px', gap: '10px',
      zIndex: zIndex.header,
    },
    title: {
      fontFamily: typography.fonts.display,
      fontSize: '16px', fontWeight: typography.weight.bold,
      letterSpacing: '-0.2px',
      color: colors.text,
    },
    breadcrumb: {
      display: 'flex', alignItems: 'center', gap: '6px',
      fontSize: '13px', color: colors.text3,
    },
    breadcrumbLink: {
      color: colors.text2, cursor: 'pointer',
      transition: `color ${animation.fast}`,
    },
    breadcrumbCurrent: {
      color: colors.text, fontWeight: typography.weight.medium,
    },
    searchBar: {
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '6px 12px',
      background: colors.surface,
      border: `1px solid ${colors.border}`,
      borderRadius: radius.md,
      fontSize: '13px', color: colors.text2,
      width: '220px',
      transition: `border-color ${animation.fast}`,
    },
    iconButton: {
      width: '34px', height: '34px',
      background: colors.surface,
      border: `1px solid ${colors.border}`,
      borderRadius: radius.md,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', color: colors.text2,
    },
    avatar: {
      width: '34px', height: '34px',
      background: `linear-gradient(135deg, ${colors.accent}, ${colors.teal})`,
      borderRadius: radius.md,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: typography.weight.bold, fontSize: '12px', color: '#fff',
      cursor: 'pointer',
    },
  },

  // ── BUTTONS ───────────────────────────────────
  button: {
    base: {
      display: 'inline-flex', alignItems: 'center', gap: '7px',
      padding: '8px 16px',
      borderRadius: radius.md,
      fontSize: '13px', fontWeight: typography.weight.semibold,
      cursor: 'pointer',
      transition: `all ${animation.fast}`,
      fontFamily: typography.fonts.body,
      border: 'none',
    },
    sizes: {
      sm: { padding: '6px 12px', fontSize: '12px' },
      md: { padding: '8px 16px', fontSize: '13px' },
      lg: { padding: '10px 20px', fontSize: '14px' },
      icon: { width: '30px', height: '30px', padding: '0', justifyContent: 'center' as const, borderRadius: radius.md },
    },
    variants: {
      primary: {
        background: colors.accent, color: '#fff',
        boxShadow: shadows.accentGlow,
      },
      primaryHover: {
        background: colors.accentHover,
        boxShadow: shadows.accentGlowLg,
      },
      secondary: {
        background: colors.surface2, color: colors.text2,
        border: `1px solid ${colors.border}`,
      },
      secondaryHover: {
        borderColor: colors.borderHover, color: colors.text,
      },
      ghost: {
        background: 'transparent', color: colors.accent,
        border: `1px solid ${colors.accentBorder}`,
      },
      ghostHover: { background: colors.accentGlow },
      danger: {
        background: colors.dangerGlow, color: colors.danger,
        border: `1px solid rgba(240,68,56,0.20)`,
      },
    },
  },

  // ── CARDS ─────────────────────────────────────
  card: {
    root: {
      background: colors.surface,
      border: `1px solid ${colors.border}`,
      borderRadius: radius['2xl'],
      overflow: 'hidden',
    },
    header: {
      padding: '16px 20px 14px',
      display: 'flex', alignItems: 'center', gap: '10px',
      borderBottom: `1px solid ${colors.border}`,
    },
    title: {
      fontWeight: typography.weight.semibold,
      fontSize: '14px', color: colors.text,
      display: 'flex', alignItems: 'center', gap: '8px',
      flex: 1,
    },
    titleIconSize: '15px',
    action: {
      fontSize: '12px', color: colors.accent,
      fontWeight: typography.weight.medium,
      cursor: 'pointer', padding: '4px 8px',
      borderRadius: radius.sm,
      transition: `background ${animation.fast}`,
    },
    body: { padding: '20px' },
    // Nested card (e.g. metric cards, criteria cards)
    nested: {
      background: colors.surface2,
      border: `1px solid ${colors.border}`,
      borderRadius: radius.lg,
      padding: '14px',
      cursor: 'pointer',
      transition: `all ${animation.base}`,
    },
    nestedHover: {
      borderColor: colors.borderHover,
      background: colors.surface3,
    },
    nestedActive: {
      borderColor: colors.accentBorder,
      background: 'rgba(91,127,255,0.05)',
    },
    // Top accent strip on project/goal cards
    accentStrip: {
      height: '3px', width: '100%',
    },
  },

  // ── KPI CARDS ─────────────────────────────────
  kpi: {
    root: {
      background: colors.surface,
      border: `1px solid ${colors.border}`,
      borderRadius: radius.xl,
      padding: '14px 16px',
      transition: `border-color ${animation.base}`,
    },
    label: {
      fontSize: '10.5px', fontWeight: typography.weight.bold,
      color: colors.text3, textTransform: 'uppercase' as const,
      letterSpacing: '0.05em', marginBottom: '7px',
      display: 'flex', alignItems: 'center', gap: '5px',
    },
    value: {
      fontFamily: typography.fonts.display,
      fontSize: '26px', fontWeight: typography.weight.bold,
      letterSpacing: '-0.5px', lineHeight: '1',
    },
    meta: {
      fontSize: '11px', color: colors.text3, marginTop: '5px',
    },
    // Large KPI (dashboard top row)
    valueLarge: {
      fontFamily: typography.fonts.display,
      fontSize: '32px', fontWeight: typography.weight.bold,
      letterSpacing: '-1px', lineHeight: '1',
      marginBottom: '8px',
    },
  },

  // ── INPUTS ────────────────────────────────────
  input: {
    base: {
      width: '100%',
      padding: '9px 12px',
      background: colors.surface2,
      border: `1px solid ${colors.border}`,
      borderRadius: radius.md,
      fontSize: '13.5px', color: colors.text,
      fontFamily: typography.fonts.body,
      outline: 'none',
      transition: `border-color ${animation.fast}, box-shadow ${animation.fast}`,
    },
    focus: {
      borderColor: colors.accentBorder,
      boxShadow: shadows.inputFocus,
    },
    placeholder: { color: colors.text3 },
    label: {
      fontSize: '12px', fontWeight: typography.weight.semibold,
      color: colors.text2, marginBottom: '6px',
      display: 'flex', alignItems: 'center', gap: '5px',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
    },
    helper: {
      fontSize: '11.5px', color: colors.text3, marginTop: '5px',
      lineHeight: '1.55',
    },
    required: { color: colors.accent, fontSize: '11px' },
    select: {
      // Same as base + chevron arrow background
      paddingRight: '32px',
      appearance: 'none' as const,
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 16 16'%3E%3Cpath d='M4 6l4 4 4-4' fill='none' stroke='%23545d73' stroke-width='2'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 12px center',
    },
    textarea: {
      resize: 'vertical' as const,
      minHeight: '88px',
      lineHeight: '1.6',
    },
    searchIcon: {
      position: 'absolute' as const, left: '11px', top: '50%',
      transform: 'translateY(-50%)',
      width: '13px', height: '13px', color: colors.text3,
      pointerEvents: 'none' as const,
    },
  },

  // ── MODAL / SHEET ─────────────────────────────
  modal: {
    overlay: {
      position: 'fixed' as const, inset: 0,
      background: 'rgba(0,0,0,0.65)',
      backdropFilter: 'blur(4px)',
      zIndex: zIndex.modal,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
    },
    sheet: {
      width: layout.modalSheetWidth,
      height: '100vh',
      background: colors.surface,
      borderLeft: `1px solid ${colors.border}`,
      display: 'flex', flexDirection: 'column' as const,
      // animation: animation.keyframes.slideIn  (apply via className)
    },
    header: {
      padding: '20px 24px 16px',
      borderBottom: `1px solid ${colors.border}`,
      display: 'flex', alignItems: 'flex-start', gap: '12px',
      flexShrink: 0,
      background: colors.surface,
      position: 'sticky' as const, top: 0, zIndex: 10,
    },
    title: {
      fontFamily: typography.fonts.display,
      fontSize: '17px', fontWeight: typography.weight.extrabold,
      color: colors.text, letterSpacing: '-0.3px',
    },
    subtitle: {
      fontSize: '12px', color: colors.text3, marginTop: '2px',
    },
    closeButton: {
      width: '30px', height: '30px',
      borderRadius: radius.md,
      background: colors.surface2,
      border: `1px solid ${colors.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', color: colors.text2,
      transition: `all ${animation.fast}`,
    },
    body: {
      flex: 1, overflowY: 'auto' as const,
      padding: '24px',
    },
    bodyNoPadding: {
      flex: 1, overflowY: 'auto' as const,
    },
    footer: {
      padding: '16px 24px',
      borderTop: `1px solid ${colors.border}`,
      display: 'flex', justifyContent: 'flex-end', gap: '10px',
      flexShrink: 0,
      background: colors.surface,
      position: 'sticky' as const, bottom: 0, zIndex: 10,
    },
    section: {
      padding: '20px 26px',
      borderBottom: `1px solid ${colors.border}`,
    },
    sectionTitle: {
      fontSize: '13px', fontWeight: typography.weight.bold,
      color: colors.text,
      display: 'flex', alignItems: 'center', gap: '8px',
      marginBottom: '14px',
    },
  },

  // ── STATUS PILLS ──────────────────────────────
  status: {
    base: {
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      fontSize: '11px', fontWeight: typography.weight.semibold,
      padding: '3px 9px', borderRadius: '20px',
    },
    dot: {
      width: '5px', height: '5px', borderRadius: '50%', flexShrink: 0,
    },
    variants: {
      onTrack: { bg: colors.greenGlow, text: colors.green, dot: colors.green, dotGlow: `0 0 5px ${colors.green}` },
      atRisk: { bg: colors.dangerGlow, text: colors.danger, dot: colors.danger, dotGlow: 'none' },
      review: { bg: colors.warnGlow, text: colors.warn, dot: colors.warn, dotGlow: 'none' },
      overdue: { bg: colors.dangerGlow, text: colors.danger, dot: colors.danger, dotGlow: 'none' },
      noReports: { bg: colors.surface3, text: colors.text3, dot: colors.text3, dotGlow: 'none' },
    },
  },

  // ── CHIPS / TAGS ──────────────────────────────
  chip: {
    base: {
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '3px 10px', borderRadius: '20px',
      fontSize: '11px', fontWeight: typography.weight.semibold,
    },
    variants: {
      muted: { background: colors.surface3, color: colors.text2 },
      blue: { background: colors.accentGlow, color: colors.accent, border: `1px solid ${colors.accentBorder}` },
      green: { background: colors.greenGlow, color: colors.green },
      amber: { background: colors.warnGlow, color: colors.warn },
      red: { background: colors.dangerGlow, color: colors.danger },
      teal: { background: colors.tealGlow, color: colors.teal },
      purple: { background: colors.purpleGlow, color: colors.purple },
    },
  },

  // ── SCORE DISPLAY ─────────────────────────────
  score: {
    base: {
      fontFamily: typography.fonts.display,
      fontWeight: typography.weight.bold,
      letterSpacing: '-0.5px',
    },
    sizes: {
      sm: '16px',
      md: '20px',
      lg: '28px',
      xl: '36px',
      '2xl': '42px',
    },
    colorFn: (score: number) => {
      if (score >= 7.5) return colors.green;
      if (score >= 6.0) return colors.warn;
      return colors.danger;
    },
    // Score thresholds
    thresholds: { good: 7.5, warn: 6.0 },
  },

  // ── SCORE BAR ─────────────────────────────────
  scoreBar: {
    track: {
      height: '4px',
      background: colors.surface3,
      borderRadius: '2px',
      overflow: 'hidden',
      marginTop: '4px',
    },
    fill: {
      height: '100%',
      borderRadius: '2px',
      transition: 'width 1s ease',
    },
    heights: { xs: '3px', sm: '4px', md: '5px', lg: '6px', xl: '8px' },
    colorFn: (score: number) => {
      if (score >= 7.5) return colors.green;
      if (score >= 6.0) return colors.warn;
      return colors.danger;
    },
  },

  // ── AVATAR ────────────────────────────────────
  avatar: {
    sizes: {
      sm: { width: '24px', height: '24px', fontSize: '8px', borderRadius: '6px' },
      md: { width: '30px', height: '30px', fontSize: '10px', borderRadius: '7px' },
      lg: { width: '32px', height: '32px', fontSize: '11px', borderRadius: '8px' },
      xl: { width: '40px', height: '40px', fontSize: '14px', borderRadius: '10px' },
      '2xl': { width: '52px', height: '52px', fontSize: '18px', borderRadius: '13px' },
    },
    gradients: [
      'linear-gradient(135deg, #5b7fff, #818cf8)',
      'linear-gradient(135deg, #00d4aa, #0ea5e9)',
      'linear-gradient(135deg, #f59e0b, #fb923c)',
      'linear-gradient(135deg, #8b5cf6, #ec4899)',
      'linear-gradient(135deg, #f04438, #f97316)',
      'linear-gradient(135deg, #10b981, #0ea5e9)',
    ],
    // Stack overlap for grouped avatars
    stackOverlap: '-6px',
    stackBorder: `2px solid ${colors.surface}`,
  },

  // ── TABS ──────────────────────────────────────
  tabs: {
    container: {
      display: 'flex', gap: '2px',
      borderBottom: `1px solid ${colors.border}`,
    },
    tab: {
      padding: '10px 16px',
      fontSize: '13px', fontWeight: typography.weight.medium,
      color: colors.text3, cursor: 'pointer',
      borderBottom: '2px solid transparent',
      marginBottom: '-1px',
      transition: `all ${animation.fast}`,
    },
    tabHover: { color: colors.text2 },
    tabActive: {
      color: colors.accent,
      borderBottomColor: colors.accent,
      fontWeight: typography.weight.semibold,
    },
  },

  // ── TABLE ─────────────────────────────────────
  table: {
    root: { width: '100%', borderCollapse: 'collapse' as const },
    th: {
      padding: '10px 14px',
      textAlign: 'left' as const,
      fontSize: '10.5px', fontWeight: typography.weight.bold,
      color: colors.text3,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.06em',
      borderBottom: `1px solid ${colors.border}`,
      whiteSpace: 'nowrap' as const,
    },
    td: {
      padding: '13px 14px',
      borderBottom: `1px solid ${colors.border}`,
      verticalAlign: 'middle' as const,
    },
    row: {
      cursor: 'pointer',
      transition: `background ${animation.fast}`,
    },
    rowHover: { background: colors.surface2 },
  },

  // ── EMPTY STATES ──────────────────────────────
  emptyState: {
    container: {
      display: 'flex', flexDirection: 'column' as const,
      alignItems: 'center', justifyContent: 'center',
      textAlign: 'center' as const,
      padding: '64px 24px',
    },
    iconWrap: {
      width: '64px', height: '64px',
      borderRadius: '16px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      marginBottom: '16px',
      position: 'relative' as const,
    },
    iconWrapBlue: { background: 'rgba(91,127,255,0.08)' },
    // Pulsing dashed ring — apply via CSS/animation
    title: {
      fontFamily: typography.fonts.display,
      fontSize: '16px', fontWeight: typography.weight.bold,
      color: colors.text, marginBottom: '6px',
      letterSpacing: '-0.2px',
    },
    description: {
      fontSize: '13px', color: colors.text3,
      maxWidth: '300px', lineHeight: '1.65',
      marginBottom: '20px',
    },
  },

  // ── SECTION DIVIDER LABEL ─────────────────────
  sectionLabel: {
    fontSize: '10.5px', fontWeight: typography.weight.bold,
    color: colors.text3, textTransform: 'uppercase' as const,
    letterSpacing: '0.08em', marginBottom: '16px',
    display: 'flex', alignItems: 'center', gap: '8px',
    // ::after line handled by CSS class
  },

  // ── AI BANNER ─────────────────────────────────
  aiBanner: {
    root: {
      display: 'flex', alignItems: 'center', gap: '16px',
      padding: '14px 20px',
      background: 'linear-gradient(90deg, rgba(91,127,255,0.08), rgba(0,212,170,0.05))',
      border: '1px solid rgba(91,127,255,0.20)',
      borderRadius: radius.xl,
      marginBottom: '24px',
    },
    badge: {
      display: 'flex', alignItems: 'center', gap: '6px',
      background: colors.accentGlow,
      border: `1px solid rgba(91,127,255,0.30)`,
      borderRadius: radius.sm,
      padding: '4px 10px',
      fontSize: '11px', fontWeight: typography.weight.semibold,
      color: colors.accent, whiteSpace: 'nowrap' as const,
    },
    text: { fontSize: '13px', color: colors.text2, flex: 1 },
  },

  // ── CALLOUT ───────────────────────────────────
  callout: {
    base: {
      display: 'flex', gap: '10px',
      padding: '12px 14px',
      background: 'rgba(91,127,255,0.06)',
      border: `1px solid ${colors.accentBorder}`,
      borderRadius: '9px',
      marginBottom: '14px',
    },
    text: {
      fontSize: '12.5px', color: colors.text2, lineHeight: '1.55',
    },
  },

  // ── ACTIVITY FEED ─────────────────────────────
  activity: {
    item: {
      display: 'flex', gap: '10px',
      padding: '10px 0',
      borderBottom: `1px solid ${colors.border}`,
    },
    dot: { width: '8px', height: '8px', borderRadius: '50%' },
    line: { width: '1px', flex: 1, background: colors.border, marginTop: '4px' },
    text: { fontSize: '12.5px', color: colors.text2, lineHeight: '1.55', flex: 1 },
    time: { fontSize: '11px', color: colors.text3, whiteSpace: 'nowrap' as const, paddingTop: '2px' },
  },

  // ── SPARKLINE ─────────────────────────────────
  sparkline: {
    bar: {
      borderRadius: '2px 2px 0 0',
      width: '5px',
    },
    container: {
      display: 'flex', alignItems: 'flex-end', gap: '2px',
      height: '24px',
    },
  },

  // ── TOAST ─────────────────────────────────────
  toast: {
    root: {
      position: 'fixed' as const,
      bottom: '24px', left: '50%',
      transform: 'translateX(-50%)',
      padding: '10px 20px',
      borderRadius: '10px',
      fontSize: '13px', fontWeight: typography.weight.semibold,
      display: 'flex', alignItems: 'center', gap: '8px',
      pointerEvents: 'none' as const,
      zIndex: zIndex.toast,
    },
    success: {
      background: colors.green,
      color: '#fff',
      boxShadow: '0 4px 20px rgba(16,185,129,0.3)',
    },
    danger: {
      background: colors.danger,
      color: '#fff',
      boxShadow: '0 4px 20px rgba(240,68,56,0.3)',
    },
  },
} as const;

// ─────────────────────────────────────────────
// CSS VARIABLE MAP
// Use this to generate a :root {} block
// ─────────────────────────────────────────────
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
} as const;

// ─────────────────────────────────────────────
// SCORE HELPER (use everywhere scores appear)
// ─────────────────────────────────────────────
export function getScoreColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return colors.text3;
  if (score >= 7.5) return colors.green;
  if (score >= 6.0) return colors.warn;
  return colors.danger;
}

export function getScoreBarColor(score: number | null | undefined): string {
  return getScoreColor(score);
}

export function getScoreStatus(score: number | null | undefined): 'on-track' | 'review' | 'at-risk' | 'no-data' {
  if (score === null || score === undefined) return 'no-data';
  if (score >= 7.5) return 'on-track';
  if (score >= 6.0) return 'review';
  return 'at-risk';
}

// ─────────────────────────────────────────────
// AVATAR GRADIENT HELPER
// ─────────────────────────────────────────────
export function getAvatarGradient(name: string): string {
  const gradients = componentTokens.avatar.gradients;
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return gradients[Math.abs(hash) % gradients.length];
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

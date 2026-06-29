'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { colors, radius, typography, getScoreColor, shadows, animation } from '@/design-system'
import { Avatar, Button, NoDataPill, StatusPill, ScoreDisplay } from '@/components/atoms'
import { Icon, IconName } from '@/components/atoms/Icon'
import { Card } from '@/components/molecules/Card'
import { DateRangeSelector } from '@/components/molecules/DateRangeSelector'
import { Organization } from '@/types'

// Warning card border: a stronger amber than warnGlow's fill, paired with the amber top strip.
// Submission Rate is a process warning, not a hard error, so it reads amber (warn) — red is
// reserved for genuinely bad scores via getScoreColor().
const WARN_BORDER = 'rgba(245,158,11,0.45)'

interface Props {
  teamStats: any
  recentReports: any[]
  projects: any[]
  lateSubmissions: any[]
  organization?: Organization
}

function KpiCard({
  label,
  icon,
  value,
  subtitle,
  subtitleRight,
  delta,
  tone = 'neutral',
  onClick,
  info,
  alert = false,
  accentBorder = false,
  dataZone,
}: {
  label: string
  // Leading glyph for the label row, from the shared Icon set. Sits left of the label text.
  icon: IconName
  value: string | number
  subtitle?: React.ReactNode
  // Optional right-aligned meta label, pushed to the far edge of the meta row (marginLeft:auto).
  // Used by Submission Rate to caption its chart with "X / Y this cycle" without disturbing
  // the left-aligned subtitle. Other cards omit it.
  subtitleRight?: React.ReactNode
  delta?: { value: number; direction: 'up' | 'down' | 'flat' } | null
  tone?: 'neutral' | 'green' | 'amber' | 'red'
  onClick?: () => void
  info?: string
  // When true the card is a systemic alert: amber top strip + stronger amber border. Reserved
  // for warning states that signal a process problem, not just a low number.
  alert?: boolean
  // When true the resting border is the accent tint (colors.accentBorder) instead of the neutral
  // borderStrong — gives a card its own identity without leaning on the value's score color.
  // Ignored under alert (which owns the border) and superseded by the hover border.
  accentBorder?: boolean
  // Zone 3 — the data zone. A FIXED-height band (DATA_ZONE_HEIGHT) rendered between the primary
  // value and the meta row that ALWAYS contains something: a viz, a skeleton, or an empty-state.
  // CSS/inline-SVG only. Never null — the caller picks the right state for the current data so
  // the band (and therefore every card's total height) stays identical.
  dataZone: React.ReactNode
}) {
  const valueColor =
    tone === 'green' ? colors.green :
    tone === 'amber' ? colors.warn :
    tone === 'red' ? colors.danger :
    colors.text

  const [hovered, setHovered] = React.useState(false)
  const clickable = !!onClick

  return (
    <div
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick!() } } : undefined}
      onMouseEnter={clickable ? () => setHovered(true) : undefined}
      onMouseLeave={clickable ? () => setHovered(false) : undefined}
      onFocus={clickable ? () => setHovered(true) : undefined}
      onBlur={clickable ? () => setHovered(false) : undefined}
      style={{
        position: 'relative',
        background: colors.surface,
        border: `1px solid ${alert ? WARN_BORDER : clickable && hovered ? colors.borderHover : accentBorder ? colors.accentBorder : colors.borderStrong}`,
        borderRadius: radius.md,
        padding: '24px 22px',
        overflow: 'hidden',
        cursor: clickable ? 'pointer' : 'default',
        boxSizing: 'border-box',
        transition: `border-color ${animation.fast}`,
        outline: 'none',
      }}
    >
      {alert && (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: colors.warn,
          }}
        />
      )}
      {clickable && (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: '14px',
            right: '16px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: colors.accent,
            opacity: hovered ? 1 : 0,
            transform: hovered ? 'translateX(0)' : 'translateX(2px)',
            transition: `opacity ${animation.fast}, transform ${animation.fast}`,
            pointerEvents: 'none',
          }}
        >
          <Icon name="sparkles" size={11} />
          Ask
        </span>
      )}
      <div style={{
        fontSize: '11px',
        fontWeight: 700,
        color: colors.text3,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        marginBottom: '8px',
        // FIXED height (not min-height): the tallest row is Submission Rate, whose ⓘ glyph has a
        // larger inline line box than the 13px Icon on the other three. minHeight let that row
        // grow and pushed its value down. A fixed height locks all four rows to the same box;
        // lineHeight:1 + alignItems:center keep icon, text, and glyph centred without the glyph
        // imposing extra line-box height. overflow:hidden guards against any glyph spill.
        height: '18px',
        lineHeight: 1,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}>
        <Icon name={icon} size={13} color={colors.text3} />
        {label}
        {info && (
          <span
            title={info}
            style={{ cursor: 'help', opacity: 0.6, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}
            aria-label={info}
          >
            ⓘ
          </span>
        )}
      </div>
      {/* Zone 2 — primary value. FIXED height (not content-sized) so a unit suffix or a taller
          glyph can never nudge the data zone below it out of alignment across the four cards. */}
      <div style={{
        fontFamily: typography.fonts.numeric,
        fontSize: '28px',
        fontWeight: 900,
        height: '28px',
        lineHeight: 1,
        color: valueColor,
        marginBottom: '10px',
        overflow: 'hidden',
      }}>
        {value}
      </div>
      {/* Zone 3 — data zone. A FIXED-height band (DATA_ZONE_HEIGHT) so the meta row below lands
          at the same vertical position on all four cards, whatever the band holds: a fill bar,
          a sparkline, dense period bars, an avatar stack, or a skeleton / empty-state. Content
          is vertically centred; self-contained zones (skeletons, icon states) fill the band and
          centre themselves. The band always renders something, so the meta rows never drift. */}
      <div style={{ height: `${DATA_ZONE_HEIGHT}px`, marginBottom: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {dataZone}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', minHeight: '20px' }}>
        {delta != null && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 8px',
            borderRadius: '999px',
            fontSize: '11px',
            fontWeight: 700,
            color: delta.direction === 'up' ? colors.green : delta.direction === 'down' ? colors.danger : colors.text3,
            background: delta.direction === 'up' ? colors.greenGlow : delta.direction === 'down' ? colors.dangerGlow : colors.surface2,
          }}>
            {delta.direction === 'up' ? '↑' : delta.direction === 'down' ? '↓' : '→'} {Math.abs(delta.value).toFixed(1)}
          </span>
        )}
        {subtitle && <span style={{ fontSize: '12px', color: colors.text3 }}>{subtitle}</span>}
        {subtitleRight != null && (
          <span style={{ marginLeft: 'auto', fontSize: '12px', color: colors.text3, fontFamily: typography.fonts.numeric, whiteSpace: 'nowrap' }}>
            {subtitleRight}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Fixed three-zone data-zone height ───────────────────────────────────
// Every KPI card reserves an identical data-zone band so all four cards are exactly the same
// height regardless of data state. 56px is sized to the tallest content the band ever holds —
// the 52px score sparkline plus breathing room; the dense period bars (32px), tapered coverage
// bar (40px) and avatar stack (30px) all sit comfortably inside it. The band ALWAYS renders
// something (a viz, a skeleton, or an empty-state), so the meta row below it lands at the same
// vertical position on every card. The card's total height is set here by the design system,
// not by data.
const DATA_ZONE_HEIGHT = 56

// Shared empty / skeleton treatment for the data zone: one horizontal dotted line at the
// vertical centre of the band with a single line of muted 10px text below it. No fill, no
// animation, no spinner — the empty state reads as a deliberate system decision, not a chart
// that failed to load. Used wherever a card has context (members / periods) but no values to
// plot yet. NOTE: the spec calls for `colors.border` at 40% opacity, but border is already a
// 7%-white token, so 40% of it renders invisible on the dark surface — we use borderStrong
// (10% white) as the closest *visible* quiet baseline. See decision log.
function DataZoneSkeleton({ text }: { text: string }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg
        width="100%"
        height="2"
        preserveAspectRatio="none"
        aria-hidden
        style={{ position: 'absolute', top: '50%', left: 0, transform: 'translateY(-50%)', display: 'block' }}
      >
        <line x1="0" y1="1" x2="100%" y2="1" stroke={colors.borderStrong} strokeWidth="1" strokeDasharray="3 4" />
      </svg>
      <span style={{
        position: 'absolute',
        top: 'calc(50% + 9px)',
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: '10px',
        color: colors.text3,
      }}>
        {text}
      </span>
    </div>
  )
}

// Icon-led empty state: a small (18px) outlined glyph centred in the zone with a line of muted
// 10px text below it. Used where an icon communicates the state faster than a bare baseline —
// the "all caught up" checkmark and "no members" person on Needs Review, and the muted dash on
// Team Avg Score before any report is reviewed.
function DataZoneIconState({ icon, text }: { icon: IconName; text: string }) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
      <Icon name={icon} size={18} color={colors.text3} />
      <span style={{ fontSize: '10px', color: colors.text3, textAlign: 'center' }}>{text}</span>
    </div>
  )
}

// Plainest empty state: a single line of muted text centred in the zone, no baseline or icon.
// Used where there is nothing to chart and no skeleton makes sense — "no members" on Coverage
// and "no reports due" on Submission Rate.
function DataZoneText({ text }: { text: string }) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: '11px', color: colors.text3, textAlign: 'center' }}>{text}</span>
    </div>
  )
}

// Team Avg "trend building" viz for 1–2 score points: a single score dot at the right with a
// flat dotted line running left. Communicates "we have a value but not enough history to draw a
// direction" without implying up or down. Accent-coloured (charts are blue) so it reads as data
// rather than the muted no-data skeleton above.
function TrendBuildingDot({ color }: { color: string }) {
  const W = 100, H = 52, cy = H / 2
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }} aria-hidden>
      <line x1="2" y1={cy} x2={W - 9} y2={cy} stroke={color} strokeOpacity={0.5} strokeWidth="1.4" strokeDasharray="3 4" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <circle cx={W - 5} cy={cy} r="2.6" fill={color} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

// ── Stat-card micro-visualisations ──────────────────────────────────────
// All CSS / inline-SVG, sized to sit inside the fixed DATA_ZONE_HEIGHT band, no chart libraries.
// Each is fed only data that already exists in the dashboard payload (see DashboardView
// destructure); when that data is missing the card renders a skeleton / empty-state in the band
// instead of collapsing.

// Single horizontal fill bar with the raw fraction to its right (e.g. "10 / 24"). The single-
// period fallback for two cards: Team Coverage when members exist but there is no multi-period
// history to taper, and Submission Rate when fewer than 2 reporting periods exist (a period bar
// chart of one bar is meaningless). `value` is the 0..1 fill ratio; numerator/denominator verbatim.
function FillBar({
  value,
  color,
  height,
  numerator,
  denominator,
}: {
  value: number
  color: string
  height: string
  numerator: number
  denominator: number
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ flex: 1, height, background: colors.surface3, borderRadius: radius.full, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: radius.full, transition: `width 1s ${animation.easeSmooth}` }} />
      </div>
      <span style={{ fontSize: '11px', fontWeight: 700, color: colors.text3, fontFamily: typography.fonts.numeric, whiteSpace: 'nowrap' }}>
        {numerator} / {denominator}
      </span>
    </div>
  )
}

// Score-trend sparkline. Draws an SVG polyline over `points` (the payload's trendScores —
// cumulative team average across the range, ≤8 samples), normalised within the series so a
// near-flat run still reads. Line + final-point dot are coloured by the current score band.
// A subtle gradient fill beneath grounds the line at this small size. Caller gates on
// points.length >= 3, so we never draw a meaningless 2-point line.
function ScoreSparkline({ points, color }: { points: number[]; color: string }) {
  // H fills the viz band so score movement reads clearly; y-coords normalise across the full
  // [pad, H-pad] range, so the line and its gradient fill scale with the taller canvas.
  const W = 100, H = 52, pad = 4
  const n = points.length
  const min = Math.min(...points)
  const max = Math.max(...points)
  const span = max - min || 1
  const gradId = React.useId()
  const xy = points.map((p, i) => {
    const x = pad + (i * (W - pad * 2)) / (n - 1)
    const y = pad + (1 - (p - min) / span) * (H - pad * 2)
    return [x, y] as const
  })
  const line = xy.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${xy[0][0]},${H - pad} ${line} ${xy[n - 1][0]},${H - pad}`
  const [fx, fy] = xy[n - 1]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }} aria-hidden>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gradId})`} />
      <polyline points={line} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <circle cx={fx} cy={fy} r="2.4" fill={color} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

// Team-improvement "Volume" bar for the Team Improvement card (after the liquidity moodboard).
// A solid filled shape that tapers from a point on the left, runs as a flat thin bar, then blooms
// at the cutoff (the improvement %) where the top and bottom edges flare outward in symmetric
// bezier curves — a lens/eye shape. A white tick marks the cutoff; past it an unfilled track
// fades dark to the right. Fill is colors.accent (blue). `pct` is the 0..1 cutoff fraction.
function ImprovementBar({ pct }: { pct: number }) {
  const W = 240, H = 40
  const cy = H / 2
  const gradId = React.useId()
  const p = Math.max(0, Math.min(1, pct))
  const cutoff = Math.max(46, Math.min(W - 6, p * W)) // keep the bloom on-canvas at the extremes
  const thin = 2          // half-thickness of the flat run
  const bloom = H * 0.42  // half-height of the lens flare at the cutoff
  const spread = 30       // horizontal reach of the flare each side
  const lead = 12         // x where the left point has risen to the thin bar
  const fStart = Math.max(lead + 4, cutoff - spread) // flare begins (filled side)
  const fEnd = Math.min(W, cutoff + spread)          // flare ends (track side)
  const mid = (fStart + cutoff) / 2
  const midR = (cutoff + fEnd) / 2

  const filled = [
    `M 0 ${cy}`,
    `C 4 ${cy} ${lead - 4} ${cy - thin} ${lead} ${cy - thin}`,                 // left point → thin top
    `L ${fStart} ${cy - thin}`,                                                // flat thin top
    `C ${mid} ${cy - thin} ${cutoff - 6} ${cy - bloom} ${cutoff} ${cy - bloom}`, // flare up to bloom
    `L ${cutoff} ${cy + bloom}`,                                               // cutoff edge (under the tick)
    `C ${cutoff - 6} ${cy + bloom} ${mid} ${cy + thin} ${fStart} ${cy + thin}`,  // flare down to thin
    `L ${lead} ${cy + thin}`,                                                  // flat thin bottom
    `C ${lead - 4} ${cy + thin} 4 ${cy} 0 ${cy}`,                              // thin bottom → left point
    'Z',
  ].join(' ')

  const track = [
    `M ${cutoff} ${cy - bloom}`,
    `C ${cutoff + 6} ${cy - bloom} ${midR} ${cy - thin} ${fEnd} ${cy - thin}`, // flare down to thin
    `L ${W} ${cy - thin}`,
    `L ${W} ${cy + thin}`,
    `L ${fEnd} ${cy + thin}`,
    `C ${midR} ${cy + thin} ${cutoff + 6} ${cy + bloom} ${cutoff} ${cy + bloom}`,
    'Z',
  ].join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }} aria-hidden>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={colors.surface3} stopOpacity="0.9" />
          <stop offset="100%" stopColor={colors.surface3} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={track} fill={`url(#${gradId})`} />
      <path d={filled} fill={colors.accent} />
      <line x1={cutoff} y1={cy - bloom} x2={cutoff} y2={cy + bloom} stroke="#fff" strokeWidth="1.6" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

// Submission-rate period bar chart for the Submission Rate card. One thin bar per weekly period,
// height proportional to that week's submission rate within a fixed 32px chart (a 2px stub at 0%
// so empty periods still read). Bars share a flat baseline; tops are rounded (a rounded rect with
// a square rect overlaid on its lower half squares the bottom corners). The current (most recent)
// period is accent at full opacity so the eye lands on "now"; prior periods are accent at 35%
// opacity. Bars are blue regardless of rate. Caller caps the series at the most recent 32 and only
// renders this when ≥2 periods exist (a single bar is meaningless).
function PeriodBars({ buckets }: { buckets: { submitted: number; total: number; pct: number }[] }) {
  const H = 32
  const n = buckets.length
  // Thin bars, minimal gap (gap:bar ≈ 1:2). The SVG stretches to full width, so this ratio — not
  // the absolute units — sets the packing: ~28–32 bars read as a dense band across the card.
  const barW = 3
  const gap = 1.5
  const unit = barW + gap
  const W = Math.max(barW, n * unit - gap)
  const rx = 1
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }} aria-hidden>
      {buckets.map((b, i) => {
        const isCurrent = i === n - 1
        const h = Math.max(2, (Math.max(0, Math.min(100, b.pct)) / 100) * H)
        const y = H - h
        const x = i * unit
        return (
          <g key={i} fill={colors.accent} fillOpacity={isCurrent ? 1 : 0.35}>
            {/* rounded rect rounds all four corners; the square rect over its lower half restores
                flat bottom corners, leaving only the top rounded. */}
            <rect x={x} y={y} width={barW} height={h} rx={rx} />
            <rect x={x} y={y + rx} width={barW} height={Math.max(0, h - rx)} />
          </g>
        )
      })}
    </svg>
  )
}

// Overlapping avatar stack for the Needs-Review card: which members have unreviewed reports.
// Caps at 3 avatars + a "+N" overflow badge. Reuses the dashboard's muted avatar palette so it
// matches the Team list. Built from the same recentReports array needsReviewCount counts, so
// the faces never disagree with the number above them.
function ReviewAvatarStack({ names, size = 'md' }: { names: string[]; size?: 'sm' | 'md' }) {
  const shown = names.slice(0, size === 'sm' ? 4 : 3)
  const overflow = names.length - shown.length
  const avatarSize = size === 'sm' ? 'sm' : 'md'
  const boxSize = size === 'sm' ? 24 : 30
  return (
    <div style={{ display: 'flex', alignItems: 'center', height: size === 'sm' ? '22px' : '28px' }}>
      {shown.map((name, i) => (
        <Avatar
          key={`${name}-${i}`}
          name={name}
          size={avatarSize}
          style={{ background: getPerfAvatarGradient(name), marginLeft: i === 0 ? 0 : '-7px', border: `2px solid ${colors.surface}`, boxSizing: 'border-box' }}
        />
      ))}
      {overflow > 0 && (
        <span style={{
          marginLeft: '-7px', width: `${boxSize}px`, height: `${boxSize}px`, borderRadius: '7px',
          background: colors.surface3, border: `2px solid ${colors.surface}`, boxSizing: 'border-box',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '11px', fontWeight: 700, color: colors.text2,
        }}>
          +{overflow}
        </span>
      )}
    </div>
  )
}

// Member-count badge for the Team card header. Uses the accent family at low opacity so it
// reads as a live count without competing with the status badges on member rows.
function AccentChip({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '3px 9px',
      borderRadius: '999px',
      fontSize: '11px',
      fontWeight: 700,
      color: colors.accent,
      background: colors.accentGlow,
      border: `1px solid ${colors.accentBorder}`,
      whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  )
}

function formatCompactReportDate(value?: string | null): string {
  if (!value) return 'No date'
  try {
    const safeValue = value.length === 10 ? `${value}T12:00:00` : value
    return new Date(safeValue).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return value
  }
}

// Lightweight secondary line: "Latest report [KPI name] · date" in muted text below the role.
// Clicking navigates to the report. KPI name comes from report.goalName (already in payload).
function LatestReportLink({
  report,
  onOpen,
}: {
  report: any
  onOpen: (e: React.MouseEvent) => void
}) {
  if (!report?.id) return null

  const kpiName = report.goalName
  const date = formatCompactReportDate(report.date || report.submittedAt)
  const label = kpiName ? `Latest report ${kpiName} · ${date}` : `Latest report · ${date}`

  return (
    <button
      type="button"
      onClick={onOpen}
      style={{
        display: 'block',
        marginTop: '3px',
        padding: 0,
        border: 0,
        background: 'transparent',
        color: colors.text3,
        fontSize: typography.size.xs,
        fontWeight: 500,
        cursor: 'pointer',
        textAlign: 'left',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '100%',
        lineHeight: 1.4,
      }}
    >
      {label}
    </button>
  )
}

// An action (not a status). Rendered as the design system's outline button with a
// question icon so it reads as "do something" rather than another badge in the row.
function AskWhyButton({ label = 'Ask why', onClick }: { label?: string; onClick: (e: React.MouseEvent) => void }) {
  return (
    <Button variant="secondary" size="sm" icon="help" onClick={onClick} style={{ whiteSpace: 'nowrap', borderRadius: radius.full }}>
      {label}
    </Button>
  )
}

function formatAttentionTag(tag: any) {
  switch (tag.type) {
    case 'ESCALATING_CLAIMS':
      return { label: '⚠ Escalating Claims', tone: 'amber' as const }
    case 'STAGNANT_LANGUAGE':
      return { label: '⚠ Templated Reporting', tone: 'amber' as const }
    case 'MISSED':
      return { label: `${tag.count} Missed`, tone: 'amber' as const }
    case 'UNREVIEWED_AGE':
      return { label: `Unreviewed ${tag.days}d ago`, tone: 'amber' as const }
    case 'DECLINING':
      return { label: 'Declining', tone: 'amber' as const }
    default:
      return { label: tag.type, tone: 'neutral' as const }
  }
}

function scoreBand(score: number | null | undefined) {
  if (score == null) return 'neutral' as const
  if (score >= 7.5) return 'green' as const
  if (score >= 6) return 'amber' as const
  return 'red' as const
}

// Monday-00:00 (UTC) timestamp of the week a date falls in — the bucket key for the Submission
// Rate period bars, so reports/periods land in the same weekly slot regardless of weekday.
function weekStartMs(d: Date): number {
  const dt = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const dow = (dt.getUTCDay() + 6) % 7 // Mon = 0 … Sun = 6
  dt.setUTCDate(dt.getUTCDate() - dow)
  return dt.getTime()
}

// Deterministic per-person gradient: djb2 hash → HSL hue, 45° spread between stops.
// Covers the full color wheel so teammates get teal, orange, green, purple, red, amber
// rather than the old monolithic blue-purple cluster. Both stops are high-saturation and
// dark enough (42-55% lightness) to keep white initials legible.
function getPerfAvatarGradient(name: string): string {
  let h = 5381
  for (let i = 0; i < name.length; i++) h = ((h << 5) + h) ^ name.charCodeAt(i)
  const hue = Math.abs(h) % 360
  return `linear-gradient(135deg, hsl(${hue},82%,55%), hsl(${(hue + 45) % 360},90%,42%))`
}

// Short label shown inside the risk-flag badge — the employee's primary attention tag.
function flagLabel(entry: any): string {
  const tags = entry?.tags || []
  return tags.length ? formatAttentionTag(tags[0]).label : 'Flagged'
}

// One-line reason shown in the flag's tooltip/popover. Prefers the lowest-scoring
// criterion (e.g. "Lowest: user research quality 0.0, Jun 13"), then a trend sentence,
// then the attention tags as a fallback.
function flagReason(entry: any): string {
  const r = entry?.reason
  if (r) {
    if ('criterionName' in r) {
      const d = new Date(r.reportDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      return `Lowest: ${r.criterionName} ${Number(r.score).toFixed(1)}, ${d}`
    }
    if ('text' in r && r.text) return r.text
  }
  const tags = entry?.tags || []
  return tags.length ? tags.map((t: any) => formatAttentionTag(t).label).join(', ') : 'Flagged'
}

// Dot-label pairs for team row status indicators. Replaces the heavy chip (background +
// border-radius + padding) with a 5px filled circle + lowercase text — reads as a live
// indicator rather than a static badge. Color mapping follows semantic token intent.
const DOT_LABEL_MAP: Record<string, { dot: string; text: string }> = {
  'reviewed':       { dot: colors.green,  text: 'reviewed' },
  'on-track':       { dot: colors.green,  text: 'on track' },
  'active':         { dot: colors.green,  text: 'active' },
  'submitted_late': { dot: colors.green,  text: 'submitted' },
  'needs-review':   { dot: colors.warn,   text: 'needs review' },
  'review':         { dot: colors.warn,   text: 'needs review' },
  'late':           { dot: colors.warn,   text: 'late' },
  'scored':         { dot: colors.accent, text: 'scored' },
  'at-risk':        { dot: colors.danger, text: 'at risk' },
  'missed':         { dot: colors.danger, text: 'missed' },
  'no-data':        { dot: colors.text3,  text: 'no data yet' },
  'no-reports':     { dot: colors.text3,  text: 'no data yet' },
  'pending':        { dot: colors.text3,  text: 'pending' },
  'on-leave':       { dot: colors.text3,  text: 'on leave' },
  'on_leave':       { dot: colors.text3,  text: 'on leave' },
  'excused':        { dot: colors.text3,  text: 'waived' },
  'upcoming':       { dot: colors.text3,  text: 'upcoming' },
  'due_today':      { dot: colors.text3,  text: 'due today' },
}
function DotLabel({ status }: { status: string }) {
  const cfg = DOT_LABEL_MAP[status] ?? { dot: colors.text3, text: status.replace(/-/g, ' ') }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      <span style={{ fontSize: '11px', color: colors.text3, fontWeight: 500 }}>{cfg.text}</span>
    </span>
  )
}

// Risk flag badge for a Team row. Hover shows the reason as a tooltip; tap (touch)
// pins it open as a small popover. Stops click propagation so it doesn't trigger the
// row's navigation. Styled as a darker secondary variant so it stands out in the row.
function RiskFlag({ label, reason, trend }: { label: string; reason: string; trend?: 'up' | 'down' | null }) {
  const [pinned, setPinned] = React.useState(false)
  const [hovered, setHovered] = React.useState(false)
  const show = pinned || hovered

  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        aria-label={reason}
        onClick={(e) => { e.stopPropagation(); setPinned(p => !p) }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onBlur={() => setPinned(false)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '3px 9px',
          borderRadius: '999px',
          background: 'rgba(120,30,30,0.45)',
          border: '1px solid rgba(240,68,56,0.35)',
          color: colors.danger,
          fontSize: '11px',
          fontWeight: 700,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        <span aria-hidden="true">⚑</span>{label}
        {trend && <span aria-hidden="true">{trend === 'up' ? '↑' : '↓'}</span>}
      </button>
      {show && (
        <span
          role="tooltip"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            zIndex: 60,
            background: colors.surface3,
            border: `1px solid ${colors.border}`,
            borderRadius: radius.md,
            padding: '6px 10px',
            fontSize: '11px',
            fontWeight: 500,
            color: colors.text2,
            whiteSpace: 'nowrap',
            boxShadow: shadows.cardHover,
            pointerEvents: 'none',
          }}
        >
          {reason}
        </span>
      )}
    </span>
  )
}

// Shared list-row surface for the dashboard's three lists (Recent Reports, Needs Attention,
// Team). This is the reference's exact NestedCard recipe — surface-2 at rest, surface-3 with a
// brighter border on hover, radius-md, 14px pad. One component so hover + styling can never drift
// between the three lists.
function HoverRow({ onClick, children, style }: { onClick?: () => void; children: React.ReactNode; style?: React.CSSProperties }) {
  const [hover, setHover] = React.useState(false)
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } } : undefined}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? colors.surface3 : colors.surface2,
        border: `1px solid ${hover ? colors.borderHover : colors.border}`,
        borderRadius: radius.md,
        padding: '14px',
        transition: `background ${animation.base}, border-color ${animation.base}`,
        cursor: onClick ? 'pointer' : 'default',
        outline: 'none',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

const ELLIPSIS: React.CSSProperties = { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }

// Recent Reports row — reference ReportRow: avatar + name + "goal · date" meta, status pill, score.
function ReportRow({ r, onOpen, onOpenEmployee }: { r: any; onOpen: () => void; onOpenEmployee: () => void }) {
  return (
    <HoverRow onClick={onOpen} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
      <div
        onClick={(e) => { e.stopPropagation(); onOpenEmployee() }}
        style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}
        title={`Open ${r.employeeName}`}
      >
        <Avatar name={r.employeeName} size="lg" style={{ background: getPerfAvatarGradient(r.employeeName) }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: colors.text, ...ELLIPSIS }}>{r.employeeName}</div>
          <div style={{ fontSize: '11px', color: colors.text3, ...ELLIPSIS }}>
            {[r.goalName, formatCompactReportDate(r.date)].filter(Boolean).join(' · ')}
          </div>
        </div>
      </div>
      <StatusPill status={r.reviewed ? 'reviewed' : 'needs-review'} />
      {r.score != null && <ScoreDisplay score={r.score} size="md" />}
    </HoverRow>
  )
}

// Needs Attention row — reference: avatar + name + score on the top line, evidence/reason below.
function AttentionRow({ a, onOpen, isLast }: { a: any; onOpen: () => void; isLast: boolean }) {
  return (
    <HoverRow onClick={onOpen} style={{ marginBottom: isLast ? 0 : '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <Avatar name={a.name} size="md" style={{ background: getPerfAvatarGradient(a.name) }} />
        <span style={{ fontSize: '13px', fontWeight: 600, flex: 1, minWidth: 0, color: colors.text, ...ELLIPSIS }}>{a.name}</span>
        {a.latestDrop != null && <ScoreDisplay score={a.latestDrop} size="sm" />}
      </div>
      <div style={{ fontSize: '11.5px', color: colors.text3, lineHeight: 1.5 }}>{flagReason(a)}</div>
    </HoverRow>
  )
}

// Compressed Team row — fills the slot the reference gives Criteria Breakdown. Same HoverRow
// surface as the other two lists; condensed to avatar + name/role + score for the 340px rail.
function CompactTeamRow({ e, onOpen, isLast }: { e: any; onOpen: () => void; isLast: boolean }) {
  const scoreColor = e.score != null ? getScoreColor(e.score) : colors.text3
  return (
    <HoverRow onClick={onOpen} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: isLast ? 0 : '8px' }}>
      <Avatar name={e.name} size="md" style={{ background: getPerfAvatarGradient(e.name) }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '12.5px', fontWeight: 600, color: colors.text, ...ELLIPSIS }}>{e.name}</div>
        <div style={{ fontSize: '11px', color: colors.text3, ...ELLIPSIS }}>{e.role}</div>
      </div>
      {e.score != null ? (
        <span className="font-numeric" style={{ display: 'inline-flex', alignItems: 'baseline', gap: '2px' }}>
          <span style={{ fontSize: '15px', fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{e.score.toFixed(1)}</span>
          <span style={{ fontSize: '11px', fontWeight: 600, color: colors.text3 }}>/10</span>
        </span>
      ) : (
        <NoDataPill reportCount={e.reportCount ?? 0} />
      )}
    </HoverRow>
  )
}

export function DashboardView({ teamStats }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const paramsString = searchParams.toString()
  const appendParams = React.useCallback((href: string) => {
    if (!paramsString) return href
    return href.includes('?') ? `${href}&${paramsString}` : `${href}?${paramsString}`
  }, [paramsString])

  // ── Ask hand-off ───────────────────────────────────────────────────────
  // Build a deep link into Ask carrying the typed/suggested question plus whatever
  // scope the dashboard already knows (current date range, optional employee), so
  // Ask doesn't have to re-resolve it.
  const startParam = searchParams.get('start')
  const endParam = searchParams.get('end')
  const viewParam = searchParams.get('view')
  // "All Time" is the only range without a start anchor (start=all); every other state — including
  // the default 30-day window when no param is present — is a bounded range. Count-based meta
  // labels append " in this range" off rangeSuffix so they read correctly against the active scope.
  const isAllTime = startParam === 'all'
  const rangeSuffix = isAllTime ? '' : ' in this range'
  const buildAskHref = React.useCallback((question: string, opts?: { employeeId?: string }) => {
    const p = new URLSearchParams()
    p.set('q', question)
    if (opts?.employeeId) p.set('employee', opts.employeeId)
    if (startParam && startParam !== 'all') {
      p.set('start', startParam)
      if (endParam) p.set('end', endParam)
    }
    if (viewParam) p.set('view', viewParam)
    return `/ask?${p.toString()}`
  }, [startParam, endParam, viewParam])
  const goToAsk = React.useCallback((question: string, opts?: { employeeId?: string }) => {
    router.push(buildAskHref(question, opts))
  }, [router, buildAskHref])

  const needsAttention = teamStats?.needsAttention || []
  const kpis = teamStats?.kpis || {}
  const teamPerformance = teamStats?.teamPerformance || []
  const goals = teamStats?.goals || []
  // Already present in the dashboard payload (no extra fetch): the cumulative score-trend
  // series feeds the Team Avg sparkline, and recentReports (the same array needsReviewCount is
  // derived from) feeds the Needs Review avatar stack.
  const trendScores: number[] = teamStats?.trendScores || []
  const recentReports = teamStats?.recentReports || []
  // Per-period rows (status + dueDate) already in the payload — the source for the Submission
  // Rate period bar chart. No report_id here, so "submitted" is read off status.
  const reportingPeriods = teamStats?.reportingPeriods || []

  // Distinct members with at least one unreviewed report, in recency order — the faces for the
  // Needs Review stack. Derived from the same recentReports needsReviewCount counts, so the
  // stack and the count can never disagree.
  const pendingReviewMembers = React.useMemo(() => {
    const seen = new Set<string>()
    const out: string[] = []
    for (const r of recentReports as any[]) {
      if (r.reviewed) continue
      const key = r.employeeId || r.employeeName
      if (!key || seen.has(key)) continue
      seen.add(key)
      out.push(r.employeeName || 'Unknown')
    }
    return out
  }, [recentReports])

  const latestReportByEmployee = React.useMemo(() => {
    const out = new Map<string, any>()
    for (const r of recentReports as any[]) {
      if (!r.employeeId || out.has(r.employeeId)) continue
      out.set(r.employeeId, r)
    }
    return out
  }, [recentReports])

  // Risk-flag lookup: an employee is flagged on their Team row iff they "previously
  // triggered Needs Attention" — i.e. they appear in needsAttention, which is the only
  // source of the per-person reason line (lowest-scoring criterion).
  const needsAttentionById = React.useMemo(
    () => new Map((needsAttention as any[]).map((e) => [e.id, e])),
    [needsAttention]
  )

  // Team Avg Score coverage: scorecards scored = distinct goals with ≥1 scored report in
  // range; KPIs scored = total criteria across those scorecards. Same scoredGoals basis the
  // old "More" Scorecards tile used, extended with each goal's criteria count.
  const scoredGoals = goals.filter((g: any) => (g.reports ?? 0) > 0)
  const kpisScored = scoredGoals.reduce((a: number, g: any) => a + (g.criteriaCount ?? 0), 0)
  const avgScoreSubtitle = scoredGoals.length > 0
    ? `${scoredGoals.length} KPI${scoredGoals.length === 1 ? '' : 's'} scored, ${kpisScored} criteri${kpisScored === 1 ? 'on' : 'a'} scored${rangeSuffix}`
    : 'No scores yet'

  // Submission Rate is the dashboard's danger card: a low rate is a systemic process problem
  // (reports not coming in), not just a low number. We treat it as an alert in the product's
  // red band (<50%). overdue = due − submitted, surfaced as the card's meta instead of the
  // passive "N due" line. Note: this is the only card eligible for the alert treatment — a low
  // avg score is a coaching flag (amber), and a review backlog is workflow (amber), so there is
  // never more than one red strip competing for attention.
  const subRate = kpis.submissionRate
  const isSubmissionDanger = subRate?.pct != null && subRate.pct < 50
  const subExpected = subRate?.expected ?? 0
  const subSubmitted = subRate?.submitted ?? 0
  const overdue = subRate?.expected != null && subRate?.submitted != null
    ? subRate.expected - subRate.submitted
    : null
  const coverage = kpis.teamCoverage || {
    expected: 0,
    reporting: 0,
    notReporting: 0,
    pct: null,
  }
  // Actual headcount (drives the "no members" states), independent of how many are due this range.
  const memberCount = teamPerformance.length
  const coverageMeta = memberCount === 0
    ? 'No team members yet'
    : coverage.expected > 0
      ? `${coverage.reporting} / ${coverage.expected} members submitted${rangeSuffix}`
      : `No reports due${rangeSuffix}`

  // ── Submission Rate period bar chart (Card 2) ──────────────────────────
  // Bucket the Submission Rate bars by ISO week (Mon-anchored), unioning two sources so the chart
  // isn't starved when few reporting-period rows exist (the "1/1" single-period case):
  //   • reportingPeriods → the real rate: expected = periods due that week (excl void/excused/
  //     pending), submitted = those with a report (status submitted/late).
  //   • recentReports    → weeks that have a submission but no period rows; counted as fully
  //     submitted (a report came in; we have no denominator, so the bar reads full height).
  // Per-week rate = submitted / expected. Oldest → newest, last bar = current week. Capped at the
  // most recent 32. NOTE: recentReports is capped at 10 upstream, so real density is bounded by
  // available history — see decision log.
  const periodBuckets = React.useMemo(() => {
    const map = new Map<number, { submitted: number; expected: number; reports: number }>()
    const slot = (k: number) => {
      let b = map.get(k)
      if (!b) { b = { submitted: 0, expected: 0, reports: 0 }; map.set(k, b) }
      return b
    }
    for (const p of reportingPeriods as any[]) {
      if (p.status === 'void' || p.status === 'excused' || p.status === 'pending') continue
      if (!p.dueDate) continue
      const b = slot(weekStartMs(new Date(p.dueDate)))
      b.expected++
      if (p.status === 'submitted' || p.status === 'late') b.submitted++
    }
    for (const r of recentReports as any[]) {
      const d = r.date || r.submittedAt
      if (!d) continue
      slot(weekStartMs(new Date(d))).reports++
    }
    return [...map.entries()]
      .map(([end, b]) => {
        // Period rows win where present; otherwise fall back to the report count (rate = 100%).
        const expected = b.expected > 0 ? b.expected : b.reports
        const submitted = b.expected > 0 ? b.submitted : b.reports
        const pct = expected > 0 ? Math.round((submitted / expected) * 100) : 0
        return { end, submitted, total: expected, pct }
      })
      .filter((b) => b.total > 0)
      .sort((a, b) => a.end - b.end)
      .slice(-32)
  }, [reportingPeriods, recentReports])
  // Two reporting periods is the floor for a bar chart to mean anything; below it both Coverage
  // and Submission Rate fall back to the single fill bar. Coverage has no native per-period series,
  // so it reuses this submission-period count as its "we have multi-period history" signal.
  const hasPeriodChart = periodBuckets.length >= 2

  // ── Needs Review dynamic meta (Card 4) ─────────────────────────────────
  // At-risk: down-trending members whose avg sits below the 6.0 getScoreStatus threshold — the
  // closest available stand-in for "below 6.0 for 2+ consecutive periods" (we have a trend
  // direction + an average, not per-period history). Missed: members with a current-period
  // scorecard due who submitted nothing (submittedPeriods 0 of periodCount > 0).
  const atRiskCount = teamPerformance.filter((e: any) => e.scoreDirection === 'down' && e.score != null && e.score < 6.0).length
  const missedCount = teamPerformance.filter((e: any) => (e.periodCount ?? 0) > 0 && (e.submittedPeriods ?? 0) === 0).length
  const needsReviewCount = kpis.needsReviewCount ?? 0
  // Meta-label priority (spec): both → at-risk → missed → fallback. The compound at-risk/missed
  // strings keep their exact spec wording; only the single-count "missed" line is range-aware
  // (" this period" under All Time, " in this range" otherwise) since a bare suffix would read
  // awkwardly on the compound forms.
  const needsReviewMeta =
    needsReviewCount === 0
      ? (memberCount > 0 ? 'Review queue is clear' : 'No team members yet')
      : atRiskCount > 0 && missedCount > 0
        ? `${atRiskCount} at risk · ${missedCount} missed submission${missedCount === 1 ? '' : 's'}`
        : atRiskCount > 0
          ? `${atRiskCount} at risk · review first`
          : missedCount > 0
            ? `${missedCount} missed${isAllTime ? ' this period' : ' in this range'}`
            : 'Awaiting your review'

  // ── Data-zone state selection (zone 3 of each card) ────────────────────
  // Each card picks exactly one fixed-height data-zone node for the current data. Order matters:
  // the most-specific empty/no-context state is checked first, then richer viz states.
  //
  // Card 1 — Team Coverage: no members → prompt; members but nothing submitted → skeleton;
  // multi-period history → tapered fill bar at the coverage %; otherwise the single members-
  // submitted fill bar.
  const coverageZone = memberCount === 0
    ? <DataZoneText text="Add team members to get started" />
    : coverage.reporting === 0 || coverage.expected === 0
      ? <DataZoneSkeleton text={`No submissions${rangeSuffix || ' yet'}`} />
      : hasPeriodChart && coverage.pct != null
        ? <ImprovementBar pct={coverage.pct / 100} />
        : <FillBar value={coverage.reporting / coverage.expected} color={colors.accent} height="6px" numerator={coverage.reporting} denominator={coverage.expected} />

  // Card 2 — Team Avg Score: 3+ trend points → sparkline; 1–2 → trend-building dot; none → dash.
  const avgScoreZone = trendScores.length >= 3
    ? <ScoreSparkline points={trendScores} color={colors.accent} />
    : trendScores.length >= 1
      ? <TrendBuildingDot color={colors.accent} />
      : <DataZoneIconState icon="minus" text="Scores appear after first reviewed report" />

  // Card 3 — Submission Rate: nothing due → text; 2+ periods → dense bars; otherwise the single
  // fill bar (also covers the 0%-submitted-but-expected case, which simply renders an empty bar).
  const submissionZone = subExpected === 0
    ? <DataZoneText text={`No reports due${rangeSuffix}`} />
    : hasPeriodChart
      ? <PeriodBars buckets={periodBuckets} />
      : <FillBar value={subSubmitted / subExpected} color={colors.accent} height="6px" numerator={subSubmitted} denominator={subExpected} />

  // Card 4 — Needs Review: pending reviews with faces → top-aligned avatar stack (the dynamic
  // meta below carries the at-risk / missed detail); all reviewed → checkmark; no members → person.
  const needsReviewZone = needsReviewCount > 0
    ? (pendingReviewMembers.length > 0
        ? <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'flex-start', paddingTop: '2px' }}><ReviewAvatarStack names={pendingReviewMembers} /></div>
        : <DataZoneSkeleton text="Reports awaiting review" />)
    : memberCount > 0
      ? <DataZoneIconState icon="checkCircle" text="All caught up" />
      : <DataZoneIconState icon="person" text="Add team members to get started" />

  return (
    <div className="animate-fade-up" style={{ padding: '24px', maxWidth: '1180px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
        <DateRangeSelector
          startDate={searchParams.get('start') || undefined}
          endDate={searchParams.get('end') || undefined}
          defaultRangeDays={30}
          onRangeChange={(start, end) => {
            const params = new URLSearchParams(searchParams.toString())
            if (start === 'all') {
              params.set('start', 'all')
              params.delete('end')
            } else if (start && end) {
              params.set('start', start)
              params.set('end', end)
            } else {
              params.delete('start')
              params.delete('end')
            }
            router.push(`?${params.toString()}`)
          }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px' }}>
        <KpiCard
          label="Team Coverage"
          icon="people"
          value={coverage.pct != null ? `${coverage.pct}%` : '—'}
          subtitle={coverageMeta}
          // Data zone: tapered fill bar (multi-period) / single members-submitted fill bar /
          // no-submissions skeleton / add-members prompt. Picked in coverageZone above.
          dataZone={coverageZone}
          onClick={() => goToAsk('Which team members submitted in this date range, and who has not?')}
        />
        <KpiCard
          label="Team Avg Score"
          icon="trendingUp"
          value={kpis.teamAvgScore != null ? kpis.teamAvgScore.toFixed(1) : '—'}
          subtitle={avgScoreSubtitle}
          delta={kpis.teamAvgDelta}
          // Value is white — the score's semantic direction is already carried by the sparkline,
          // so the number doesn't repeat it.
          tone="neutral"
          accentBorder
          // Data zone: score-trend sparkline (3+ points) / trend-building dot (1–2) / dash empty
          // state (no scores). Charts are colors.accent; the score VALUE keeps its band via tone.
          dataZone={avgScoreZone}
          onClick={() => goToAsk(
            kpis.teamAvgScore != null
              ? `Why is the team average ${kpis.teamAvgScore.toFixed(1)} this cycle?`
              : 'How is the team performing this cycle?'
          )}
        />
        <KpiCard
          label="Submission Rate"
          icon="chart"
          value={kpis.submissionRate?.pct != null ? `${kpis.submissionRate.pct}%` : '—'}
          subtitle={
            isSubmissionDanger && overdue != null
              ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: colors.text3, flexShrink: 0 }} />
                  <span style={{ color: colors.text3, fontWeight: 700 }}>{overdue} overdue{rangeSuffix}</span>
                </span>
              )
              : subExpected > 0
                ? `${subExpected} report${subExpected === 1 ? '' : 's'} due${rangeSuffix}`
                : `No reports due${rangeSuffix}`
          }
          info="Of every report due in the selected date range, the share that was submitted. Excludes periods not yet due and approved leave."
          // Amber alert (top strip + border) is a card-level state for a sub-50% rate; it holds
          // regardless of which data-zone variant renders below.
          alert={isSubmissionDanger}
          // Data zone: dense period bars (2+ periods) / single fill bar (1 period or 0%-submitted)
          // / no-reports-due text. Picked in submissionZone above.
          dataZone={submissionZone}
          subtitleRight={subExpected > 0 ? `${subSubmitted} / ${subExpected} submitted` : undefined}
          // Value stays white — the amber warning is carried by the border + top strip alone.
          tone="neutral"
          onClick={() => goToAsk(
            kpis.submissionRate?.pct != null
              ? `Why is our submission rate ${kpis.submissionRate.pct}% this cycle, and who is behind?`
              : 'What is our submission rate this cycle?'
          )}
        />
        <KpiCard
          label="Needs Review"
          icon="alert"
          value={needsReviewCount}
          // Dynamic meta: surfaces at-risk and missed-submission counts derived from
          // teamPerformance, in priority order, instead of the old "awaiting your review" filler.
          subtitle={needsReviewMeta}
          // Colour consolidation: a review backlog is workflow, not a score or submission-rate
          // band, so the value no longer renders amber (warn is reserved for those two). The
          // avatar stack carries the "who" signal instead.
          tone="neutral"
          // Data zone: top-aligned avatar stack of members with unreviewed reports / all-caught-up
          // checkmark / add-members person. Picked in needsReviewZone above.
          dataZone={needsReviewZone}
          onClick={() => goToAsk('Which reports still need my review, and what was flagged in them?')}
        />
      </div>

      {/* ── AI Summary banner — glow + gradient background, sitting between the KPI strip and
          the content grid, exactly where the reference dashboard places it (replacing the old
          Ask bar at the top of the page). */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '14px 18px',
          background: 'linear-gradient(90deg, rgba(91,127,255,0.08), rgba(0,212,170,0.05))',
          border: '1px solid rgba(91,127,255,0.20)',
          borderRadius: radius.md,
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            flexShrink: 0,
            background: colors.accentGlow,
            border: '1px solid rgba(91,127,255,0.30)',
            borderRadius: radius.sm,
            padding: '4px 10px',
            fontSize: '11px',
            fontWeight: typography.weight.semibold,
            color: colors.accent,
            whiteSpace: 'nowrap',
          }}
        >
          <Icon name="sparkles" size={12} color={colors.teal} />
          AI Summary
        </span>
        <span style={{ flex: 1, fontSize: '13px', color: colors.text2, lineHeight: 1.55 }}>
          {kpis.teamAvgDelta && kpis.teamAvgDelta.direction !== 'flat' ? (
            <>
              Team average is {kpis.teamAvgDelta.direction === 'up' ? 'up' : 'down'}{' '}
              <strong style={{ color: colors.text }}>{Math.abs(kpis.teamAvgDelta.value).toFixed(1)}</strong> this period.
            </>
          ) : (
            <>Team average is holding steady this period.</>
          )}
          {needsAttention.length > 0 ? (
            <> <strong style={{ color: colors.text }}>{needsAttention[0].name}</strong> needs attention — worth a 1:1 soon.</>
          ) : (
            <> Nobody is flagged for attention right now.</>
          )}
        </span>
        <Button variant="ghost" size="sm" onClick={() => goToAsk('Give me an overview of team performance.')}>
          Ask a follow-up
        </Button>
      </div>

      {/* ── Content grid: Recent Reports (main, 1fr) + rail (340px) ──────────────────────
          Mirrors the reference dashboard split. Needs Attention sits in the rail; the Team
          list is compressed into the slot the reference gives its Criteria Breakdown card. */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '16px', alignItems: 'start' }}>
        <Card
          title="Recent Reports"
          icon="reports"
          action={
            <span
              onClick={() => router.push(appendParams('/reports'))}
              style={{ fontSize: '12px', color: colors.accent, fontWeight: typography.weight.medium, cursor: 'pointer' }}
            >
              View all
            </span>
          }
        >
          {recentReports.length > 0 ? (
            recentReports.map((r: any) => (
              <ReportRow
                key={r.id}
                r={r}
                onOpen={() => router.push(appendParams(`/reports/${r.id}`))}
                onOpenEmployee={() => { if (r.employeeId) router.push(appendParams(`/employees/${r.employeeId}`)) }}
              />
            ))
          ) : (
            <div style={{ padding: '8px 0', color: colors.text3, fontSize: '13px' }}>No reports yet.</div>
          )}
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Card title="Needs Attention" icon="alertTriangle" danger>
            {needsAttention.length > 0 ? (
              needsAttention.map((a: any, i: number) => (
                <AttentionRow
                  key={a.id}
                  a={a}
                  isLast={i === needsAttention.length - 1}
                  onOpen={() => router.push(appendParams(`/employees/${a.id}`))}
                />
              ))
            ) : (
              <div style={{ padding: '4px 0', color: colors.text3, fontSize: '13px' }}>Nobody needs attention right now.</div>
            )}
          </Card>

          <Card
            title="Team"
            icon="people"
            chip={<AccentChip>{teamPerformance.length} {teamPerformance.length === 1 ? 'member' : 'members'}</AccentChip>}
          >
            {teamPerformance.length > 0 ? (
              teamPerformance.map((e: any, i: number) => (
                <CompactTeamRow
                  key={e.id}
                  e={e}
                  isLast={i === teamPerformance.length - 1}
                  onOpen={() => router.push(appendParams(`/employees/${e.id}`))}
                />
              ))
            ) : (
              <div style={{ padding: '4px 0', color: colors.text3, fontSize: '13px' }}>No team members to show.</div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

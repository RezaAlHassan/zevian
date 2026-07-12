'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { colors, radius, typography, getScoreColor, animation } from '@/design-system'
import { Avatar, Button } from '@/components/atoms'
import { Icon, IconName } from '@/components/atoms/Icon'
import { Card, ShowAllButton } from '@/components/molecules/Card'
import { DateRangeSelector } from '@/components/molecules/DateRangeSelector'
import { Organization } from '@/types'

// Warning card border: a stronger amber than warnGlow's fill, paired with the amber top strip.
// Overdue is a process warning, not a hard error, so it reads amber (warn) — red is reserved for
// genuinely bad scores via getScoreColor().
const WARN_BORDER = 'rgba(245,158,11,0.45)'

interface Props {
  teamStats: any
  recentReports: any[]
  projects: any[]
  lateSubmissions: any[]
  organization?: Organization
}

// ── Card meta lines ───────────────────────────────────────────────────────
// Each card hugs its content: label row + primary value + 0–2 meta lines (only the lines that
// have content are rendered — no reserved blank line). Cards in a row equalise to the tallest via
// the grid's default stretch, so the strip still reads as a set. No charts, no skeletons.
const META_LINE: React.CSSProperties = {
  fontSize: '12.5px',
  fontWeight: 500,
  color: colors.text3,
  height: '18px',
  lineHeight: '18px',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

// Full-width smooth area sparkline (Catmull-Rom → cubic bézier) with a soft gradient fill under the
// curve. It bleeds to the card's edges and stretches to fill the available height, so the hero score
// card reads as one composed unit — number over trend — rather than a figure floating in empty
// space. `vectorEffect: non-scaling-stroke` keeps the 2px line crisp when the SVG stretches.
function AreaTrend({ data, color }: { data: number[]; color: string }) {
  const gid = React.useId()
  if (!data || data.length < 2) return null
  const W = 300, H = 100
  const topPad = 12, botPad = 2
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const stepX = W / (data.length - 1)
  const pts = data.map((v, i) => ({
    x: i * stepX,
    y: topPad + (H - topPad - botPad) * (1 - (v - min) / range),
  }))
  let line = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] || p2
    const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6
    line += ` C ${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`
  }
  const area = `${line} L ${pts[pts.length - 1].x.toFixed(1)},${H} L ${pts[0].x.toFixed(1)},${H} Z`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function KpiCard({
  label,
  icon,
  value,
  valueColor = colors.text,
  meta1,
  meta2,
  onClick,
  alert = false,
  big = false,
  sparkline,
}: {
  label: string
  // Leading glyph for the label row, from the shared Icon set. Sits left of the label text.
  icon: IconName
  // ReactNode so a card can compose a fraction ("12 of 30 submitted") rather than a bare number.
  value: React.ReactNode
  // Colour for the primary value: getScoreColor() on the score card, warn/text on Overdue, and
  // text3 for empty / absent states.
  valueColor?: string
  meta1?: React.ReactNode
  // Second meta line. May be null — the line's height is still reserved so cards stay equal height.
  meta2?: React.ReactNode
  onClick?: () => void
  // When true the card is a systemic alert: amber top strip + stronger amber border. Reserved for
  // the Overdue card when overdue > 0 — never red (red is for low scores only).
  alert?: boolean
  // Enlarge the primary value (the hero Team Avg Score card).
  big?: boolean
  // Optional trend series → a compact smooth sparkline sits to the right of the value.
  sparkline?: number[]
}) {
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
        border: `1px solid ${alert ? WARN_BORDER : clickable && hovered ? colors.borderHover : colors.borderStrong}`,
        borderRadius: radius.md,
        padding: '22px',
        overflow: 'hidden',
        cursor: clickable ? 'pointer' : 'default',
        boxSizing: 'border-box',
        transition: `border-color ${animation.fast}`,
        outline: 'none',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {alert && (
        <span
          aria-hidden
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: colors.warn }}
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
        fontWeight: 600,
        color: colors.text3,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        marginBottom: '10px',
        height: '18px',
        lineHeight: 1,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}>
        <Icon name={icon} size={13} color={colors.text3} />
        {label}
      </div>
      {big ? (
        <>
          {/* Number + delta at the top … */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
            <span className="font-numeric" style={{ fontSize: '48px', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.5px', color: valueColor }}>{value}</span>
            {meta2 != null && meta2}
          </div>
          {meta1 != null && <div style={{ ...META_LINE, marginTop: '8px' }}>{meta1}</div>}
          {/* … and the trend fills the rest, bleeding to the card's edges. */}
          {sparkline && sparkline.length >= 2 && (
            <div style={{ position: 'relative', flex: 1, minHeight: '52px', margin: '14px -22px -22px' }}>
              <AreaTrend data={sparkline} color={valueColor} />
            </div>
          )}
        </>
      ) : (
        <>
          <div style={{
            fontFamily: typography.fonts.numeric,
            fontSize: '30px',
            fontWeight: 900,
            minHeight: '34px',
            lineHeight: 1.1,
            color: valueColor,
            overflow: 'hidden',
          }}>
            {value}
          </div>
          {/* Meta block — only the lines that have content are rendered, so the card hugs its content. */}
          {(meta1 != null || meta2 != null) && (
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {meta1 != null && <div style={META_LINE}>{meta1}</div>}
              {meta2 != null && <div style={META_LINE}>{meta2}</div>}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// Shared period-over-period trend pill. A small rounded badge carries an arrow + the delta
// magnitude (greenGlow for a good move, dangerGlow for a bad one), followed by muted context text.
// The arrow always follows the raw sign (positive ↑, negative ↓); colour follows the sign too,
// unless `invertColor` flips it — used on Overdue, where "up" (more overdue) is the bad direction.
// The magnitude renders as an integer when whole (overdue counts) and to 1 decimal otherwise
// (avg-score deltas). Callers omit the pill entirely when the delta is null (no prior period).
function TrendPill({ value, label, invertColor = false }: { value: number; label: string; invertColor?: boolean }) {
  const positive = value > 0
  const good = invertColor ? !positive : positive
  const magnitude = Number.isInteger(value) ? Math.abs(value) : Math.abs(value).toFixed(1)
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        padding: '2px 7px',
        borderRadius: '999px',
        fontSize: '11px',
        fontWeight: 700,
        fontFamily: typography.fonts.numeric,
        color: good ? colors.green : colors.danger,
        background: good ? colors.greenGlow : colors.dangerGlow,
      }}>
        {positive ? '↑' : '↓'} {magnitude}
      </span>
      <span style={{ fontSize: '12px', color: colors.text3 }}>{label}</span>
    </span>
  )
}

// Muted text shown in the KPI value slot in place of the number when a card has no data / a zero
// state (e.g. "No scores yet"). Sized down from the 30px metric so a sentence fits the value row.
function EmptyValue({ text }: { text: string }) {
  return <span style={{ fontFamily: typography.fonts.body, fontSize: '15px', fontWeight: 600, color: colors.text3 }}>{text}</span>
}

// One cell of the reporting status row: dot + label, then a colored count + %. Needs-Review and
// Overdue are clickable (Ask hand-off) so the actionable slices keep their affordance; Reviewed is
// passive. Lifts to surface-2 on hover when clickable.
function ReportStatCell({ dot, label, count, pct, color, onClick }: {
  dot: string; label: string; count: number; pct: number | null; color: string; onClick?: () => void
}) {
  const [hover, setHover] = React.useState(false)
  const clickable = !!onClick
  return (
    <div
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick!() } } : undefined}
      onMouseEnter={clickable ? () => setHover(true) : undefined}
      onMouseLeave={clickable ? () => setHover(false) : undefined}
      style={{
        flex: 1, minWidth: 0, padding: '8px 10px', margin: '-8px 0', borderRadius: radius.md,
        cursor: clickable ? 'pointer' : 'default', outline: 'none',
        background: clickable && hover ? colors.surface2 : 'transparent',
        transition: `background ${animation.fast}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', color: colors.text2, fontWeight: 500, whiteSpace: 'nowrap' }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '3px', background: dot, flexShrink: 0 }} />
        {label}
      </div>
      <div style={{ marginTop: '7px', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
        <span className="font-numeric" style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.3px', lineHeight: 1, color }}>{count}</span>
        {pct != null && <span className="font-numeric" style={{ fontSize: '12px', fontWeight: 600, color: colors.text3 }}>{pct}%</span>}
        {clickable && (
          <span aria-hidden style={{ marginLeft: 'auto', fontSize: '13px', fontWeight: 700, color: colors.accent, opacity: hover ? 1 : 0, transform: hover ? 'translateX(0)' : 'translateX(-2px)', transition: `opacity ${animation.fast}, transform ${animation.fast}` }}>→</span>
        )}
      </div>
    </div>
  )
}

// Reporting distribution — merges the former Overdue / Submissions / Review cards into one
// part-to-whole panel: Reviewed + Needs Review + Overdue = Expected, a status row over a single
// segmented bar. Team Avg Score stays its own KPI card (an outcome, not part of this funnel).
function ReportingPanel({
  expected, submitted, needsReview, overdue, late, contributors, members, onReview, onOverdue,
}: {
  expected: number; submitted: number; needsReview: number; overdue: number; late: number
  contributors: number; members: number; onReview: () => void; onOverdue: () => void
}) {
  const hasDue = expected > 0
  const reviewed = Math.max(0, submitted - needsReview)
  const pct = (n: number) => (hasDue ? Math.round((n / expected) * 100) : null)
  const segs = [
    { key: 'reviewed', val: reviewed, color: colors.green },
    { key: 'needs', val: needsReview, color: colors.warnMuted },
    { key: 'overdue', val: overdue, color: colors.dangerMuted },
  ].filter((s) => s.val > 0)

  return (
    <div style={{
      background: colors.surface, border: `1px solid ${colors.borderStrong}`, borderRadius: radius.md,
      padding: '18px 22px 20px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: colors.text3 }}>
          <Icon name="reports" size={13} color={colors.text3} />
          Reporting this period
        </span>
        <span className="font-numeric" style={{ fontSize: '12px', color: colors.text3 }}>
          {hasDue ? `${expected} expected` : 'None due'}
        </span>
      </div>

      {hasDue ? (
        <>
          <div style={{ display: 'flex', gap: '4px' }}>
            <ReportStatCell dot={colors.green} label="Reviewed" count={reviewed} pct={pct(reviewed)} color={colors.text} />
            <ReportStatCell dot={colors.warnMuted} label="Needs review" count={needsReview} pct={pct(needsReview)} color={needsReview > 0 ? colors.warnMuted : colors.text3} onClick={needsReview > 0 ? onReview : undefined} />
            <ReportStatCell dot={colors.dangerMuted} label="Overdue" count={overdue} pct={pct(overdue)} color={overdue > 0 ? colors.dangerMuted : colors.text3} onClick={overdue > 0 ? onOverdue : undefined} />
          </div>

          {/* Single part-to-whole bar: Reviewed + Needs Review + Overdue = Expected. Styled after the
              Team Avg Score AreaTrend above — a crisp full-strength line riding a softer fade of the
              same colour — so the two hero visuals on this page read as one family. */}
          <div style={{ marginTop: '20px', height: '34px', background: colors.surface3, borderRadius: radius.sm, display: 'flex', gap: '2px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
            {segs.map((s) => (
              <div key={s.key} style={{
                flex: s.val,
                background: `linear-gradient(180deg, ${s.color}38 0%, ${s.color}00 100%)`,
                borderTop: `2px solid ${s.color}`,
                transition: `flex ${animation.slow} ease`,
              }} />
            ))}
          </div>

          <div style={{ marginTop: '12px', fontSize: '12px', color: colors.text3 }}>
            {contributors} of {members} member{members === 1 ? '' : 's'} submitted{late > 0 ? ` · ${late} late` : ''}
          </div>
        </>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', minHeight: '96px', color: colors.text3, fontSize: '13px' }}>
          No reports due in this period.
        </div>
      )}
    </div>
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

// Dot-label pairs for team row status indicators: a 5px filled circle + lowercase text — reads as
// a live indicator rather than a static badge. Color mapping follows semantic token intent.
const DOT_LABEL_MAP: Record<string, { dot: string; text: string }> = {
  'reviewed':       { dot: colors.green,  text: 'reviewed' },
  'on-track':       { dot: colors.green,  text: 'on track' },
  'active':         { dot: colors.green,  text: 'active' },
  'submitted_late': { dot: colors.green,  text: 'submitted' },
  'needs-review':   { dot: colors.warn,   text: 'needs review' },
  'review':         { dot: colors.warn,   text: 'needs review' },
  'late':           { dot: colors.warn,   text: 'late' },
  'scored':         { dot: colors.text3,  text: 'scored' },
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
      <span style={{ fontSize: '12px', color: colors.text3, fontWeight: 500 }}>{cfg.text}</span>
    </span>
  )
}

const ELLIPSIS: React.CSSProperties = { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }

// Amber attention dot shown between a member's name and date when they're declining or below 6.0.
// 5px, colors.warn, with a subtle glow. No label — the dot is the only signal.
function AttentionDot() {
  return (
    <span
      aria-label="Needs attention"
      title="Declining trend or score below 6.0"
      style={{
        width: '5px', height: '5px', borderRadius: '50%', background: colors.warn,
        boxShadow: `0 0 5px ${colors.warn}`, flexShrink: 0,
      }}
    />
  )
}

// Primary action for the expansion ("Review report"): matches the DS primary button (P3 raised
// neutral) — dark raised surface + white label + hairline border that lifts on hover.
function TintedAction({ label, onClick }: { label: string; onClick: () => void }) {
  const [hover, setHover] = React.useState(false)
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick() }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '6px 12px', borderRadius: radius.md,
        background: hover ? '#262c3a' : colors.surface3,
        border: `1px solid ${hover ? 'rgba(255,255,255,0.22)' : colors.borderHover}`,
        color: colors.text, fontSize: '12px', fontWeight: 600, cursor: 'pointer',
        transition: `background ${animation.fast}, border-color ${animation.fast}`, whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  )
}

// Collapsible Recent Reports row. Collapsed: one compact line (avatar · name · attention dot ·
// date — then status dot-label · score · chevron on the right). Expanded: a panel below, in the
// same wrapper — meta line + action row. Criteria bars and the at-risk note are intentionally
// absent: per-report criterion scores are not in the recentReports payload (see decision log).
// Missed rows are never produced (no missed-report detection exists in this list — flagged/skipped).
function CollapsibleReportRow({
  r, attention, frequency, expanded, onToggle, onOpenReport, onAskWhy,
}: {
  r: any
  attention: boolean
  frequency?: string
  expanded: boolean
  onToggle: () => void
  onOpenReport: () => void
  onAskWhy: () => void
}) {
  const [hover, setHover] = React.useState(false)
  const lifted = expanded || hover
  const date = formatCompactReportDate(r.date)
  const hasDate = !!date && date !== 'No date'
  const status = r.reviewed ? 'reviewed' : 'needs-review'
  const scoreColor = r.score != null ? getScoreColor(r.score) : colors.text3
  const cap = (s?: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '')
  // "KPI name · frequency · date". Frequency is resolved from the project lookup (recentReports has
  // no frequency of its own); omitted when the project has none.
  const metaLine = [r.goalName, cap(frequency), hasDate ? date : null].filter(Boolean).join(' · ')

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        borderRadius: radius.md,
        background: lifted ? colors.surface2 : 'transparent',
        transition: `background ${animation.fast} ease`,
        marginBottom: '2px',
      }}
    >
      {/* Collapsed single line. */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle() } }}
        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', cursor: 'pointer', outline: 'none' }}
      >
        <Avatar name={r.employeeName} src={r.employeeAvatarUrl} size="md" style={{ flexShrink: 0 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: colors.text, ...ELLIPSIS }}>{r.employeeName}</span>
          {attention && <AttentionDot />}
          {hasDate && <span style={{ fontSize: '12px', fontWeight: 400, color: colors.text3, whiteSpace: 'nowrap' }}>· {date}</span>}
        </div>
        <div style={{ flex: 1, minWidth: '8px' }} />
        {/* Status reads the exception, not the rule: only unreviewed rows carry the amber
            "needs review" prompt (an action cue not derivable from the score). Reviewed rows show
            nothing — the colour-banded score already carries the standing — which de-noises the
            column from a wall of repeated labels. */}
        {!r.reviewed && <DotLabel status={status} />}
        {r.score != null && (
          <span className="font-numeric" style={{ display: 'inline-flex', alignItems: 'baseline', gap: '2px', flexShrink: 0 }}>
            <span style={{ fontSize: '15px', fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{r.score.toFixed(1)}</span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: colors.text3 }}>/10</span>
          </span>
        )}
        <Icon
          name="chevronDown"
          size={12}
          color={colors.text3}
          style={{ flexShrink: 0, transition: `transform ${animation.base} ease`, transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </div>

      {/* Expansion — max-height transition. Content aligns past the avatar (pad 12 + avatar 30 + gap 10 = 52). */}
      <div style={{ maxHeight: expanded ? '360px' : '0px', overflow: 'hidden', transition: `max-height ${animation.base} ease` }}>
        <div style={{ padding: '0 14px 12px 52px' }}>
          {metaLine && (
            <div style={{ fontSize: typography.size.xs, color: colors.text3, marginBottom: '10px' }}>{metaLine}</div>
          )}
          {/* Per-criterion breakdown — weakest first, score coloured by band so the soft spots read
              at a glance. */}
          {Array.isArray(r.criteria) && r.criteria.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
              {r.criteria.slice(0, 4).map((c: any) => (
                <span key={c.name} style={{
                  display: 'inline-flex', alignItems: 'baseline', gap: '5px',
                  padding: '3px 9px', borderRadius: '999px', background: colors.surface3,
                  fontSize: '11px', fontWeight: 500, color: colors.text3,
                }}>
                  {c.name}
                  <span className="font-numeric" style={{ fontWeight: 800, color: getScoreColor(c.score) }}>{c.score.toFixed(1)}</span>
                </span>
              ))}
            </div>
          )}
          {/* Coaching note — an actionable line pulled from the report (the weakest criterion's note,
              or the AI summary). The single thing a manager can act on without opening the report. */}
          {r.coachingNote && (
            <div style={{
              display: 'flex', gap: '8px', marginBottom: '12px',
              padding: '8px 10px', borderRadius: radius.md,
              background: colors.surface3, borderLeft: `2px solid ${colors.teal}`,
            }}>
              <Icon name="sparkles" size={13} color={colors.teal} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span style={{
                fontSize: '12px', color: colors.text2, lineHeight: 1.5,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {r.coachingNote}
              </span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <TintedAction label="Review report" onClick={onOpenReport} />
            <Button variant="secondary" size="sm" icon="sparkles" onClick={(e) => { e.stopPropagation(); onAskWhy() }}>Ask why</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Recent Reports list — owns the single-open-at-a-time expansion state and row ordering. Order:
// needs-review (unreviewed) first, then reviewed; each subgroup keeps the payload's date-descending
// order. Missed rows are not produced (see CollapsibleReportRow note).
function RecentReportsList({
  reports, attentionById, frequencyByProject, onOpenReport, onAskWhy,
}: {
  reports: any[]
  attentionById: Map<string, boolean>
  frequencyByProject: Map<string, string>
  onOpenReport: (id: string) => void
  onAskWhy: (r: any) => void
}) {
  const [openId, setOpenId] = React.useState<string | null>(null)
  const ordered = React.useMemo(() => {
    const needsReview = (reports as any[]).filter((r) => !r.reviewed)
    const reviewed = (reports as any[]).filter((r) => r.reviewed)
    // Cap the list at 8 rows — needs-review first, so the highest-priority reports survive the cut.
    // Anything beyond is reachable via the "View all reports" button below the list.
    return [...needsReview, ...reviewed].slice(0, 8)
  }, [reports])

  return (
    <>
      {ordered.map((r) => (
        <CollapsibleReportRow
          key={r.id}
          r={r}
          attention={r.employeeId ? (attentionById.get(r.employeeId) ?? false) : false}
          frequency={r.projectName ? frequencyByProject.get(r.projectName) : undefined}
          expanded={openId === r.id}
          onToggle={() => setOpenId((cur) => (cur === r.id ? null : r.id))}
          onOpenReport={() => onOpenReport(r.id)}
          onAskWhy={() => onAskWhy(r)}
        />
      ))}
    </>
  )
}

// Team row — borderless ledger row (shares the Recent Reports look: transparent at rest, lifts to
// surface-2 on hover) but links straight to the employee detail page on click — no accordion. One
// line: avatar · (amber flag dot) name · "· role" — then status dot-label · score (or NoDataPill) ·
// a muted right chevron signalling navigation. Color is rationed to the score; the amber flag dot is
// the only other saturated mark.
function TeamRow({ e, onOpen }: { e: any; onOpen: () => void }) {
  const [hover, setHover] = React.useState(false)
  const scoreColor = e.score != null ? getScoreColor(e.score) : colors.text3
  const reportCount = e.reportCount ?? 0

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); onOpen() } }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px',
        borderRadius: radius.md, cursor: 'pointer', outline: 'none',
        background: hover ? colors.surface2 : 'transparent',
        transition: `background ${animation.fast} ease`,
        marginBottom: '2px',
      }}
    >
      <Avatar name={e.name} src={e.avatarUrl} size="md" style={{ flexShrink: 0 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
        {e.flagged && <AttentionDot />}
        <span style={{ fontSize: '13px', fontWeight: 600, color: colors.text, ...ELLIPSIS }}>{e.name}</span>
        {e.role && <span style={{ fontSize: '12px', fontWeight: 400, color: colors.text3, ...ELLIPSIS }}>· {e.role}</span>}
      </div>
      <div style={{ flex: 1, minWidth: '8px' }} />
      {/* The right column expresses ONE standing. For scored members the colour-banded score IS the
          standing (getScoreStatus always agrees with the number's colour band), so a separate
          dot-label would just restate the score's colour — we drop it and let the number carry it.
          Unscored members have no score to carry the signal, so they keep the inline dot-label — a
          muted dot + "No data yet" / "Collecting baseline" — with no pill background or border. */}
      {e.score != null ? (
        <>
          <span className="font-numeric" style={{ display: 'inline-flex', alignItems: 'baseline', gap: '2px', flexShrink: 0 }}>
            <span style={{ fontSize: '15px', fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{e.score.toFixed(1)}</span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: colors.text3 }}>/10</span>
          </span>
        </>
      ) : (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', flexShrink: 0 }}>
          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: colors.text3, flexShrink: 0 }} />
          <span style={{ fontSize: '12px', color: colors.text3, fontWeight: 500 }}>
            {reportCount > 0 ? `Collecting baseline · ${reportCount} report${reportCount === 1 ? '' : 's'}` : 'No data yet'}
          </span>
        </span>
      )}
      <Icon name="chevronRight" size={14} color={hover ? colors.text2 : colors.text3} style={{ flexShrink: 0, transition: `color ${animation.fast} ease` }} />
    </div>
  )
}

// Team list — rows arrive pre-sorted by the caller (flagged-first, then score ascending). Each row
// links straight to the employee detail page.
function TeamList({ team, onOpen }: { team: any[]; onOpen: (id: string) => void }) {
  return (
    <>
      {team.map((e) => (
        <TeamRow key={e.id} e={e} onOpen={() => onOpen(e.id)} />
      ))}
    </>
  )
}

export function DashboardView({ teamStats }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  // Filter changes re-render the page on the server (same route, new searchParams), which
  // never triggers loading.tsx — without a pending state the dashboard looks frozen/dead
  // for the whole round-trip. isPending dims the content so the user sees the filter working.
  const [isPending, startTransition] = React.useTransition()

  const paramsString = searchParams.toString()
  const appendParams = React.useCallback((href: string) => {
    if (!paramsString) return href
    return href.includes('?') ? `${href}&${paramsString}` : `${href}?${paramsString}`
  }, [paramsString])

  // ── Ask hand-off ───────────────────────────────────────────────────────
  const startParam = searchParams.get('start')
  const endParam = searchParams.get('end')
  const viewParam = searchParams.get('view')
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
  const recentReports = teamStats?.recentReports || []
  // Team-level cumulative avg-score series → the Team Avg Score card's sparkline.
  const trendScores: number[] = teamStats?.trendScores || []

  // Risk-flag lookup: an employee previously triggered Needs Attention iff they appear in
  // needsAttention, the source of the per-person lowest-criterion reason line.
  const needsAttentionById = React.useMemo(
    () => new Map((needsAttention as any[]).map((e) => [e.id, e])),
    [needsAttention]
  )

  // ── Recent Reports collapsible-row inputs ──────────────────────────────
  // Attention dot: derived from teamPerformance (per-member scoreDirection + score), the only
  // per-member signal in the prop — trendScores is a team-level cumulative series, not per-member,
  // so it can't flag an individual. A member is flagged when declining (scoreDirection 'down', the
  // available proxy for "2+ declining periods") OR their average is below 6.0. See decision log.
  const projects = teamStats?.projects || []
  const attentionByEmployee = React.useMemo(() => {
    const m = new Map<string, boolean>()
    for (const e of teamPerformance as any[]) {
      m.set(e.id, e.scoreDirection === 'down' || (e.score != null && e.score < 6.0))
    }
    return m
  }, [teamPerformance])
  // Frequency for the expansion meta line ("KPI name · frequency · date"): recentReports carries no
  // frequency, but the project list does, so we resolve it by projectName (no new query).
  const frequencyByProject = React.useMemo(() => {
    const m = new Map<string, string>()
    for (const p of projects as any[]) if (p.name && p.frequency) m.set(p.name, p.frequency)
    return m
  }, [projects])
  // "Ask why" pre-fill: reuses the existing goToAsk/buildAskHref deep-link into the Ask bar.
  const askWhyAboutReport = React.useCallback((r: any) => {
    const d = formatCompactReportDate(r.date)
    const on = d && d !== 'No date' ? ` on ${d}` : ''
    goToAsk(`Why did ${r.employeeName}'s score drop${on}?`, { employeeId: r.employeeId })
  }, [goToAsk])

  // ── Card 1: Reports Submitted ──────────────────────────────────────────
  // Source: kpis.submissionRate, the windowed cycle stats (every reporting period due in the
  // selected range, counted once; "submitted" if that period has a report). X of Y = submitted of
  // expected. Member context = distinct contributors in range (kpis.contributorCount).
  const subSubmitted = kpis.submissionRate?.submitted ?? 0
  const subExpected = kpis.submissionRate?.expected ?? 0
  // Member context for the subtitle: how many of the team submitted at least one report in range
  // (contributorCount) out of the total team size.
  const contributorCount = kpis.contributorCount ?? 0
  const totalMembers = teamPerformance.length

  // ── Card 2: Team Avg Score ─────────────────────────────────────────────
  // scoredGoals = goals with ≥1 scored report; KPIs scored = those goals' criteria total. Delta is
  // kpis.teamAvgDelta: current-vs-previous-period avg, null when there's no prior window (All Time)
  // or no change — in which case the trend pill is hidden.
  const teamAvgScore = kpis.teamAvgScore
  const teamAvgDelta = kpis.teamAvgDelta as { value: number; direction: 'up' | 'down' } | null
  const scoredGoals = goals.filter((g: any) => (g.reports ?? 0) > 0)
  const kpisScored = scoredGoals.reduce((a: number, g: any) => a + (g.criteriaCount ?? 0), 0)

  // ── Reporting distribution: Overdue slice ──────────────────────────────
  // Overdue = expected − submitted from the same windowed submissionRate, so the "submitted" and
  // "overdue" segments of the reporting bar can never disagree — they partition the same total.
  const hasDue = subExpected > 0
  const overdue = hasDue ? subExpected - subSubmitted : 0

  // ── Card 4: Review Reports ─────────────────────────────────────────────
  // needsReviewCount = unreviewed reports. lateCount = reports submitted late in the selected
  // window (from the windowed reporting-health stats) — shown as a second meta line.
  const needsReviewCount = kpis.needsReviewCount ?? 0
  const lateCount = kpis.reportingHealth?.late ?? 0

  // ── Team panel ordering ────────────────────────────────────────────────
  // Flag = previously needed attention, declining trend, or missed every due submission. Ordered
  // flagged-first, then score ascending (lowest first, no-score members last) so a manager's eye
  // lands on the problem members immediately.
  const orderedTeam = React.useMemo(() => {
    return (teamPerformance as any[])
      .map((e) => ({
        ...e,
        flagged:
          needsAttentionById.has(e.id) ||
          e.scoreDirection === 'down' ||
          ((e.periodCount ?? 0) > 0 && (e.submittedPeriods ?? 0) === 0),
      }))
      .sort((a, b) => {
        if (a.flagged !== b.flagged) return a.flagged ? -1 : 1
        const as = a.score == null ? Infinity : a.score
        const bs = b.score == null ? Infinity : b.score
        return as - bs
      })
  }, [teamPerformance, needsAttentionById])

  // The team panel previews a reasonable slice (flagged/lowest-score members surface first, so the
  // preview keeps the ones that matter) and expands to the full roster on demand — a large org
  // shouldn't render 30+ rows into the fold by default.
  const TEAM_PREVIEW_COUNT = 8
  const [showAllTeam, setShowAllTeam] = React.useState(false)
  const visibleTeam = showAllTeam ? orderedTeam : orderedTeam.slice(0, TEAM_PREVIEW_COUNT)
  const hasMoreTeam = orderedTeam.length > TEAM_PREVIEW_COUNT

  return (
    <div
      className="animate-fade-up"
      style={{
        padding: '24px', maxWidth: '1180px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '18px',
        opacity: isPending ? 0.55 : 1,
        pointerEvents: isPending ? 'none' : 'auto',
        transition: `opacity ${animation.base} ease`,
      }}
    >
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
            startTransition(() => {
              router.push(`?${params.toString()}`)
            })
          }}
        />
      </div>

      {/* KPI row — Team Avg Score leads as its own card (an outcome); the former Overdue /
          Submissions / Review cards merge into the reporting distribution panel to its right. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2.4fr)', gap: '12px', alignItems: 'stretch' }}>
        <KpiCard
          label="Team Avg Score"
          icon="trendingUp"
          big
          sparkline={teamAvgScore != null && trendScores.length >= 2 ? trendScores : undefined}
          value={teamAvgScore != null ? teamAvgScore.toFixed(1) : <EmptyValue text="No scores yet" />}
          valueColor={teamAvgScore != null ? getScoreColor(teamAvgScore) : colors.text3}
          meta1={teamAvgScore != null && scoredGoals.length > 0
            ? `${scoredGoals.length} KPI${scoredGoals.length === 1 ? '' : 's'} scored · ${kpisScored} criteri${kpisScored === 1 ? 'on' : 'a'}`
            : null}
          meta2={teamAvgScore != null && teamAvgDelta ? <TrendPill value={teamAvgDelta.value} label="vs. last period" /> : null}
          onClick={() => goToAsk(
            teamAvgScore != null
              ? `Why is the team average ${teamAvgScore.toFixed(1)} this cycle?`
              : 'How is the team performing this cycle?'
          )}
        />

        <ReportingPanel
          expected={subExpected}
          submitted={subSubmitted}
          needsReview={needsReviewCount}
          overdue={overdue}
          late={lateCount}
          contributors={contributorCount}
          members={totalMembers}
          onReview={() => goToAsk('Which reports still need my review, and what was flagged in them?')}
          onOverdue={() => goToAsk('Which reports are overdue this cycle, and who is behind?')}
        />
      </div>

      {/* ── Team insight banner — a raised neutral surface (surface-2 + borderStrong); colour is
          rationed to the outline-sparkle mark alone (AI blue), no background wash. The message is a
          rule-based template from live data (teamAvgDelta + the top flagged member), not an LLM
          summary — so it carries no "AI" label. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '14px 18px',
          background: colors.surface2,
          border: `1px solid ${colors.borderStrong}`,
          borderRadius: radius.md,
        }}
      >
        <Icon name="sparkleOutline" size={15} color={colors.ai} style={{ flexShrink: 0 }} />
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
        <Button variant="secondary" size="sm" onClick={() => goToAsk('Give me an overview of team performance.')} style={{ flexShrink: 0 }}>
          Ask a follow-up
        </Button>
      </div>

      {/* ── Content grid: Recent Reports + Team, split 50/50. The former Needs Attention and Team
          cards are merged into a single Team panel. */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'start' }}>
        <Card
          dense
          title="Recent Reports"
          icon="reports"
        >
          {recentReports.length > 0 ? (
            <>
              <RecentReportsList
                reports={recentReports}
                attentionById={attentionByEmployee}
                frequencyByProject={frequencyByProject}
                onOpenReport={(id) => router.push(appendParams(`/reports/${id}`))}
                onAskWhy={askWhyAboutReport}
              />
              <ShowAllButton label="View all reports" onClick={() => router.push(appendParams('/reports'))} />
            </>
          ) : (
            <div style={{ padding: '8px 0', color: colors.text3, fontSize: '13px' }}>No reports yet.</div>
          )}
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Merged Team panel — every member state in one list: score, status, and an amber flag
              dot for anyone declining / missing / previously flagged. Flagged-first, lowest-score
              first, so problem members surface at the top. */}
          <Card
            dense
            title="Team"
            icon="people"
          >
            {orderedTeam.length > 0 ? (
              <>
                <TeamList
                  team={visibleTeam}
                  onOpen={(id) => router.push(appendParams(`/employees/${id}`))}
                />
                {hasMoreTeam && (
                  <ShowAllButton
                    label={showAllTeam ? 'Show less' : `Show all ${orderedTeam.length} members`}
                    onClick={() => setShowAllTeam((v) => !v)}
                  />
                )}
              </>
            ) : (
              <div style={{ padding: '4px 0', color: colors.text3, fontSize: '13px' }}>No team members to show.</div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

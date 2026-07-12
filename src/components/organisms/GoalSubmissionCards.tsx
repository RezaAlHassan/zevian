'use client'

import React, { useState } from 'react'
import { colors, radius, animation, badgeTones } from '@/design-system'
import { Icon } from '@/components/atoms'
import { ApproveLeaveModal } from './ApproveLeaveModal'
import type { GoalSubmissionState } from '@/utils/goalSubmissionState'
import { getGoalSection } from '@/utils/goalSubmissionState'

const fmtShort = (d: Date) =>
  d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

const fmtDayDate = (d: Date) =>
  d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

const fmtFreq = (f: string) =>
  ({ daily: 'Daily', weekly: 'Weekly', biweekly: 'Biweekly', 'bi-weekly': 'Biweekly', monthly: 'Monthly' } as Record<string, string>)[
    f?.toLowerCase()
  ] ?? 'Weekly'

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ label, count, color }: { label: string; count: number; color: string }) {
  // Badge tone follows the section color (light fill + darker same-hue number, rounded square) —
  // the canonical count-badge look shared with the Chip atom.
  const tone = color === colors.warn
    ? badgeTones.warn
    : (color === colors.danger || color === colors.dangerMuted) ? badgeTones.danger : badgeTones.neutral
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '2px 2px 6px',
      }}
    >
      <span
        style={{
          fontSize: '10px',
          fontWeight: 800,
          color,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
        }}
      >
        {label}
      </span>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '16px',
          fontSize: '10px',
          fontWeight: 800,
          color: tone.text,
          background: tone.bg,
          borderRadius: radius.sm,
          padding: '1px 6px',
          lineHeight: 1.6,
        }}
      >
        {count}
      </span>
    </div>
  )
}

// ── Individual goal row ────────────────────────────────────────────────────────
// Borderless ledger row mirroring the dashboard Recent Reports accordion: a status dot + goal on the
// left, a status label on the right.
//
// "Needs attention" rows are stripped to the three signals a manager scans for: which goal missed,
// when the most recent miss was, and the one action to take (Approve Leave). No project name,
// frequency, running total, or per-date list — those read as data noise here.
//
// Due-today / upcoming rows keep the goal · project · frequency ledger layout, since the due date is
// the point of those sections.

interface GoalRowProps {
  state: GoalSubmissionState
  section: 'needs_attention' | 'due_today' | 'upcoming'
  viewMode: 'employee' | 'manager'
  onApproveLeave?: (state: GoalSubmissionState) => void
}

function GoalRow({ state, section, viewMode, onApproveLeave }: GoalRowProps) {
  const [hover, setHover] = useState(false)

  // ── Needs attention: goal + most-recent miss + one action ──
  if (section === 'needs_attention') {
    const latePeriods = state.latePeriods ?? []
    // latePeriods is sorted oldest → newest, so the last entry is the most recent miss.
    const lastMissed = latePeriods.length > 0 ? latePeriods[latePeriods.length - 1] : state.oldestLateDate

    return (
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '9px 10px',
          borderRadius: radius.md,
          background: hover ? colors.surface2 : 'transparent',
          transition: `background ${animation.fast} ease`,
          marginBottom: '2px',
        }}
      >
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: colors.danger, flexShrink: 0 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {state.goalName}
          </span>
          {lastMissed && (
            <span style={{ fontSize: '11px', color: colors.text3, whiteSpace: 'nowrap' }}>
              Last missed {fmtShort(lastMissed)}
            </span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: '8px' }} />
        {viewMode === 'manager' && (
          <button
            onClick={(e) => { e.stopPropagation(); onApproveLeave?.(state) }}
            style={{
              background: 'none',
              border: `1px solid ${colors.border}`,
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 700,
              color: colors.text2,
              padding: '5px 12px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            Approve Leave
          </button>
        )}
      </div>
    )
  }

  // ── Due today / upcoming: goal · project · frequency ledger row ──
  // Due-today is time-sensitive but not an error → amber. Blue stays reserved for
  // actions / numbers / graphs, so it's kept out of these status marks.
  const dotColor = section === 'due_today' ? colors.warn : colors.text3
  const rightText = section === 'due_today'
    ? 'Due today'
    : state.nextDueDate
      ? `Due ${fmtDayDate(state.nextDueDate)}`
      : ''

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '9px 10px',
        borderRadius: radius.md,
        background: hover ? colors.surface2 : 'transparent',
        transition: `background ${animation.fast} ease`,
        marginBottom: '2px',
      }}
    >
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: colors.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {state.goalName}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
          <span style={{ fontSize: '11px', color: colors.text3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {state.projectName}
          </span>
          <span style={{ fontSize: '10px', fontWeight: 700, color: colors.text3, background: colors.surface3, padding: '1px 5px', borderRadius: '4px', flexShrink: 0 }}>
            {fmtFreq(state.frequency)}
          </span>
        </span>
      </div>
      <div style={{ flex: 1, minWidth: '8px' }} />
      {rightText && (
        <span style={{ fontSize: '11px', fontWeight: section === 'upcoming' ? 700 : 800, color: dotColor, whiteSpace: 'nowrap', flexShrink: 0 }}>
          {rightText}
        </span>
      )}
    </div>
  )
}

// ── Collapsible upcoming section ─────────────────────────────────────────────

function UpcomingSection({
  goals,
  viewMode,
  collapseByDefault,
}: {
  goals: GoalSubmissionState[]
  viewMode: 'employee' | 'manager'
  collapseByDefault: boolean
}) {
  const [open, setOpen] = useState(!collapseByDefault)

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <SectionHeader label="Upcoming" count={goals.length} color={colors.text3} />
        <div
          style={{
            transform: `rotate(${open ? 180 : 0}deg)`,
            transition: `transform ${animation.fast} ease`,
            display: 'flex',
            alignItems: 'center',
            marginTop: '-2px',
          }}
        >
          <Icon name="chevronDown" size={12} color={colors.text3} />
        </div>
      </button>

      {open && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {goals.map(g => (
            <GoalRow
              key={g.goalId}
              state={g}
              section="upcoming"
              viewMode={viewMode}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

interface GoalSubmissionCardsProps {
  goalStates: GoalSubmissionState[]
  allowLateSubmissions: boolean
  viewMode: 'employee' | 'manager'
  employeeId?: string
  employeeName?: string
}

export function GoalSubmissionCards({
  goalStates,
  viewMode,
  employeeId,
  employeeName,
}: GoalSubmissionCardsProps) {
  const [leaveGoal, setLeaveGoal] = useState<GoalSubmissionState | null>(null)

  const attentionGoals = goalStates.filter(g => getGoalSection(g) === 'needs_attention')
  const dueTodayGoals = goalStates.filter(g => getGoalSection(g) === 'due_today')
  const upcomingGoals = goalStates.filter(g => getGoalSection(g) === 'upcoming')
  const hasActionable = attentionGoals.length > 0 || dueTodayGoals.length > 0

  if (goalStates.length === 0) {
    return (
      <div
        style={{
          padding: '24px 16px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: `${colors.green}15`,
            color: colors.green,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="check" size={18} />
        </div>
        <div style={{ fontSize: '12px', fontWeight: 700, color: colors.text }}>
          You&apos;re all caught up
        </div>
        <div style={{ fontSize: '11px', color: colors.text3 }}>No reports due.</div>
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {attentionGoals.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <SectionHeader label="Needs Attention" count={attentionGoals.length} color={colors.dangerMuted} />
            {attentionGoals.map(g => (
              <GoalRow
                key={g.goalId}
                state={g}
                section="needs_attention"
                viewMode={viewMode}
                onApproveLeave={setLeaveGoal}
              />
            ))}
          </div>
        )}

        {dueTodayGoals.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <SectionHeader label="Due Today" count={dueTodayGoals.length} color={colors.warn} />
            {dueTodayGoals.map(g => (
              <GoalRow
                key={g.goalId}
                state={g}
                section="due_today"
                viewMode={viewMode}
              />
            ))}
          </div>
        )}

        {upcomingGoals.length > 0 && (
          <UpcomingSection
            goals={upcomingGoals}
            viewMode={viewMode}
            collapseByDefault={hasActionable}
          />
        )}
      </div>

      {viewMode === 'manager' && employeeId && (
        <ApproveLeaveModal
          isOpen={!!leaveGoal}
          onClose={() => setLeaveGoal(null)}
          employeeId={employeeId}
          employeeName={employeeName ?? ''}
        />
      )}
    </>
  )
}

'use client'

import React, { useState } from 'react'
import { colors, radius, animation } from '@/design-system'
import { Icon } from '@/components/atoms'
import { ApproveLeaveModal } from './ApproveLeaveModal'
import type { GoalSubmissionState } from '@/utils/goalSubmissionState'
import { getGoalSection } from '@/utils/goalSubmissionState'

const fmtShort = (d: Date) =>
  d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

const fmtLong = (d: Date) =>
  d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

const fmtDayDate = (d: Date) =>
  d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

const fmtFreq = (f: string) =>
  ({ daily: 'Daily', weekly: 'Weekly', biweekly: 'Biweekly', 'bi-weekly': 'Biweekly', monthly: 'Monthly' } as Record<string, string>)[
    f?.toLowerCase()
  ] ?? 'Weekly'

// ── Late Reports Modal ────────────────────────────────────────────────────────

function LateReportsModal({
  state,
  isOpen,
  onClose,
}: {
  state: GoalSubmissionState | null
  isOpen: boolean
  onClose: () => void
}) {
  if (!isOpen || !state) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: radius.xl,
          width: '100%', maxWidth: '380px',
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: colors.text, lineHeight: 1.3 }}>{state.goalName}</div>
            <div style={{ fontSize: '12px', color: colors.text3, marginTop: '3px' }}>{state.projectName}</div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.text3, padding: '2px', flexShrink: 0 }}
          >
            <Icon name="x" size={15} />
          </button>
        </div>

        {/* Date list */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '340px', overflowY: 'auto' }}>
          <div style={{ fontSize: '10.5px', fontWeight: 800, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
            {state.lateCount} missed {state.lateCount === 1 ? 'report' : 'reports'}
          </div>
          {state.latePeriods.map((date, i) => (
            <div
              key={i}
              style={{
                padding: '10px 14px',
                background: colors.surface2,
                border: `1px solid ${colors.border}`,
                borderRadius: radius.lg,
                fontSize: '13px',
                color: colors.text2,
                fontWeight: 500,
              }}
            >
              {fmtLong(date)}
            </div>
          ))}

          {state.isDueToday && state.nextDueDate && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '6px 0 2px' }}>
                <div style={{ flex: 1, height: '1px', background: colors.border }} />
                <span style={{
                  fontSize: '10px', fontWeight: 800, color: colors.accent,
                  textTransform: 'uppercase', letterSpacing: '0.07em',
                }}>
                  Due Today
                </span>
                <div style={{ flex: 1, height: '1px', background: colors.border }} />
              </div>
              <div
                style={{
                  padding: '10px 14px',
                  background: `${colors.accent}10`,
                  border: `1px solid ${colors.accent}35`,
                  borderRadius: radius.lg,
                  fontSize: '13px',
                  color: colors.text2,
                  fontWeight: 500,
                }}
              >
                {fmtLong(state.nextDueDate)}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '2px 0 6px',
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
          fontSize: '10px',
          fontWeight: 800,
          color: '#fff',
          background: color,
          borderRadius: '10px',
          padding: '1px 7px',
          lineHeight: 1.6,
        }}
      >
        {count}
      </span>
    </div>
  )
}

// ── Individual goal card ──────────────────────────────────────────────────────

interface GoalCardProps {
  state: GoalSubmissionState
  section: 'needs_attention' | 'due_today' | 'upcoming'
  viewMode: 'employee' | 'manager'
  onShowLateReports?: (state: GoalSubmissionState) => void
  onApproveLeave?: (state: GoalSubmissionState) => void
}

function GoalCard({
  state,
  section,
  viewMode,
  onShowLateReports,
  onApproveLeave,
}: GoalCardProps) {
  const borderColor =
    section === 'needs_attention'
      ? colors.danger
      : section === 'due_today'
        ? colors.accent
        : colors.border

  return (
    <div
      style={{
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderLeft: `3px solid ${borderColor}`,
        borderRadius: radius.lg,
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}
    >
      {/* Goal name */}
      <div style={{ fontSize: '13px', fontWeight: 700, color: colors.text, lineHeight: 1.3 }}>
        {state.goalName}
      </div>

      {/* Project + status row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
          <span
            style={{
              fontSize: '11px',
              color: colors.text3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {state.projectName}
          </span>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: colors.text3,
              background: colors.surface3,
              padding: '1px 5px',
              borderRadius: '4px',
              flexShrink: 0,
            }}
          >
            {fmtFreq(state.frequency)}
          </span>
        </div>

        {section === 'needs_attention' && (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              color: colors.danger,
              flexShrink: 0,
            }}
          >
            {state.lateCount} late {state.lateCount === 1 ? 'report' : 'reports'}
          </span>
        )}
        {section === 'due_today' && (
          <span style={{ fontSize: '11px', fontWeight: 800, color: colors.accent, flexShrink: 0 }}>
            Due Today
          </span>
        )}
        {section === 'upcoming' && state.nextDueDate && (
          <span style={{ fontSize: '11px', fontWeight: 700, color: colors.text3, flexShrink: 0 }}>
            Due {fmtDayDate(state.nextDueDate)}
          </span>
        )}
      </div>

      {/* Oldest late date */}
      {section === 'needs_attention' && state.oldestLateDate && (
        <div style={{ fontSize: '11px', color: colors.text3 }}>
          Oldest: {fmtShort(state.oldestLateDate)}
        </div>
      )}

      {/* Action row */}
      {section === 'needs_attention' && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
          {viewMode === 'employee' ? (
            <button
              onClick={() => onShowLateReports?.(state)}
              style={{
                background: 'none',
                border: `1px solid ${colors.danger}40`,
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 700,
                color: colors.danger,
                padding: '4px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <Icon name="fileText" size={11} />
              View late reports
            </button>
          ) : (
            <button
              onClick={() => onApproveLeave?.(state)}
              style={{
                background: 'none',
                border: `1px solid ${colors.border}`,
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '11.5px',
                fontWeight: 700,
                color: colors.text2,
                padding: '4px 10px',
              }}
            >
              Approve Leave
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Collapsible upcoming section ─────────────────────────────────────────────

function UpcomingSection({
  goals,
  viewMode,
  collapseByDefault,
  onShowLateReports,
  onApproveLeave,
}: {
  goals: GoalSubmissionState[]
  viewMode: 'employee' | 'manager'
  collapseByDefault: boolean
  onShowLateReports?: (state: GoalSubmissionState) => void
  onApproveLeave?: (state: GoalSubmissionState) => void
}) {
  const [open, setOpen] = useState(!collapseByDefault)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {goals.map(g => (
            <GoalCard
              key={g.goalId}
              state={g}
              section="upcoming"
              viewMode={viewMode}
              onShowLateReports={onShowLateReports}
              onApproveLeave={onApproveLeave}
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
  const [lateReportsGoal, setLateReportsGoal] = useState<GoalSubmissionState | null>(null)

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
        <div style={{ fontSize: '12.5px', fontWeight: 700, color: colors.text }}>
          You&apos;re all caught up
        </div>
        <div style={{ fontSize: '11.5px', color: colors.text3 }}>No reports due.</div>
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {attentionGoals.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <SectionHeader label="Needs Attention" count={attentionGoals.length} color={colors.danger} />
            {attentionGoals.map(g => (
              <GoalCard
                key={g.goalId}
                state={g}
                section="needs_attention"
                viewMode={viewMode}
                onShowLateReports={setLateReportsGoal}
                onApproveLeave={setLeaveGoal}
              />
            ))}
          </div>
        )}

        {dueTodayGoals.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <SectionHeader label="Due Today" count={dueTodayGoals.length} color={colors.accent} />
            {dueTodayGoals.map(g => (
              <GoalCard
                key={g.goalId}
                state={g}
                section="due_today"
                viewMode={viewMode}
                onShowLateReports={setLateReportsGoal}
                onApproveLeave={setLeaveGoal}
              />
            ))}
          </div>
        )}

        {upcomingGoals.length > 0 && (
          <UpcomingSection
            goals={upcomingGoals}
            viewMode={viewMode}
            collapseByDefault={hasActionable}
            onShowLateReports={setLateReportsGoal}
            onApproveLeave={setLeaveGoal}
          />
        )}
      </div>

      {viewMode === 'employee' && (
        <LateReportsModal
          state={lateReportsGoal}
          isOpen={!!lateReportsGoal}
          onClose={() => setLateReportsGoal(null)}
        />
      )}

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

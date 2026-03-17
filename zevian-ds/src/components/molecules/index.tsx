/**
 * MOLECULES — composed from atoms.
 * Each molecule is a self-contained UI pattern used in 2+ places.
 */

import React from 'react';
import { Score } from '../atoms/Score';
import { StatusPill, StatusVariant } from '../atoms/StatusPill';
import { Chip } from '../atoms/Chip';
import { AvatarStack, Avatar } from '../atoms/Avatar';
import { colors, typography, radius, animation, getScoreColor, getScoreBarColor } from '../../design/tokens';

// ─────────────────────────────────────────────
// ProjectCard (grid view card)
// ─────────────────────────────────────────────
interface ProjectCardProps {
  name: string;
  category: string;
  emoji: string;
  stripColor: string;   // CSS gradient or color for top strip
  status: StatusVariant;
  frequency: string;
  assignees: string[];   // array of names
  avgScore: number | null;
  reportCount: number;
  goalCount: number;
  lastReport: string;
  onClick?: () => void;
  onEdit?: () => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  name, category, emoji, stripColor, status, frequency,
  assignees, avgScore, reportCount, goalCount, lastReport,
  onClick, onEdit,
}) => {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: colors.surface,
        border: `1px solid ${hovered ? colors.borderHover : colors.border}`,
        borderRadius: radius['2xl'],
        overflow: 'hidden',
        cursor: 'pointer',
        transition: `all ${animation.base}`,
        transform: hovered ? 'translateY(-1px)' : 'none',
        boxShadow: hovered ? '0 8px 24px rgba(0,0,0,0.3)' : 'none',
      }}
    >
      {/* Color strip */}
      <div style={{ height: '3px', background: stripColor }} />

      <div style={{ padding: '18px' }}>
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: 'rgba(91,127,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px',
          }}>
            {emoji}
          </div>
          {/* Hover actions */}
          <div style={{ display: 'flex', gap: '4px', opacity: hovered ? 1 : 0, transition: `opacity ${animation.fast}` }}>
            {onEdit && (
              <button
                onClick={e => { e.stopPropagation(); onEdit(); }}
                style={{
                  width: '28px', height: '28px', borderRadius: radius.sm,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: colors.surface2, border: `1px solid ${colors.border}`,
                  cursor: 'pointer', color: colors.text3,
                }}
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M11 2l3 3-8 8H3v-3L11 2z" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div style={{ fontFamily: typography.fonts.display, fontSize: '15px', fontWeight: 700, color: colors.text, letterSpacing: '-0.2px', marginBottom: '4px' }}>
          {name}
        </div>
        <div style={{ fontSize: '11.5px', color: colors.text3, marginBottom: '12px' }}>
          {category} · {frequency}
        </div>

        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <StatusPill status={status} />
          <AvatarStack names={assignees} max={3} size="sm" />
        </div>

        {/* Stats grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: '8px', paddingTop: '12px',
          borderTop: `1px solid ${colors.border}`,
        }}>
          <div>
            <div style={{ fontSize: '10.5px', color: colors.text3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>Avg Score</div>
            <Score value={avgScore} size="sm" showBar barHeight="4px" />
          </div>
          <div>
            <div style={{ fontSize: '10.5px', color: colors.text3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>Reports</div>
            <div style={{ fontFamily: typography.fonts.mono, fontSize: '13px', color: colors.text, fontWeight: 600 }}>{reportCount}</div>
          </div>
          <div>
            <div style={{ fontSize: '10.5px', color: colors.text3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>Goals</div>
            <div style={{ fontFamily: typography.fonts.mono, fontSize: '13px', color: colors.text2 }}>{goalCount} active</div>
          </div>
          <div>
            <div style={{ fontSize: '10.5px', color: colors.text3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '3px' }}>Last Report</div>
            <div style={{ fontFamily: typography.fonts.mono, fontSize: '13px', color: colors.text2 }}>{lastReport}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// GoalRow (table row for goals list)
// ─────────────────────────────────────────────
interface GoalRowProps {
  name: string;
  projectName: string;
  projectEmoji: string;
  status: StatusVariant;
  frequency: string;
  criteria: Array<{ name: string; weight: number; color: string }>;
  assignees: string[];
  avgScore: number | null;
  reportCount: number;
  dueDate: string;
  dueDateColor?: string;
  onClick?: () => void;
}

export const GoalRow: React.FC<GoalRowProps> = ({
  name, projectName, projectEmoji, status, frequency,
  criteria, assignees, avgScore, reportCount, dueDate, dueDateColor,
  onClick,
}) => {
  const [hovered, setHovered] = React.useState(false);

  return (
    <tr
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: hovered ? colors.surface2 : 'transparent', cursor: 'pointer', transition: `background ${animation.fast}` }}
    >
      <td style={{ padding: '13px 14px', borderBottom: `1px solid ${colors.border}` }}>
        <div style={{ fontWeight: 600, fontSize: '13.5px', color: colors.text, marginBottom: '2px' }}>{name}</div>
        <div style={{ fontSize: '11.5px', color: colors.text3 }}>{frequency} · {reportCount} reports</div>
      </td>
      <td style={{ padding: '13px 14px', borderBottom: `1px solid ${colors.border}` }}>
        <Chip>{projectEmoji} {projectName}</Chip>
      </td>
      <td style={{ padding: '13px 14px', borderBottom: `1px solid ${colors.border}` }}>
        <StatusPill status={status} />
      </td>
      <td style={{ padding: '13px 14px', borderBottom: `1px solid ${colors.border}` }}>
        <CriteriaBarGroup criteria={criteria} />
      </td>
      <td style={{ padding: '13px 14px', borderBottom: `1px solid ${colors.border}` }}>
        <AvatarStack names={assignees} max={3} size="sm" />
      </td>
      <td style={{ padding: '13px 14px', borderBottom: `1px solid ${colors.border}` }}>
        <Score value={avgScore} size="sm" showBar barWidth="60px" />
      </td>
      <td style={{ padding: '13px 14px', borderBottom: `1px solid ${colors.border}`, fontFamily: typography.fonts.mono, fontSize: '12.5px', color: colors.text2 }}>
        {reportCount}
      </td>
      <td style={{ padding: '13px 14px', borderBottom: `1px solid ${colors.border}`, fontSize: '12px', color: dueDateColor ?? colors.text3 }}>
        {dueDate}
      </td>
      <td style={{ padding: '13px 14px', borderBottom: `1px solid ${colors.border}` }}>
        <button style={{
          padding: '6px 12px', borderRadius: radius.md,
          background: colors.surface2, border: `1px solid ${colors.border}`,
          fontSize: '12px', fontWeight: 600, color: colors.text2,
          cursor: 'pointer', fontFamily: typography.fonts.body,
        }}>
          View →
        </button>
      </td>
    </tr>
  );
};

// ─────────────────────────────────────────────
// CriteriaBarGroup (stacked mini bars in table)
// ─────────────────────────────────────────────
interface CriteriaBarGroupProps {
  criteria: Array<{ name: string; weight: number; color: string }>;
}

export const CriteriaBarGroup: React.FC<CriteriaBarGroupProps> = ({ criteria }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '140px' }}>
    {criteria.map((c, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '10.5px', color: colors.text3, width: '60px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {c.name}
        </span>
        <div style={{ flex: 1, height: '3px', background: colors.surface3, borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${c.weight}%`, background: c.color, borderRadius: '2px' }} />
        </div>
        <span style={{ fontSize: '10px', fontFamily: typography.fonts.mono, color: colors.text3, width: '28px', textAlign: 'right' }}>
          {c.weight}%
        </span>
      </div>
    ))}
  </div>
);

// ─────────────────────────────────────────────
// ActivityFeed
// ─────────────────────────────────────────────
interface ActivityItem {
  text: React.ReactNode;
  time: string;
  dotColor?: string;
}

interface ActivityFeedProps {
  items: ActivityItem[];
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ items }) => (
  <div style={{ padding: '12px 16px' }}>
    {items.map((item, i) => (
      <div key={i} style={{ display: 'flex', gap: '10px', padding: '10px 0', borderBottom: i < items.length - 1 ? `1px solid ${colors.border}` : 'none' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '3px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.dotColor ?? colors.accent, flexShrink: 0 }} />
          {i < items.length - 1 && <div style={{ width: '1px', flex: 1, background: colors.border, marginTop: '4px' }} />}
        </div>
        <div style={{ flex: 1, fontSize: '12.5px', color: colors.text2, lineHeight: '1.55' }}>{item.text}</div>
        <div style={{ fontSize: '11px', color: colors.text3, whiteSpace: 'nowrap', paddingTop: '2px' }}>{item.time}</div>
      </div>
    ))}
  </div>
);

// ─────────────────────────────────────────────
// InfoCard (sidebar key-value pairs)
// ─────────────────────────────────────────────
interface InfoRow {
  label: React.ReactNode;
  value: React.ReactNode;
}

interface InfoCardProps {
  title: string;
  rows: InfoRow[];
  footer?: React.ReactNode;
}

export const InfoCard: React.FC<InfoCardProps> = ({ title, rows, footer }) => (
  <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '12px', overflow: 'hidden' }}>
    <div style={{ padding: '12px 16px', borderBottom: `1px solid ${colors.border}`, fontSize: '11px', fontWeight: 700, color: colors.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {title}
    </div>
    {rows.map((row, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: i < rows.length - 1 ? `1px solid ${colors.border}` : 'none' }}>
        <span style={{ fontSize: '12.5px', color: colors.text3 }}>{row.label}</span>
        <span style={{ fontSize: '12.5px', fontWeight: 500, color: colors.text2 }}>{row.value}</span>
      </div>
    ))}
    {footer && <div style={{ padding: '12px 16px' }}>{footer}</div>}
  </div>
);

// ─────────────────────────────────────────────
// AIBanner (top of dashboard / pages)
// ─────────────────────────────────────────────
interface AIBannerProps {
  text: React.ReactNode;
  onAction?: () => void;
  actionLabel?: string;
}

export const AIBanner: React.FC<AIBannerProps> = ({ text, onAction, actionLabel = 'View Insights' }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '16px',
    padding: '14px 20px',
    background: 'linear-gradient(90deg, rgba(91,127,255,0.08), rgba(0,212,170,0.05))',
    border: '1px solid rgba(91,127,255,0.20)',
    borderRadius: '12px',
    marginBottom: '24px',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(91,127,255,0.18)', border: '1px solid rgba(91,127,255,0.30)', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: 600, color: colors.accent, whiteSpace: 'nowrap' }}>
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M8 1l1 3h3l-2.5 2 1 3L8 7.5 5.5 9l1-3L4 4h3z" />
      </svg>
      Zevian AI
    </div>
    <div style={{ fontSize: '13px', color: colors.text2, flex: 1 }}>{text}</div>
    {onAction && (
      <button onClick={onAction} style={{ padding: '7px 16px', background: colors.accent, border: 'none', borderRadius: '7px', fontSize: '12.5px', fontWeight: 600, color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 0 20px rgba(91,127,255,0.25)', fontFamily: typography.fonts.body }}>
        {actionLabel}
      </button>
    )}
  </div>
);

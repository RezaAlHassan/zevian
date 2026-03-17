/**
 * StatusPill — colored pill with a pulsing dot indicator.
 *
 * ATOM — no dependencies on other Zevian components.
 *
 * Usage:
 *   <StatusPill status="on-track" />
 *   <StatusPill status="at-risk" />
 *   <StatusPill status="review" label="Needs Review" />
 *   <StatusPill status="no-reports" />
 */

import React from 'react';
import { colors, typography } from '../../design/tokens';

export type StatusVariant = 'on-track' | 'at-risk' | 'review' | 'overdue' | 'no-reports';

interface StatusConfig {
  bg:       string;
  text:     string;
  dot:      string;
  dotGlow?: string;
  label:    string;
}

const STATUS_MAP: Record<StatusVariant, StatusConfig> = {
  'on-track':   { bg: colors.greenGlow,  text: colors.green,  dot: colors.green,  dotGlow: `0 0 5px ${colors.green}`,  label: 'On Track'      },
  'at-risk':    { bg: colors.dangerGlow, text: colors.danger, dot: colors.danger, label: 'At Risk'       },
  'review':     { bg: colors.warnGlow,   text: colors.warn,   dot: colors.warn,   label: 'Needs Review'  },
  'overdue':    { bg: colors.dangerGlow, text: colors.danger, dot: colors.danger, label: 'Overdue'       },
  'no-reports': { bg: colors.surface3,   text: colors.text3,  dot: colors.text3,  label: 'No Reports'    },
};

interface StatusPillProps {
  status:     StatusVariant;
  label?:     string;   // override default label
  className?: string;
  style?:     React.CSSProperties;
}

export const StatusPill: React.FC<StatusPillProps> = ({
  status,
  label,
  className,
  style,
}) => {
  const cfg = STATUS_MAP[status];
  const displayLabel = label ?? cfg.label;

  return (
    <span
      className={className}
      style={{
        display:      'inline-flex',
        alignItems:   'center',
        gap:          '5px',
        fontSize:     '11px',
        fontWeight:   typography.weight.semibold,
        padding:      '3px 9px',
        borderRadius: '20px',
        background:   cfg.bg,
        color:        cfg.text,
        whiteSpace:   'nowrap',
        ...style,
      }}
    >
      <span
        style={{
          width:        '5px',
          height:       '5px',
          borderRadius: '50%',
          flexShrink:   0,
          background:   cfg.dot,
          boxShadow:    cfg.dotGlow,
        }}
      />
      {displayLabel}
    </span>
  );
};

export default StatusPill;

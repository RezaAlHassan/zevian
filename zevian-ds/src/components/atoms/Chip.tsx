/**
 * Chip — small tag/badge for categories, frequencies, counts.
 *
 * ATOM — no dependencies on other Zevian components.
 *
 * Usage:
 *   <Chip>Engineering</Chip>
 *   <Chip variant="blue">Weekly</Chip>
 *   <Chip variant="green">4 goals</Chip>
 *   <Chip variant="red">Overdue</Chip>
 */

import React from 'react';
import { colors, typography } from '../../design/tokens';

export type ChipVariant = 'muted' | 'blue' | 'green' | 'amber' | 'red' | 'teal' | 'purple';

interface ChipStyle {
  background: string;
  color:      string;
  border?:    string;
}

const VARIANT_MAP: Record<ChipVariant, ChipStyle> = {
  muted:  { background: colors.surface3,   color: colors.text2 },
  blue:   { background: colors.accentGlow,  color: colors.accent,  border: `1px solid ${colors.accentBorder}` },
  green:  { background: colors.greenGlow,   color: colors.green  },
  amber:  { background: colors.warnGlow,    color: colors.warn   },
  red:    { background: colors.dangerGlow,  color: colors.danger },
  teal:   { background: colors.tealGlow,    color: colors.teal   },
  purple: { background: colors.purpleGlow,  color: colors.purple },
};

interface ChipProps {
  children:   React.ReactNode;
  variant?:   ChipVariant;
  className?: string;
  style?:     React.CSSProperties;
  onClick?:   () => void;
}

export const Chip: React.FC<ChipProps> = ({
  children,
  variant = 'muted',
  className,
  style,
  onClick,
}) => {
  const vs = VARIANT_MAP[variant];

  return (
    <span
      className={className}
      onClick={onClick}
      style={{
        display:      'inline-flex',
        alignItems:   'center',
        gap:          '5px',
        padding:      '3px 10px',
        borderRadius: '20px',
        fontSize:     '11px',
        fontWeight:   typography.weight.semibold,
        whiteSpace:   'nowrap',
        cursor:       onClick ? 'pointer' : 'default',
        ...vs,
        ...style,
      }}
    >
      {children}
    </span>
  );
};

export default Chip;

/**
 * Score — displays a numeric AI score in Syne font with automatic color coding.
 *
 * ATOM — no dependencies on other Zevian components.
 *
 * Usage:
 *   <Score value={8.6} />
 *   <Score value={4.1} size="xl" />
 *   <Score value={null} />          → shows "—"
 *   <Score value={7.2} showBar />   → score + progress bar below
 */

import React from 'react';
import { getScoreColor, getScoreBarColor, colors, typography } from '../../design/tokens';

export type ScoreSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const sizePx: Record<ScoreSize, string> = {
  sm:  '16px',
  md:  '20px',
  lg:  '28px',
  xl:  '36px',
  '2xl': '42px',
};

interface ScoreProps {
  value:     number | null | undefined;
  size?:     ScoreSize;
  showBar?:  boolean;
  barHeight?: '3px' | '4px' | '5px' | '6px';
  barWidth?:  string;   // e.g. '60px', '100%'
  className?: string;
  style?:     React.CSSProperties;
  /** Override automatic color */
  color?:     string;
}

export const Score: React.FC<ScoreProps> = ({
  value,
  size = 'md',
  showBar = false,
  barHeight = '4px',
  barWidth = '100%',
  className,
  style,
  color,
}) => {
  const isEmpty = value === null || value === undefined;
  const displayValue = isEmpty ? '—' : value!.toFixed(1);
  const resolvedColor = color ?? (isEmpty ? colors.text3 : getScoreColor(value!));
  const barColor = isEmpty ? colors.surface3 : getScoreBarColor(value!);
  const barPct = isEmpty ? 0 : Math.min(Math.max(value! * 10, 0), 100);

  return (
    <div className={className} style={style}>
      <span
        style={{
          fontFamily:  typography.fonts.display,
          fontWeight:  typography.weight.bold,
          fontSize:    sizePx[size],
          letterSpacing: '-0.5px',
          lineHeight:  '1',
          color:       resolvedColor,
        }}
      >
        {displayValue}
      </span>

      {showBar && (
        <div
          style={{
            width:        barWidth,
            height:       barHeight,
            background:   colors.surface3,
            borderRadius: '2px',
            overflow:     'hidden',
            marginTop:    '4px',
          }}
        >
          <div
            style={{
              height:       '100%',
              width:        `${barPct}%`,
              background:   barColor,
              borderRadius: '2px',
              transition:   'width 0.8s ease',
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Score;

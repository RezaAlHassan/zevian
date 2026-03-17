/**
 * Card — surface container with optional header, action, and body.
 *
 * ATOM — no dependencies on other Zevian components.
 *
 * Usage:
 *   <Card>...</Card>
 *   <Card title="Recent Reports" icon={<FileIcon />} action={<>View All</>}>...</Card>
 *   <Card title="Criteria" headerChildren={<Chip>3 active</Chip>}>...</Card>
 */

import React from 'react';
import { colors, radius, typography, animation } from '../../design/tokens';

// ─── Card root ────────────────────────────────
interface CardProps {
  children:       React.ReactNode;
  title?:         React.ReactNode;
  icon?:          React.ReactNode;
  action?:        React.ReactNode;         // right-aligned header slot
  headerChildren?: React.ReactNode;        // extra chips/badges in header
  noPadding?:     boolean;
  accentStrip?:   string;                  // CSS gradient/color for top strip
  className?:     string;
  style?:         React.CSSProperties;
  onClick?:       () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  icon,
  action,
  headerChildren,
  noPadding,
  accentStrip,
  className,
  style,
  onClick,
}) => {
  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        background:   colors.surface,
        border:       `1px solid ${colors.border}`,
        borderRadius: radius['2xl'],
        overflow:     'hidden',
        cursor:       onClick ? 'pointer' : 'default',
        transition:   onClick ? `border-color ${animation.base}, transform ${animation.base}` : undefined,
        ...style,
      }}
    >
      {accentStrip && (
        <div style={{ height: '3px', width: '100%', background: accentStrip }} />
      )}

      {title && (
        <div style={{
          padding:       '16px 20px 14px',
          display:       'flex',
          alignItems:    'center',
          gap:           '10px',
          borderBottom:  `1px solid ${colors.border}`,
        }}>
          <div style={{
            fontWeight:  typography.weight.semibold,
            fontSize:    '14px',
            color:       colors.text,
            display:     'flex',
            alignItems:  'center',
            gap:         '8px',
            flex:        1,
          }}>
            {icon && (
              <span style={{ width: '15px', height: '15px', color: colors.accent, display: 'flex' }}>
                {icon}
              </span>
            )}
            {title}
            {headerChildren}
          </div>
          {action && (
            <div style={{
              fontSize:    '12px',
              color:       colors.accent,
              fontWeight:  typography.weight.medium,
              cursor:      'pointer',
              padding:     '4px 8px',
              borderRadius: radius.sm,
              transition:  `background ${animation.fast}`,
            }}>
              {action}
            </div>
          )}
        </div>
      )}

      <div style={noPadding ? undefined : { padding: '20px' }}>
        {children}
      </div>
    </div>
  );
};

// ─── NestedCard (metric cards, criteria cards) ─
interface NestedCardProps {
  children:    React.ReactNode;
  active?:     boolean;
  accentColor?: string;   // top border color when active
  className?:  string;
  style?:      React.CSSProperties;
  onClick?:    () => void;
}

export const NestedCard: React.FC<NestedCardProps> = ({
  children,
  active,
  accentColor,
  className,
  style,
  onClick,
}) => (
  <div
    className={className}
    onClick={onClick}
    style={{
      background:    active ? 'rgba(91,127,255,0.05)' : colors.surface2,
      border:        `1px solid ${active ? colors.accentBorder : colors.border}`,
      borderRadius:  radius.lg,
      padding:       '14px',
      cursor:        onClick ? 'pointer' : 'default',
      transition:    `all ${animation.base}`,
      position:      'relative',
      overflow:      'hidden',
      ...style,
    }}
  >
    {active && accentColor && (
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: '2px', background: accentColor,
      }} />
    )}
    {children}
  </div>
);

export default Card;

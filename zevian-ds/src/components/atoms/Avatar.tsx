/**
 * Avatar — initials avatar with deterministic gradient from name.
 * Also exports AvatarStack for stacked/overlapping groups.
 *
 * ATOM — no dependencies on other Zevian components.
 *
 * Usage:
 *   <Avatar name="Sofia Mercer" />
 *   <Avatar name="James Cole" size="lg" />
 *   <AvatarStack names={['Sofia Mercer','James Cole','Riya Ahmed']} max={3} />
 */

import React from 'react';
import { getAvatarGradient, getInitials, componentTokens } from '../../design/tokens';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface AvatarProps {
  name: string;
  size?: AvatarSize;
  className?: string;
  style?: React.CSSProperties;
  /** Override the gradient */
  gradient?: string;
  onClick?: () => void;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  size = 'md',
  className,
  style,
  gradient,
  onClick,
}) => {
  const sz = componentTokens.avatar.sizes[size];

  return (
    <div
      className={className}
      onClick={onClick}
      title={name}
      style={{
        width: sz.width,
        height: sz.height,
        borderRadius: sz.borderRadius,
        background: gradient ?? getAvatarGradient(name),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: sz.fontSize,
        fontWeight: 700,
        color: '#fff',
        flexShrink: 0,
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        ...style,
      }}
    >
      {getInitials(name)}
    </div>
  );
};

// ─── AvatarStack ─────────────────────────────
interface AvatarStackProps {
  names: string[];
  max?: number;
  size?: AvatarSize;
  className?: string;
}

export const AvatarStack: React.FC<AvatarStackProps> = ({
  names,
  max = 4,
  size = 'sm',
  className,
}) => {
  const sz = componentTokens.avatar.sizes[size];
  const visible = names.slice(0, max);
  const overflow = names.length - max;

  return (
    <div
      className={className}
      style={{ display: 'flex', alignItems: 'center' }}
    >
      {visible.map((name, i) => (
        <Avatar
          key={name + i}
          name={name}
          size={size}
          style={{
            marginLeft: i === 0 ? 0 : componentTokens.avatar.stackOverlap,
            border: componentTokens.avatar.stackBorder,
          }}
        />
      ))}
      {overflow > 0 && (
        <div
          title={`${overflow} more`}
          style={{
            width: sz.width,
            height: sz.height,
            borderRadius: sz.borderRadius,
            background: 'var(--color-surface-3, #1e2330)',
            color: 'var(--color-text-3, #545d73)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: sz.fontSize,
            fontWeight: 700,
            marginLeft: componentTokens.avatar.stackOverlap,
            border: componentTokens.avatar.stackBorder,
            flexShrink: 0,
          }}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
};

export default Avatar;

/**
 * Button — primary interactive element. All variants and sizes.
 *
 * ATOM — no dependencies on other Zevian components.
 *
 * Usage:
 *   <Button>Save Goal</Button>
 *   <Button variant="secondary" size="sm">Cancel</Button>
 *   <Button variant="ghost">Edit</Button>
 *   <Button variant="danger">Delete</Button>
 *   <Button size="icon"><PlusIcon /></Button>
 *   <Button loading>Saving…</Button>
 */

import React from 'react';
import { colors, typography, radius, shadows, animation } from '../../design/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize    = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:   ButtonVariant;
  size?:      ButtonSize;
  loading?:   boolean;
  children:   React.ReactNode;
}

const VARIANT_STYLES: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: colors.accent,
    color:      '#fff',
    boxShadow:  shadows.accentGlow,
    border:     'none',
  },
  secondary: {
    background: colors.surface2,
    color:      colors.text2,
    border:     `1px solid ${colors.border}`,
  },
  ghost: {
    background: 'transparent',
    color:      colors.accent,
    border:     `1px solid ${colors.accentBorder}`,
  },
  danger: {
    background: colors.dangerGlow,
    color:      colors.danger,
    border:     `1px solid rgba(240,68,56,0.20)`,
  },
};

const SIZE_STYLES: Record<ButtonSize, React.CSSProperties> = {
  sm:   { padding: '6px 12px',  fontSize: '12px' },
  md:   { padding: '8px 16px',  fontSize: '13px' },
  lg:   { padding: '10px 20px', fontSize: '14px' },
  icon: { width: '30px', height: '30px', padding: '0', justifyContent: 'center' },
};

export const Button: React.FC<ButtonProps> = ({
  variant  = 'primary',
  size     = 'md',
  loading  = false,
  children,
  disabled,
  style,
  ...rest
}) => {
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      style={{
        display:        'inline-flex',
        alignItems:     'center',
        gap:            '7px',
        borderRadius:   radius.md,
        fontWeight:     typography.weight.semibold,
        cursor:         isDisabled ? 'not-allowed' : 'pointer',
        transition:     `all ${animation.fast}`,
        fontFamily:     typography.fonts.body,
        opacity:        isDisabled ? 0.45 : 1,
        ...VARIANT_STYLES[variant],
        ...SIZE_STYLES[size],
        ...style,
      }}
      {...rest}
    >
      {loading ? (
        <>
          <span style={{
            width: '13px', height: '13px',
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.3)',
            borderTopColor: '#fff',
            animation: 'spin 0.7s linear infinite',
            flexShrink: 0,
          }} />
          {children}
        </>
      ) : children}
    </button>
  );
};

export default Button;

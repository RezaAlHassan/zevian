/**
 * Input / Textarea / Select — form field atoms.
 *
 * ATOM — no dependencies on other Zevian components.
 *
 * Usage:
 *   <Input label="Goal Name" required placeholder="e.g. Improve Code Quality" />
 *   <Textarea label="Instructions" helperText="Be specific and objective." />
 *   <Select label="Project" options={[...]} />
 *   <FormGroup label="Name" required helperText="..."><Input /></FormGroup>
 */

import React from 'react';
import { colors, typography, radius, shadows, animation } from '../../design/tokens';

// ─── Shared field styles ─────────────────────
const baseFieldStyle: React.CSSProperties = {
  width:        '100%',
  padding:      '9px 12px',
  background:   colors.surface2,
  border:       `1px solid ${colors.border}`,
  borderRadius: radius.md,
  fontSize:     '13.5px',
  color:        colors.text,
  fontFamily:   typography.fonts.body,
  outline:      'none',
  transition:   `border-color ${animation.fast}, box-shadow ${animation.fast}`,
};

// ─── FormGroup wrapper ────────────────────────
interface FormGroupProps {
  label?:      string;
  required?:   boolean;
  helperText?: string;
  children:    React.ReactNode;
  style?:      React.CSSProperties;
  className?:  string;
}

export const FormGroup: React.FC<FormGroupProps> = ({
  label,
  required,
  helperText,
  children,
  style,
  className,
}) => (
  <div className={className} style={{ marginBottom: '16px', ...style }}>
    {label && (
      <div style={{
        fontSize:      '12px',
        fontWeight:    typography.weight.semibold,
        color:         colors.text2,
        marginBottom:  '6px',
        display:       'flex',
        alignItems:    'center',
        gap:           '5px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}>
        {label}
        {required && <span style={{ color: colors.accent, fontSize: '11px' }}>*</span>}
      </div>
    )}
    {children}
    {helperText && (
      <div style={{
        fontSize:   '11.5px',
        color:      colors.text3,
        marginTop:  '5px',
        lineHeight: '1.55',
      }}>
        {helperText}
      </div>
    )}
  </div>
);

// ─── Input ────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?:      string;
  required?:   boolean;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  required,
  helperText,
  onFocus,
  onBlur,
  style,
  ...rest
}) => {
  const [focused, setFocused] = React.useState(false);

  return (
    <FormGroup label={label} required={required} helperText={helperText}>
      <input
        onFocus={e => { setFocused(true); onFocus?.(e); }}
        onBlur={e  => { setFocused(false); onBlur?.(e); }}
        style={{
          ...baseFieldStyle,
          borderColor: focused ? colors.accentBorder : colors.border,
          boxShadow:   focused ? shadows.inputFocus   : 'none',
          ...style,
        }}
        {...rest}
      />
    </FormGroup>
  );
};

// ─── Textarea ─────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?:      string;
  required?:   boolean;
  helperText?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  required,
  helperText,
  onFocus,
  onBlur,
  style,
  ...rest
}) => {
  const [focused, setFocused] = React.useState(false);

  return (
    <FormGroup label={label} required={required} helperText={helperText}>
      <textarea
        onFocus={e => { setFocused(true); onFocus?.(e); }}
        onBlur={e  => { setFocused(false); onBlur?.(e); }}
        style={{
          ...baseFieldStyle,
          resize:      'vertical',
          minHeight:   '88px',
          lineHeight:  '1.6',
          borderColor: focused ? colors.accentBorder : colors.border,
          boxShadow:   focused ? shadows.inputFocus   : 'none',
          ...style,
        }}
        {...rest}
      />
    </FormGroup>
  );
};

// ─── Select ───────────────────────────────────
interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?:      string;
  required?:   boolean;
  helperText?: string;
  options:     SelectOption[];
  placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  required,
  helperText,
  options,
  placeholder,
  onFocus,
  onBlur,
  style,
  ...rest
}) => {
  const [focused, setFocused] = React.useState(false);

  return (
    <FormGroup label={label} required={required} helperText={helperText}>
      <select
        onFocus={e => { setFocused(true); onFocus?.(e); }}
        onBlur={e  => { setFocused(false); onBlur?.(e); }}
        style={{
          ...baseFieldStyle,
          paddingRight:      '32px',
          appearance:        'none',
          WebkitAppearance:  'none',
          backgroundImage:   `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 16 16'%3E%3Cpath d='M4 6l4 4 4-4' fill='none' stroke='%23545d73' stroke-width='2'/%3E%3C/svg%3E")`,
          backgroundRepeat:  'no-repeat',
          backgroundPosition:'right 12px center',
          backgroundSize:    '10px',
          backgroundColor:   colors.surface2,
          cursor:            'pointer',
          borderColor:       focused ? colors.accentBorder : colors.border,
          boxShadow:         focused ? shadows.inputFocus   : 'none',
          ...style,
        }}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </FormGroup>
  );
};

export default Input;

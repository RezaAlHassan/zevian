/**
 * Modal — right-side sheet modal with sticky header + footer.
 *
 * ATOM — no dependencies on other Zevian components.
 *
 * Usage:
 *   <Modal
 *     isOpen={open}
 *     onClose={() => setOpen(false)}
 *     title="Create Goal"
 *     subtitle="Define what success looks like"
 *     footer={<><Button variant="secondary">Cancel</Button><Button>Save</Button></>}
 *   >
 *     ...form content...
 *   </Modal>
 */

import React, { useEffect } from 'react';
import { colors, layout, typography, radius, animation, zIndex, componentTokens } from '../../design/tokens';

interface ModalProps {
  isOpen:    boolean;
  onClose:   () => void;
  title:     string;
  subtitle?: string;
  footer?:   React.ReactNode;
  children:  React.ReactNode;
  width?:    string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  footer,
  children,
  width = layout.modalSheetWidth,
}) => {
  const t = componentTokens.modal;

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={t.overlay}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          ...t.sheet,
          width,
          animation: animation.keyframes.slideIn,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={t.header}>
          <div style={{ flex: 1 }}>
            <div style={t.title}>{title}</div>
            {subtitle && <div style={t.subtitle}>{subtitle}</div>}
          </div>
          <button
            onClick={onClose}
            style={t.closeButton}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = colors.surface3;
              (e.currentTarget as HTMLButtonElement).style.color = colors.text;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = colors.surface2;
              (e.currentTarget as HTMLButtonElement).style.color = colors.text2;
            }}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M3 3l10 10M13 3L3 13"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={t.bodyNoPadding}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={t.footer}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── ModalSection — padded section with bottom border ─
interface ModalSectionProps {
  children:   React.ReactNode;
  title?:     string;
  titleIcon?: React.ReactNode;
  titleBadge?: React.ReactNode;
  style?:     React.CSSProperties;
}

export const ModalSection: React.FC<ModalSectionProps> = ({
  children,
  title,
  titleIcon,
  titleBadge,
  style,
}) => (
  <div style={{ padding: '20px 26px', borderBottom: `1px solid ${colors.border}`, ...style }}>
    {title && (
      <div style={{
        fontSize:    '13px',
        fontWeight:  typography.weight.bold,
        color:       colors.text,
        display:     'flex',
        alignItems:  'center',
        gap:         '8px',
        marginBottom:'14px',
      }}>
        {titleIcon && (
          <span style={{ width: '15px', height: '15px', color: colors.accent, display: 'flex' }}>
            {titleIcon}
          </span>
        )}
        {title}
        {titleBadge}
      </div>
    )}
    {children}
  </div>
);

export default Modal;

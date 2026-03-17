// ─────────────────────────────────────────────
// ZEVIAN DESIGN SYSTEM — BARREL EXPORTS
// Import anything from '@/design-system'
//
// e.g.
//   import { Score, StatusPill, Button, colors } from '@/design-system'
// ─────────────────────────────────────────────

// Design tokens (always import from here, never hardcode values)
export * from './design/tokens';

// Atoms
export { default as Score }       from './components/atoms/Score';
export type { ScoreSize }         from './components/atoms/Score';

export { default as StatusPill }  from './components/atoms/StatusPill';
export type { StatusVariant }     from './components/atoms/StatusPill';

export { default as Chip }        from './components/atoms/Chip';
export type { ChipVariant }       from './components/atoms/Chip';

export { default as Avatar, AvatarStack } from './components/atoms/Avatar';
export type { AvatarSize }        from './components/atoms/Avatar';

export { default as Button }      from './components/atoms/Button';
export type { ButtonVariant, ButtonSize } from './components/atoms/Button';

export { Input, Textarea, Select, FormGroup } from './components/atoms/Input';

export { default as Card, NestedCard } from './components/atoms/Card';

export { default as Modal, ModalSection } from './components/atoms/Modal';

export { AppShell, Sidebar, Header } from './components/atoms/Layout';
export type { NavItem }           from './components/atoms/Layout';

// Molecules
export {
  ProjectCard,
  GoalRow,
  CriteriaBarGroup,
  ActivityFeed,
  InfoCard,
  AIBanner,
} from './components/molecules';

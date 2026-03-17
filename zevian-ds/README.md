# Zevian Design System

Single source of truth for all visual decisions in the Zevian app.
Cursor reads `.cursor/rules` automatically — every AI interaction in this project stays on-design.

## Structure

```
src/
  design/
    tokens.ts        ← ALL design values (colors, typography, spacing, component tokens)
    global.css       ← CSS variables, keyframes, base reset, utility classes
  components/
    atoms/
      Score.tsx       ← Score number with auto color coding
      StatusPill.tsx  ← on-track / at-risk / review / overdue pills
      Chip.tsx        ← category, frequency, count tags
      Avatar.tsx      ← initials avatar + AvatarStack
      Button.tsx      ← primary / secondary / ghost / danger
      Input.tsx       ← Input / Textarea / Select / FormGroup
      Card.tsx        ← Card + NestedCard
      Modal.tsx       ← Right-side sheet modal + ModalSection
      Layout.tsx      ← AppShell / Sidebar / Header
    molecules/
      index.tsx       ← ProjectCard, GoalRow, CriteriaBarGroup,
                         ActivityFeed, InfoCard, AIBanner
  index.ts           ← Barrel export (import everything from here)

.cursor/rules        ← Auto-injected Cursor context
CURSOR_PROMPTS.md    ← Copy-paste prompts for every refactor scenario
```

## Setup

1. Copy this package into your app at a path you alias as `@/design-system`

2. Import global CSS once at your app root:
```tsx
// main.tsx or _app.tsx
import '@/design-system/src/design/global.css'
```

3. Import anything you need:
```tsx
import {
  colors, typography, radius, animation,
  getScoreColor, getScoreStatus,
  Score, StatusPill, Chip, Avatar, AvatarStack,
  Button, Input, Textarea, Select,
  Card, NestedCard, Modal, ModalSection,
  AppShell, Sidebar, Header,
  ProjectCard, GoalRow, AIBanner,
} from '@/design-system'
```

## The Golden Rule

**Never hardcode a value that exists in tokens.**

```tsx
// ❌ Wrong
<div style={{ color: '#5b7fff', borderRadius: '8px' }}>

// ✅ Right
import { colors, radius } from '@/design-system'
<div style={{ color: colors.accent, borderRadius: radius.md }}>
```

## Score Colors

Always use the helper — never hardcode green/amber/red:

```tsx
import { getScoreColor, getScoreBarColor, getScoreStatus } from '@/design-system'

// Color for text
const color = getScoreColor(7.2)   // → colors.warn

// Color for bar fill
const barColor = getScoreBarColor(8.4)  // → colors.green

// Status string for StatusPill
const status = getScoreStatus(4.1)  // → 'at-risk'
<StatusPill status={status} />
```

## Cursor Usage

For every component refactor, open `CURSOR_PROMPTS.md` and copy the matching prompt type.
Fill in the brackets and paste into Cursor. This keeps every generation consistent.

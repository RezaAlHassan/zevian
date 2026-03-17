# ZEVIAN — CURSOR PROMPT TEMPLATES
# ═══════════════════════════════════════════════════════════════
# Copy-paste these prompts into Cursor when building or refactoring
# Zevian components. Each prompt tells Cursor exactly where the
# source of truth lives so it never drifts from the design system.
# ═══════════════════════════════════════════════════════════════


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROMPT TYPE 1 — STYLING REFACTOR
Use when: an existing component looks wrong and needs to match Zevian design
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Refactor the styling of [ComponentName] to match the Zevian design system.

Rules:
- Do NOT change any logic, props, state, event handlers, or data flow
- Only update className values and inline style objects
- Import all values from `@/design-system` (src/index.ts) — never hardcode hex values, font sizes, or spacing
- For colors, use: colors.surface, colors.accent, colors.text, colors.text2, colors.text3, colors.border, etc.
- For border radius: use radius.md (8px), radius.lg (10px), radius.xl (12px), radius['2xl'] (14px)
- For fonts: typography.fonts.display (Syne), typography.fonts.body (DM Sans), typography.fonts.mono (DM Mono)
- For score colors: always use getScoreColor(score) — never hardcode green/amber/red
- For status pills: use <StatusPill status="on-track|at-risk|review" /> — never inline custom pills
- For any button: use the <Button> atom with variant="primary|secondary|ghost|danger"

The component should look exactly like the HTML reference file at:
[PATH TO RELEVANT .html FILE e.g. /outputs/zevian-goals.html]

Focus only on the [SPECIFIC SECTION e.g. "goal row in the table, lines 45-80"].


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROMPT TYPE 2 — NEW COMPONENT FROM REFERENCE
Use when: building a new component that exists in the HTML reference
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Build a new React component called [ComponentName] based on the HTML reference.

Reference HTML file: [PATH e.g. /outputs/zevian-add-goal.html]
Reference section:   [DESCRIBE e.g. "the Quick Start Templates section, around line 120"]

Requirements:
- TypeScript with explicit prop types
- Import all design values from `@/design-system` — use colors.*, radius.*, typography.*, animation.*
- Use existing atoms where applicable:
    <Score />          for any score/number display
    <StatusPill />     for on-track/at-risk/review states
    <Chip />           for category/frequency/count tags
    <Avatar />         for user avatars
    <AvatarStack />    for grouped avatars
    <Button />         for all clickable actions
    <Input />          for text inputs
    <Textarea />       for multi-line inputs
    <Select />         for dropdowns
    <Card />           for card containers
    <Modal />          for sheet modals
- Match these exact visual rules from the design system:
    - Score ≥ 7.5 → colors.green
    - Score 6.0–7.4 → colors.warn
    - Score < 6.0 → colors.danger
    - All transitions use animation.fast (0.15s)
    - Card border-radius is radius['2xl'] (14px)
    - Nested card border-radius is radius.lg (10px)
    - Font for all headings/scores: typography.fonts.display (Syne)
    - Font for numbers/weights: typography.fonts.mono (DM Mono)
- Component must be a default export
- Keep all existing props from [EXISTING COMPONENT IF REFACTORING]


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROMPT TYPE 3 — ADD A FEATURE TO EXISTING PAGE
Use when: adding something new (e.g. AI banner, empty state, filter)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Add [FEATURE NAME] to [PageName].tsx.

Design reference: [PATH TO .html FILE], section: [SECTION NAME]

The feature should:
- [DESCRIBE BEHAVIOUR e.g. "appear at the top of the page when teamScore < 6"]
- [DESCRIBE TRIGGER e.g. "be dismissible, storing state in useState"]

Use these specific components from @/design-system:
- [LIST RELEVANT ONES e.g. AIBanner, Chip, Button]

Style rules:
- Background gradient: linear-gradient(90deg, rgba(91,127,255,0.08), rgba(0,212,170,0.05))
- Border: 1px solid rgba(91,127,255,0.20)
- Border radius: 12px

Do not modify any other part of the file. Insert the new block at [LOCATION e.g. "line 42, after the KPI row"].


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROMPT TYPE 4 — SCORE COLOR AUDIT
Use when: colors are inconsistent across the codebase
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Audit the entire [FILE OR FOLDER] and replace all hardcoded score-related colors with the correct helper from @/design-system.

Rules:
- Replace any hardcoded '#10b981', 'green', '#22c55e' used for scores with: getScoreColor(score)
- Replace any hardcoded '#f59e0b', 'yellow', 'amber' used for scores with: getScoreColor(score)
- Replace any hardcoded '#f04438', 'red', '#ef4444' used for scores with: getScoreColor(score)
- Replace any hardcoded score bar fill colors with: getScoreBarColor(score)
- For status labels: replace inline span/div status displays with <StatusPill status={getScoreStatus(score)} />
- Import getScoreColor, getScoreBarColor, getScoreStatus from @/design-system

Score thresholds (do not change these):
- ≥ 7.5 → colors.green  (#10b981)
- 6.0–7.4 → colors.warn  (#f59e0b)
- < 6.0 → colors.danger (#f04438)
- null/undefined → colors.text3 (#545d73)

Do not change any non-score-related colors.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROMPT TYPE 5 — MODAL REFACTOR
Use when: a modal/dialog needs to match the sheet pattern
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Refactor [ModalName] to use the Zevian sheet modal pattern from @/design-system.

Replace the current modal implementation with:
  import { Modal, ModalSection } from '@/design-system'

  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title="[TITLE]"
    subtitle="[SUBTITLE]"
    footer={
      <>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={!isValid}>Save [THING]</Button>
      </>
    }
  >
    <ModalSection title="[SECTION 1]">
      ...inputs...
    </ModalSection>
    <ModalSection title="[SECTION 2]">
      ...inputs...
    </ModalSection>
  </Modal>

Rules:
- The modal must be a RIGHT-SIDE SHEET, not a centered dialog — the Modal atom handles this
- Header and footer must be sticky (position: sticky) — the Modal atom handles this
- Body must scroll independently — the Modal atom handles this
- All inputs inside must use <Input>, <Textarea>, <Select> atoms from @/design-system
- Save button must be disabled until all required fields are filled
- Close on Escape key — the Modal atom handles this
- Close on overlay click — the Modal atom handles this


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROMPT TYPE 6 — EMPTY STATE
Use when: adding a zero-data state to a page or section
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Add an empty state to [ComponentName] that shows when [CONDITION e.g. "goals.length === 0"].

The empty state should follow this exact structure:
- Centered column layout (flexbox column, align center)
- Icon wrapper: 64×64px, borderRadius 16px, background rgba(91,127,255,0.08), pulse-ring CSS class
- Icon: SVG from the existing component's context (e.g. flag for goals, folder for projects)
- Title: Syne font, 16px, fontWeight 800, colors.text
- Description: 13px, colors.text3, maxWidth 300px, lineHeight 1.65
- Primary CTA: <Button variant="primary">Create [THING]</Button>
- Secondary CTA (optional): <Button variant="secondary">Learn More</Button>

Use className="pulse-ring" on the icon wrapper — this is defined in global.css.

Condition: show empty state when [EXACT CONDITION], otherwise render the normal content.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROMPT TYPE 7 — TABLE ROW / LIST ITEM
Use when: adding a new row type to a data table or list
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Add a [NAME] row to the [TableName] table in [FileName].tsx.

The row must follow these rules:
- Background: transparent by default, colors.surface2 on hover
- Hover transition: background animation.fast (0.15s)
- Border bottom: 1px solid colors.border
- Cell padding: 13px 14px
- Use <Score> atom for any score cells
- Use <StatusPill> atom for any status cells
- Use <Chip> atom for any tag/category cells
- Use <AvatarStack> atom for assignee cells
- Column headers: 10.5px, fontWeight 700, colors.text3, uppercase, letterSpacing 0.06em
- Last column: action button — padding 6px 12px, background colors.surface2, border colors.border, radius.md

Props the row should accept: [LIST PROPS]
Data shape: [DESCRIBE SHAPE]


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUICK REFERENCE — VALUES TO NEVER HARDCODE
Always import from @/design-system instead
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NEVER HARDCODE          USE INSTEAD
──────────────────────────────────────────────────────
#0a0c10                 colors.bg
#111318                 colors.surface
#181c24                 colors.surface2
#1e2330                 colors.surface3
rgba(255,255,255,0.07)  colors.border
rgba(255,255,255,0.13)  colors.borderHover
#f0f2f7                 colors.text
#8b93a8                 colors.text2
#545d73                 colors.text3
#5b7fff                 colors.accent
#7090ff                 colors.accentHover
#00d4aa                 colors.teal
#10b981                 colors.green
#f59e0b                 colors.warn
#f04438                 colors.danger
#8b5cf6                 colors.purple
'Syne'                  typography.fonts.display
'DM Sans'               typography.fonts.body
'DM Mono'               typography.fonts.mono
8px (border-radius)     radius.md
10px (border-radius)    radius.lg
12px (border-radius)    radius.xl
14px (border-radius)    radius['2xl']
0.15s                   animation.fast
0.20s                   animation.base
220px (sidebar)         layout.sidebarWidth
56px (header)           layout.headerHeight

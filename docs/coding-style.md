# Coding & Structural Style Guide (mycaucasus)

Authoritative rules for creating, naming, and organizing code in this repository.
If a rule conflicts with an implementation detail, refactor toward the rule unless there is a clear performance or framework constraint.

## 1. Core Principles

- Consistency over cleverness.
- Small, composable units (components, hooks, utils) instead of monoliths.
- Pure black dark theme baseline (#000) with subtle translucent borders.
- Semantic separation: data access (lib), configuration (config), presentation (components), routing (app), assets (public), scripts (scripts), styling (co-located CSS Modules), documentation (docs).
- Zero silent duplication: if logic repeats 3 times → extract util/hook.

## 2. Folder & Component Creation Rules

### 2.1 Single Component Pattern

When creating a new component named `Example`:

```
/components/
  example/
    example.tsx
    example.module.css
```

- Directory name: lowercase (kebab-case allowed only if multiple words: `pilot-profile`, not `PilotProfile`).
- File names mirror folder: `example.tsx`, `example.module.css`.
- No component `.tsx` files directly under `components/` root—always inside a folder.

### 2.2 Nested Feature Expansion

If inside `example/` you need a sub-component or nested logical block named `details`:

```
/components/example/details/
  details.tsx
  details.module.css
```

Do NOT put `details.tsx` next to `example.tsx`. Always a folder per logical unit.

### 2.3 Parallel Feature Grouping

If two sibling components (e.g. `lasha` and `gio`) provide similar-level functionality, they should live under a new grouping folder describing the domain:

```
/components/names/
  lasha/
    lasha.tsx
    lasha.module.css
  gio/
    gio.tsx
    gio.module.css
```

- Choose grouping folder name as plural semantic category (`names`, `header`, `notifications`, `registration`, `navigation`, etc.).
- Do not create grouping folder for only one child—only when at least two siblings appear.

### 2.4 Deep Nesting Limits

Max recommended depth inside `components/` is 4 levels (e.g. `components/feature/sub/leaf/leaf.tsx`). If deeper is required, re-evaluate design or introduce a domain root.

### 2.5 Route Components (App Router)

- Route UI lives in `src/app/...` and uses server components by default.
- Co-located client components that are route-specific may still follow the folder rule inside `components/` if reused; otherwise, a local `_(partial)/` folder can be used sparingly.

## 3. Naming Conventions

| Thing              | Rule                                                                | Example                         |
| ------------------ | ------------------------------------------------------------------- | ------------------------------- |
| Component (export) | PascalCase export, folder/file lowercase                            | `example.tsx` exports `Example` |
| Hook               | `useX`                                                              | `usePilot()`, `useDebounce()`   |
| Utility            | verbFirst `get`, `build`, `format`, `calc`                          | `getServerRole`                 |
| CSS classes        | lowercase-dash or simple word                                       | `.avatar-box`, `.status-dot`    |
| Types              | PascalCase with suffix when semantic (`UserProfile`, `PilotStatus`) |                                 |
| Enums              | PascalCase singular                                                 | `Role`, `PilotKind`             |
| Constants          | UPPER_SNAKE_CASE                                                    | `DEFAULT_LOCALE`                |
| Files              | lowercase / kebab if >1 word                                        | `pilot-profile.module.css`      |

## 4. Component Structure

Inside each `.tsx` component file:

```
// 1. Header comment (optional, see header-snippet)
// 2. Imports: react/next, third-party, internal (absolute), relative
// 3. Types/interfaces
// 4. Constants
// 5. Hooks (custom logic) inside component or imported
// 6. Component body (pure render + minimal glue)
// 7. Helper pure functions (below component) if tiny; otherwise extract
```

- Keep components < ~200 lines; if larger, split.
- Avoid side effects in module scope (except config constants).

## 5. Styling Rules

- Each component has exactly one `*.module.css` file (optional if zero style yet, but create once styling begins).
- No shared global CSS except `globals.css` + purposeful theme primitives.
- Prefer utility classes inside the module instead of inline styles.
- Keep module selectors shallow: no chaining more than 2 levels `.parent .child`.
- Use design tokens; no raw hex if token exists.
- Hover/active/focus states explicit (no relying on default browser outline without theming).

## 6. State & Data Flow

- Local UI state: React `useState` / derived memoization.
- Shared ephemeral state between siblings: custom hook lifting state to nearest common ancestor.
- Long-lived or cross-app state: (Future) context provider or dedicated store only if >3 consumers.
- API & persistence: Supabase client in `lib/` functions. UI components never embed raw SQL or direct fetch logic when sharable.
- Server components for data fetching where possible (App Router), client components for interactivity.

### 6.1 Props vs Context (Decision Rules)

Use PROPS by default. Introduce CONTEXT only when one of the qualifying conditions is met.

| Prefer  | When                                                            | Examples                                             |
| ------- | --------------------------------------------------------------- | ---------------------------------------------------- |
| Props   | Data needed by a single direct child                            | Passing `onSubmit`, `isLoading` to a form component  |
| Props   | One-off primitive values (string, number, boolean)              | `title`, `count`, `disabled`                         |
| Props   | Styling / presentational variations                             | `variant="primary"`, `size="sm"`                     |
| Props   | Passing data down ≤ 2 levels and unlikely to explode in breadth | Parent → Child → Grandchild simple chain             |
| Context | Value consumed by 3+ non-linear branches                        | Auth user data, theme palette tokens (if dynamic)    |
| Context | Stateful logic must stay singleton per subtree                  | Active pilot session, WebSocket connection reference |
| Context | Avoid prop drilling across >2 levels with many unrelated props  | Notifications provider feeding toast triggers        |
| Context | Cross-cutting concern (auth, localization, feature flags)       | `AuthContext`, `FeatureFlagsContext`                 |

Hard Rules:

- NEVER wrap a component tree in new context if only one component consumes it.
- DO NOT create context for pure presentation toggles that can be lifted and passed as props.
- Before adding context, attempt: lift state → pass grouped object prop (e.g. `pilotStatus`) → custom hook colocated. Only if still noisy, promote to context.
- Context provider files live under a domain folder in `components/` if UI-related or under `lib/` if purely logical (no JSX) and can be imported into server/client boundaries.

Implementation Pattern (UI context):

```
/components/session/session-context/
  session-context.tsx   // defines Provider + hook
  session-consumer.tsx  // optional sample consumer or helper component
```

File `session-context.tsx` outline:

```
import { createContext, useContext, useState, useMemo } from 'react';

interface SessionValue { /* shape */ }
const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [value, setValue] = useState<SessionValue>(/* init */);
  const api = useMemo(() => ({ ...value, setValue }), [value]);
  return <SessionContext.Provider value={api}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be inside <SessionProvider>');
  return ctx;
}
```

Anti-Patterns (avoid):

- Passing entire context object again as props (double indirection).
- Re-exporting dozens of granular contexts instead of one composed state object.
- Embedding heavy async side effects inside context initialization without lazy guards.

Refactor to context when:

- A prop object is threaded unchanged through ≥3 components.
- You introduce a third consumer in a non-linear branch (sibling subtree) needing the same state.
- Adding a new related prop requires editing 4+ intermediate components that don’t use it.

Refactor away from context when:

- Only a single component still reads it after feature removal.
- Context rerenders become a performance issue (split into smaller contexts or selectors).

Testing Guidance:

- For context hooks, export the raw provider + a `createTestProvider(customValue?)` helper if complex.
- When possible, expose a pure state machine (reducer or functions) separately and let context only wire React concerns.

## 7. Error & Loading Patterns

- Data fetching util returns `{ data, error }` or throws early; prefer thrown errors wrapped by boundary if complexity grows.
- Use toast helpers (`toast.success`, `toast.error`) for user feedback.
- Avoid generic catch blocks that swallow error messages.
- Skeletons or minimal placeholders over spinners (when possible).

## 8. File Imports & Paths

- Use absolute imports from `@/` root (configured by `tsconfig.json` paths) for clarity.
- Do not use deep relative paths like `../../../`; if you see them, refactor to absolute alias.

## 9. Accessibility

- Interactive elements: correct semantic tag (`button`, `a`, `input`).
- Provide `aria-label` / `role` only when semantics need augmentation (don’t duplicate default roles).
- Focus outline visible (use token rule). Never remove focus ring without replacement.

## 10. Performance Considerations

- Memoization only when measurable benefit or prop drilling performance issue. Avoid premature `React.memo`.
- Lazy-load heavy feature components if not above the fold.
- Images: always via `next/image` with explicit `sizes`.

## 11. Commits & Branching

- Conventional, concise commit subject: `<area>: <action summary>`.
  - Examples: `profile: add inline status control`, `auth: fix redirect guard race`.
- One logical change per commit. Split formatting-only commits when large.

## 12. Adding a New Feature (Checklist)

1. Create domain folder (if plural grouping needed) under `components/`.
2. Scaffold component folder + `.tsx` + `.module.css`.
3. Implement render skeleton (no premature logic).
4. Add styles referencing tokens.
5. Add hook/util in `lib/` if cross-cutting.
6. Wire into route or parent component.
7. Test basic interaction (manual + unit if pure logic extracted).

## 13. Prohibited / Discouraged

- Dumping multiple unrelated components in one folder.
- Re-export barrels that hide actual file boundaries (unless index is trivial alias for public API).
- Overuse of context for simple prop chains.
- Magic numbers for spacing / radii.
- Copy-paste duplication of toast or fetch logic.

## 14. Refactoring Triggers

Refactor when any of these occur:

- File > 250 lines and has mixed concerns.
- Same conditional block duplicated 3+ times.
- Deep relative path climbing (`../../../../`).
- Hardcoded values appear >2 times (promote to token / constant).

## 15. Header Comment Template

See `docs/header-snippet.ts.txt` (to be added) and insert at the top if component performs non-trivial orchestration.

## 16. Responsive Design & Layout Rules

### 16.1 Breakpoints

Use a minimal, intentional set. Prefer mobile-first CSS.

```
--bp-xs: 420px;   /* very small / narrow phones */
--bp-sm: 640px;   /* base small breakpoint */
--bp-md: 768px;   /* tablets / small landscape */
--bp-lg: 1024px;  /* standard desktop */
--bp-xl: 1280px;  /* wide desktop */
--bp-2xl: 1536px; /* large screens */
```

Define these in `globals.css` (or tokens) if not already; consume via `@media (min-width: 768px) { ... }` etc. Do NOT invent ad-hoc breakpoints per component.

### 16.2 Grid-First Policy

Primary layout system = CSS Grid for multi-axis alignment or complex sectioning.
Use grid when:

- You have both columns AND meaningful row relationships.
- Elements need consistent vertical + horizontal rhythm (cards, dashboard panels, profile sections).
- Reordering is needed at different breakpoints.

Use flex ONLY when:

- One-dimensional alignment (row OR column) is sufficient.
- Simple horizontal centering, spacing, or vertical stacking.

Anti-pattern: nested flex containers hacking spacing where a single grid with `gap` and template areas would be clearer.

### 16.3 Alignment & Symmetry

- Always rely on the shared spacing scale (see design tokens) for gaps/padding (`4,8,12,16,20,24,32,40,48...`).
- Horizontal gutters consistent per breakpoint: e.g. `padding-inline: 16px` mobile, `32px` tablet+, `48px` large desktop.
- Avoid fractional pixel values; never use `margin-left: 17px` (choose nearest token).
- Center large solitary blocks with grid: `display:grid; place-items:center;` instead of flex gymnastics.

### 16.4 Responsive Pattern Heuristics

| Pattern                                     | Mobile                       | Desktop                                            |
| ------------------------------------------- | ---------------------------- | -------------------------------------------------- |
| Two-panel detail (e.g. profile + equipment) | Stack vertically             | Side-by-side 2 columns                             |
| Action buttons group                        | Full-width stacked if narrow | Inline row with gap                                |
| Avatar + metadata                           | Center align                 | Left align + secondary column                      |
| Forms with labels                           | Single column                | 2-column (labels/inputs) or logical field grouping |

If a design deviates, document rationale in a code comment above the container element.

### 16.5 Width & Max Constraints

- Use fluid containers with `max-width` rather than fixed widths.
- Common shells: `max-width: 1280px` (app main), narrower forms `max-width: 640px`.
- Use `width:100%` then constrain with `max-width` for central blocks.

### 16.6 No Inline Styling Rule

Inline style attributes in JSX (`style={{ ... }}`) are prohibited except for:

1. Dynamic runtime-calculated values that cannot be expressed as a finite class variant (rare).
2. Canvas/SVG direct attributes where a CSS variable is impractical.
3. Temporary instrumentation (must be removed before commit).

If you must use a dynamic value, prefer a CSS custom property set via `style={{ '--progress': percent+'%' }}` and consumed in the module.

### 16.7 CSS Module Layout Conventions

- Root wrapper class: `.root` or semantic `.profile`, `.dashboard`.
- Use `gap` not margin chaining for internal spacing.
- Never rely on `:last-child` or `:nth-child` for structural spacing that might break with reorder.
- Avoid explicit heights unless necessary (let content define height, except for full-viewport shells `min-height:100dvh`).

### 16.8 Responsive Class Strategy

Prefer mobile-first base + layered media queries at bottom of module:

```
.panel { display:grid; gap:16px; }
@media (min-width: 768px) { .panel { grid-template-columns: 1fr 1fr; } }
@media (min-width: 1280px) { .panel { gap:24px; } }
```

Do not interleave unrelated media queries—group them logically.

### 16.9 Visual Consistency Checks

Before committing a new layout:

1. Resize from 320px → 1920px; ensure no horizontal scroll.
2. Validate grid/flex content doesn’t collapse (e.g. avatar + text overlap).
3. Confirm consistent gap increments.
4. Verify focus states remain visible after wrapping changes.

### 16.10 Refactor Triggers (Layout)

Refactor layout when:

- More than 2 nested flex wrappers before content.
- You simulate grid with manual width percentages repeatedly.
- Media queries duplicated across 3+ modules (extract pattern to a shared snippet or token comment guidance).

### 16.11 Common Snippets

Grid two-column auto-collapse:

```
.twoCol { display:grid; gap:16px; }
@media (min-width: 768px) { .twoCol { grid-template-columns: 1fr 1fr; } }
```

Flex row wrap to column:

```
.actions { display:flex; gap:12px; flex-wrap:wrap; }
@media (max-width: 480px) { .actions { flex-direction:column; } }
```

Centered container with max width:

```
.container { width:100%; max-width:1280px; margin-inline:auto; padding-inline:16px; }
@media (min-width: 1024px) { .container { padding-inline:32px; } }
```

### 16.12 Avoiding Layout Shift

- Reserve image space with explicit `width`/`height` in `next/image` or `aspect-ratio` container.
- Use `min-height` placeholders for async sections to prevent jump.

### 16.13 Dark Theme Contrast

- Maintain minimum contrast on text: tokens chosen must meet WCAG AA against pure black.
- Subtle dividers use `rgba(255,255,255,0.08-0.12)`; avoid arbitrary new alphas.

Violation Handling: If a PR introduces inline styles or ad-hoc breakpoints, request change with reference: “See section 16.6 / 16.1”.

## 17. Open Questions (Document Later)

- Testing strategy (unit vs integration) formalization.
- Light theme design mapping.
- i18n standard (next-intl vs custom) — pending.

_End of file._

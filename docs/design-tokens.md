# Design Tokens (mycaucasus)

Authoritative single source for UI primitives. Keep this file small, concise, and stable.

## Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg-app` | `#000000` | Global background (pure black) |
| `--color-bg-card` | `#000000` | Cards / sections |
| `--color-border-subtle` | `rgba(255,255,255,0.08)` | Default 1px borders |
| `--color-border-hover` | `rgba(255,255,255,0.12)` | Hover border state |
| `--color-border-strong` | `rgba(255,255,255,0.18)` | Inputs / elevated emphasis |
| `--color-text-primary` | `#f8fafc` | Primary text |
| `--color-text-secondary` | `rgba(229,231,235,0.75)` | Labels / muted headings |
| `--color-text-muted` | `rgba(229,231,235,0.60)` | Secondary muted content |
| `--color-accent` | `#0ea5e9` | Focus outlines / accent lines |
| `--color-accent-alt` | `#3b82f6` | Alternative accent (buttons) |
| `--color-success` | `#10b981` | Positive / active status |
| `--color-danger` | `#dc2626` | Destructive actions / offline |
| `--color-warning` | `#f59e0b` | Warnings / pending states |
| `--color-overlay` | `rgba(0,0,0,0.65)` | Modal backdrop |

Never introduce raw hex codes in components if an equivalent token exists.

## Radii

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-xs` | 4px | Chips / tiny indicators |
| `--radius-sm` | 6px | Badges / small buttons |
| `--radius-md` | 8px | Standard buttons / inputs |
| `--radius-lg` | 12px | Pills / status badges |
| `--radius-xl` | 16px | Cards / containers |

## Spacing Scale

Base unit = 4px. Use multiples; avoid arbitrary pixel values.

| Step | Value |
|------|-------|
| 0 | 0 |
| 1 | 4px |
| 2 | 8px |
| 3 | 12px |
| 4 | 16px |
| 5 | 20px |
| 6 | 24px |
| 7 | 32px |
| 8 | 40px |
| 9 | 48px |

## Typography

| Token | Value | Notes |
|-------|-------|-------|
| `--font-family-base` | system-ui, -apple-system, "Segoe UI", Roboto, Inter, Arial, sans-serif | Keep fast, no custom blocking fonts |
| `--font-size-xs` | 0.62rem | Tiny meta (badges) |
| `--font-size-sm` | 0.7rem | Labels / table headers |
| `--font-size-base` | 0.85rem | Body / input text |
| `--font-size-md` | 0.92rem | Prominent body variant |
| `--font-size-lg` | 1rem | Section headings (small) |
| `--font-size-xl` | 1.25rem | Rare emphasis |
| `--line-height-tight` | 1.1 | Buttons / compact UI |
| `--line-height-base` | 1.4 | General text |

Uppercase labels should use tracking between 0.4–0.8px depending on size.

## Shadows (minimal)

| Token | Value | Purpose |
|-------|-------|---------|
| `--shadow-none` | none | Flat surfaces |
| `--shadow-sm` | 0 2px 4px -2px rgba(0,0,0,0.5) | Light elevation |
| `--shadow-md` | 0 4px 16px -4px rgba(0,0,0,0.55) | Modals / overlays |

Avoid heavy layered shadows; prefer contrast + border.

## Z-Index Layers

| Layer | Value | Description |
|-------|-------|-------------|
| Base | 0 | Normal flow |
| Dropdown | 100 | Menus / popovers |
| Overlay | 1000 | Modal backdrop |
| Modal | 1100 | Modal content |
| Toast | 1200 | Notifications |
| Spotlight | 1300 | Fullscreen overlays / image preview |

## Motion

| Token | Value | Usage |
|-------|-------|-------|
| `--ease-standard` | cubic-bezier(.4,.1,.2,1) | Default ease |
| `--dur-fast` | 120ms | Button / hover |
| `--dur-base` | 200ms | Transitions |
| `--dur-slow` | 320ms | Overlays / modals |

Prefer opacity + transform; avoid layout thrashing (no height transitions unless measured).

## Focus Outline

Use 2px outline with `--color-accent` at 40–50% alpha: `outline: 2px solid #0ea5e980; outline-offset: 2px;`.

## Usage Rules

1. Introduce new tokens only if used in ≥3 distinct places.
2. Never hardcode: spacing > 4px increments, colors, radii, shadows.
3. Prefer composition: border + subtle background instead of large shadows.
4. Keep dark mode only for now; future theming can map semantic tokens to different palettes.
5. If a component needs a one-off color → reconsider design or propose token addition first.

## Future (Not Yet Implemented)
- Semantic tokens layer (e.g. `--button-primary-bg`, `--badge-success-text`).
- Light theme mapping.
- Motion reduced mode (respect `prefers-reduced-motion`).

End of file.

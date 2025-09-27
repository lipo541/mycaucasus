# Copilot & AI Assistance Guidelines

Authoritative reference for how AI tooling (GitHub Copilot / inline assistants) should interact with this codebase.

## 1. Core Goals

- Accelerate repetitive scaffolding (component folders, context provider templates, CSS module shells).
- Enforce architectural & style guide rules automatically.
- Reduce noise: fewer speculative suggestions, more rule-compliant diffs.
- Never drift from tokens, folder rules, or responsive standards.

## 2. Mandatory Structural Rules (Enforce When Suggesting)

| Rule                               | Enforcement                                                              |
| ---------------------------------- | ------------------------------------------------------------------------ |
| One component per folder           | Always scaffold `name/name.tsx` + `name/name.module.css`                 |
| Use lowercase folder names         | Reject PascalCase folder suggestions                                     |
| Avoid inline styles                | Suggest CSS module class & add placeholder selector                      |
| Prefer Grid for multi-axis layouts | If multiple column + row relationships exist, propose grid snippet       |
| Props vs Context decision          | If >2 levels prop drilling predicted, suggest context refactor pattern   |
| Breakpoints fixed set              | Use only documented tokens (`min-width: 640px`, `768px`, `1024px`, etc.) |
| Absolute imports                   | Use `@/` alias instead of deep relatives                                 |

## 3. Suggestion Heuristics

| Situation                        | Copilot Should                                             |
| -------------------------------- | ---------------------------------------------------------- |
| New feature directory appears    | Offer scaffold of component + module.css + test (future)   |
| Large component grows >200 lines | Recommend extraction (list candidate subcomponents)        |
| Repetition of spacing literals   | Replace with design token / comment referencing tokens doc |
| A context provider added         | Add consumer hook guard (`if (!ctx) throw ...`)            |
| Inline style typed               | Replace with CSS class and show snippet                    |

## 4. Refusal / Pushback Cases

Copilot must decline or warn when:

- User asks to place multiple sibling components directly inside `components/` root.
- Suggestion would introduce inline styling without necessity.
- A new arbitrary breakpoint (e.g. `@media (min-width: 950px)`) is attempted.
- Hardcoded hex duplicates existing token purpose.
  Response pattern: brief rationale + compliant alternative.

## 5. Prompt Patterns (Recommended)

Short imperative commands for best results:

- "Scaffold component: pilot-card with avatar + name + status using grid"
- "Refactor to context: extract activePilot state from three consumers"
- "Add responsive two-column layout to profile details section"
- "Generate CSS module classes for actions bar (wrap mobile)"

## 6. CSS Module Generation Rules

- Use `.root` or semantic root class.
- Provide placeholder comments for future variants.
- Keep media queries grouped at bottom.

Example skeleton:

```
.root { display:grid; gap:16px; }
@media (min-width: 768px) { .root { grid-template-columns: 1fr 1fr; } }
```

## 7. Context Provider Pattern (Recap)

```
/components/domain/session-context/
  session-context.tsx
```

File content pattern includes: createContext, provider, guarding hook, memoized value, minimal side effects.

## 8. Spacing & Tokens

- Use only documented spacing steps (4,8,12,16,20,24,32,40,48...).
- If token missing, leave `/* consider new token */` and do NOT introduce raw arbitrary value.

## 9. Performance Awareness

- Do not auto-wrap everything in `React.memo`.
- Avoid generating `.useEffect` polling loops—prefer server data or event-driven patterns.
- For repeating list items, infer `key` suggestions using stable identifiers.

## 10. Testing Hooks / Logic (Forward-Looking)

If generating pure logic (formatter, parser), keep it side-effect free and export for future test harness.

## 11. Language & Output Style

- Use concise English for comments.
- Keep generated diffs minimal (only changed lines).
- Avoid restating unchanged code blocks.

## 12. Interaction With Style Guide

If style guide (`docs/coding-style.md`) updates introduce new constraints, merge them here. Keep cross-reference comments: `// see coding-style section X`.

## 13. Error Handling Guidance

- Provide explicit error messages (`throw new Error("useSession must be inside <SessionProvider>")`).
- Suggest defensive null checks for optional remote data.

## 14. Refactor Triggers (AI Awareness)

Trigger hint when:

- File length > 250 lines.
- Duplicate conditional branches appear 3+ times.
- Prop list length > 10 (recommend grouping object prop or context migration).

## 15. Security & Privacy

- Never log full auth tokens.
- Avoid leaking user identifiers in console logs unless behind debug flag.

## 16. Example: Good vs Bad

Bad:

```
<div style={{ display:'flex', gap:'17px' }}>
  <span style={{color:'#fff'}}>Name</span>
</div>
```

Good:

```
<div className={styles.root}>
  <span className={styles.label}>Name</span>
</div>
```

`root` & `label` defined in `name.module.css` with token-based spacing.

## 17. Roadmap Additions (Future)

- Automated script to scan for inline styles.
- Detector for unapproved breakpoints.
- Lint rule for maximum component file length.

_End of file._

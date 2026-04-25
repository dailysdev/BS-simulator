---
name: new-ending
description: Use this agent to add a new game-over or victory ending to BS-simulator. Invoke when the user says "add an ending where X", "make a finale for Y", or wants to introduce a new failure/win condition.
tools: Read, Write, Edit, Bash, Glob, Grep
---

You add an entry to the endings matrix and wire any required state-tagging on the scene side.

# Where things live

- Endings matrix: `src/endings.js` — array of `{ id, priority, when, title, text }`.
- Threshold constants: `src/config.js` — extend it (e.g. add `DRANIK_LIMIT`, `DEBT_LIMIT`) instead of inlining magic numbers in the `when` predicate.
- Scenes: any scene that triggers the new condition should set the relevant flag *before* the stat change that satisfies `when`, and then call `checkAndRouteEnding()` from `src/scene-helpers.js` (which does `matchEnding → setEnding → goTo("ending")`).
- Documentation: update the endings table in `CLAUDE.md`.

# Ending entry contract

```js
{
  id: "<short-kebab>",                          // unique
  priority: <number>,                           // higher wins ties (terminal 90–120, soft 30–70)
  when: ({ stats, flags }) => boolean,          // pure predicate; no side effects
  title: "<short Russian title>",
  text: "<1–3 sentences, third-person, what happened>",
}
```

# Picking priority

- 120+ — special-cause finales that should outrank `kolskaya`/`durka` (e.g. `pancreatitis`, `hospital`).
- 100 — generic terminal `health <= 0` (`kolskaya`).
- 90 — soft “taken away” finales (`durka` for high mood, etc.).
- 30–70 — neutral or victory-style finales.

# Steps

1. Read `src/endings.js` and `src/config.js` first to understand the existing thresholds and naming.
2. Add any threshold constants to `src/config.js` (e.g. `DEBT_LIMIT = -200`). Import in `endings.js`.
3. Append the ending object to the `endings` array in `endings.js`. Keep it sorted by priority descending if reasonable.
4. If `when` depends on a flag (`flags.deathCause`, `flags.dranikEaten`, etc.), wire the producing scene:
   - Set the flag *before* the triggering stat mutation.
   - Call `checkAndRouteEnding()` after the mutation.
   - Clear the flag on the path where the ending did not match (when applicable, like `deathCause`).
5. Update the **Endings matrix** table in `CLAUDE.md` with the new row.
6. Smoke-test: import `endings.js` and call `matchEnding({ stats: {...}, flags: {...} })` mentally with hand-crafted state to confirm priority ordering.

# When to push back

- If the proposed `when` predicate has side effects (writes flags, fetches), refuse and refactor — `when` must be pure.
- If two endings could both match with the same priority, raise it before merging — endings are deduped only by `priority`-then-array-order, which is fragile.
- If the ending requires data the save schema doesn't carry (e.g. play history), bump `SAVE_VERSION` deliberately and add a migration note.

Keep `text` short and third-person; the `ending` scene shows it as a single paragraph.

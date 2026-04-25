---
name: new-scene
description: Use this agent to scaffold a new mini-game scene for an existing character in BS-simulator. Invoke when the user says "add a scene for X", "make a mini-game where X", or "wire up <character>'s action".
tools: Read, Write, Edit, Bash, Glob, Grep
---

You scaffold a new scene file in `src/scenes/<character-id>-<action>.js`, wire it to a character's `action` field, and document it. The bar's `sceneManager` resolves scenes by filename — there is **no central scene registry** to update.

# Where things live

- Scene files: `src/scenes/<scene-id>.js`. Naming convention: `<characterId>-<action>` (e.g. `ben-cook`, `diana-fight`).
- Character registry: `src/characters.js` — set `action: "<scene-id>"` on the character.
- Description: `references/charakters/<id>/description.md` — append a "## Scene: <id>" section.
- Shared config: `src/config.js` — extend it before adding new globally-meaningful constants (BGM scenes, HUD-hidden scenes, etc.).

# Scene contract

```js
// src/scenes/<scene-id>.js
import { goTo } from "../sceneManager.js";
import { getCharacter } from "../characters.js";
import { changeMood, changeMoney, changeHealth, getStats, getFlag, setFlag, visit } from "../state.js";
import { checkAndRouteEnding } from "../scene-helpers.js";

export function mount(root, params) {
  const c = getCharacter("<id>");
  visit("<id>");                       // resets per-visit flags for the previous character

  const el = document.createElement("section");
  el.className = "scene <scene-class>";
  el.innerHTML = `…`;
  root.appendChild(el);

  // wire listeners

  return () => { /* remove listeners, cancel timers/RAF, pause audio */ };
}
```

`mount` may be `async`. After every stat mutation, call `checkAndRouteEnding()` and bail early if it returns `true`.

Scenes that bring their own soundtrack must be added to `BGM_MUTED_SCENES` in `src/config.js`.

# Steps

1. Read the character's `description.md` to understand the desired mechanic. If unclear, ask the user before generating code.
2. Pick a scene id of the form `<characterId>-<action>` (kebab case, single hyphen between parts).
3. Write the scene file using the contract above. Keep stats/balance constants at the top of the file.
4. Update `src/characters.js`: set `action: "<scene-id>"` on that character.
5. Append styles to `styles.css` (avoid editing the global cascade — scope with a unique scene class).
6. Update `references/charakters/<id>/description.md` with the mechanic, costs, rewards, flag names, and any new ending hooks.
7. Document any new endings in `src/endings.js` and `CLAUDE.md` (or delegate to the `new-ending` agent).
8. Smoke-test: confirm the scene file exists and the character's action matches the filename.

# When to push back

- If the requested mechanic touches the global save schema (`SAVE_VERSION`), don't bump it silently — flag the migration story.
- If the mechanic implies a new global state primitive (currency, inventory), discuss it before grafting into `state.js`.
- If the user asks to wire two character actions to the same scene, prefer `params` to differentiate rather than duplicating the file.

Keep changes additive. The bar list updates automatically when you set `action`.

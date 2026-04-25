# Beer Station Simulator

A mobile-style web mini-game (static HTML/JS, no bundler). Launch with `python3 -m http.server 8080` from the repo root.

## Architecture

```
index.html              → shell (#app + global HUD + #bgm <audio>)
styles.css              → all styles
src/main.js             → bootstrap: mounts HUD, arms BGM, opens splash
src/config.js           → game-wide constants (save key, starting stats, thresholds, BGM)
src/sceneManager.js     → scene router (dynamic import by name), toggles HUD + BGM
src/state.js            → game state + emitter + persistence (localStorage)
src/hud.js              → HUD (3 stats), single instance for the whole app
src/bgm.js              → background music controller (singleton <audio id="bgm">)
src/scene-helpers.js    → cross-scene helpers (currently: checkAndRouteEnding)
src/characters.js       → character registry (id, name, role, avatar, scene, focus, action)
src/endings.js          → endings matrix
src/jokes.js            → jokes source (external API + local fallback)
src/scenes/*.js         → scenes. Contract: `export function mount(root, params?) { return cleanup? }`
```

### Scene contract

```js
export function mount(root, params) {
  // render DOM into root
  // wire listeners
  return () => { /* remove listeners, cancel timers */ };
}
```

`mount` may be `async`; `sceneManager` awaits it.

`sceneManager.goTo(name, params)` calls the previous scene's cleanup, clears `#app`, shows/hides the HUD based on `hudHiddenIn`, and dynamically imports `./scenes/<name>.js?v=<cache-bust>`. **Adding a new scene = drop the file at `src/scenes/<scene-id>.js` and wire a character's `action` to that id — no edits to `sceneManager` required.**

The scene loader uses a `Date.now()` cache-bust so scene edits appear on reload. `bar.js` likewise dynamically imports `characters.js` with cache-bust so character registry edits pick up without a hard reload.

### HUD

The HUD lives **outside** `#app` (in `<body>`) so it survives scene swaps. Mounted once from `main.js`. Subscribes to `state.onChange` and re-renders on every stat change.

Hidden on scenes in `hudHiddenIn` (`splash`, `ending`). Each stat change triggers a pulse/shake + a floating `+N` / `-N` delta (green up, red down).

## Game state

Stored in `localStorage` under `bs-simulator:save:v2`. Mismatched `version` → ignored (save schema bumps wipe old saves).

```js
{
  version: 2,
  stats: { mood, money, health },
  flags: { /* per-game flags */ },
  ending: null | "<id>",
  progress: { currentScene, completedQuests: [] }
}
```

### Stats

| Stat     | Start | Bounds           | Notes                                    |
|----------|------:|------------------|------------------------------------------|
| `health` |    5  | `>= 0` (clamp)   | Health. `0` → ending.                    |
| `money`  |  200  | any (±)          | zł. Can go negative.                     |
| `mood`   |    0  | any (±)          | Mood. Rises from jokes, wins, etc.       |

Helpers in `state.js`:
- `changeMood(n)`, `changeMoney(n)`, `changeHealth(n)` — increment (negative allowed, fractional values allowed).
- `getStats()`, `getState()`.
- `setEnding(id)` — record the ending in the save.
- `getFlag(key)` / `setFlag(key, value)` — arbitrary progression flags (live in `state.flags`).
- `visit(characterId)` — call this in `mount` of every character-action scene. Returns `{ isNewVisit, prev }`: `isNewVisit=true` when the previous visit was to a different character. Scenes use this to reset per-visit cooldown flags.
- `onChange(fn)` — subscribe (used by HUD).

After any stat change a scene **must** check endings via the shared helper:

```js
import { changeMood } from "../state.js";
import { checkAndRouteEnding } from "../scene-helpers.js";

changeMood(1);
if (checkAndRouteEnding()) return; // bail — scene was unmounted into the ending
```

`checkAndRouteEnding()` runs `matchEnding(getState())`, calls `setEnding`, and routes to the `ending` scene if a rule matched. It returns `true` when it navigated, `false` otherwise.

## Endings matrix

Defined in `src/endings.js`. Each rule:

```js
{ id, priority, when: (state) => boolean, title, text }
```

`matchEnding(state)` returns the ending with the highest `priority` among those whose `when` returns true, or `null`.

| id             | priority | condition                                           | title                         |
|----------------|---------:|-----------------------------------------------------|-------------------------------|
| `pancreatitis` |      120 | `flags.dranikEaten >= 8`                            | Pancreatitis from draniks     |
| `hospital`     |      110 | `stats.health <= 0 && flags.deathCause === "fight"` | Taken to hospital             |
| `kolskaya`     |      100 | `stats.health <= 0`                                 | Taken to the Kolska drunk tank|
| `durka`        |       90 | `stats.mood > 50`                                   | Taken to the psych ward       |

### Death source tagging

Some endings care about *how* the player died, not just that HP hit 0. The convention: before the stat change that might zero HP, set a transient flag describing the cause, then clear it after endings are matched.

- Diana's fight sets `flags.deathCause = "fight"` just before applying `LOSS_HEALTH`; the `hospital` ending only matches with that flag. Clear (`deathCause = null`) after the check so future damage from other sources doesn't misroute.

### Adding an ending

1. Add an entry to the `endings` array in `endings.js`.
2. Pick `priority`: higher = wins in ties. Terminal deaths 90–120; softer outcomes 30–70.
3. `when(state)` — pure function of `state` (stats + flags).
4. `text` is short, third-person, describes what happened.

## Characters & actions

Registry: `src/characters.js`. Schema:

```js
{
  id, name, language, role,
  avatar: "references/charakters/<id>/avatar.png",    // bar tile portrait
  scene:  "references/charakters/<id>/scene.png",     // scene background (optional)
  focus: "50% 30%",                                   // background-position for the scene image
  game?: "<mini-game tag>",
  action?: "<scene-id>",                              // if present, clicking the guest opens this scene
  hidden?: true,                                      // omit from the bar list
}
```

`avatar` is the portrait shown in the bar tile; `scene` (optional) is the larger composed image used as the background inside the character's scene. Scenes fall back to `avatar` when `scene` is missing.

`hidden: true` removes the character from the bar list without deleting them (e.g. `vital` is currently hidden).

### Character actions (scenes)

One action = one scene. Naming: `src/scenes/<character-id>-<action>.js`, scene id `<character-id>-<action>`.

Mechanic details live next to each character in `references/charakters/<id>/description.md`. Quick index:

- `shkolnik-jokes` → [shkolnik/description.md](references/charakters/shkolnik/description.md)
- `otec-bar`, `otec-beerpong` → [otec/description.md](references/charakters/otec/description.md)
- `vlados-drink` → [vlados/description.md](references/charakters/vlados/description.md)
- `malyshka-borrow` → [malyshka/description.md](references/charakters/malyshka/description.md)
- `ben-cook` → [ben/description.md](references/charakters/ben/description.md)
- `diana-fight` → [diana/description.md](references/charakters/diana/description.md)

### Adding a new action

1. Create `src/scenes/<id>-<action>.js` following the scene contract.
2. Add `action: "<id>-<action>"` on the character in `characters.js`.
3. Inside the scene, call `visit("<id>")` and `change*(n)`, then `if (checkAndRouteEnding()) return;`.
4. Document the mechanic in `references/charakters/<id>/description.md`.

`sceneManager` requires no edit — scenes are resolved by filename.

## Jokes source

`src/jokes.js`:
- Primary: `https://rzhunemogu.ru/Rand.aspx?CType=11` (“vulgar” category) via `https://api.codetabs.com/v1/proxy?quest=…`. Response is windows-1251, decoded via `TextDecoder`.
- Fallback: ~10 local jokes so the game stays playable offline.
- Already-seen fallback jokes are remembered per session and do not repeat until the pool is exhausted.

## Style and UX

- Mobile layout: `#app` up to 480px wide, centered, `min-height: 100dvh`.
- HUD fixed top-right, respects `env(safe-area-inset-top)`.
- Bar guest list is a horizontal scroll (160px fixed-width cards, scroll-snap).
- Colors: `--bg #0a0608`, `--fg #f4ead5`, `--accent #e8312a`.
- No emoji in UI (plain text labels: `HP`, `zł`, `MOOD`).

## Commands

```
python3 -m http.server 8080   # serve
open http://localhost:8080
```

Wipe save manually:
```js
localStorage.removeItem("bs-simulator:save:v2");
```

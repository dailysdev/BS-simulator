name: Shkolnik
language: Russian
role: Guest
game: Vulgar jokes

## Scene: shkolnik-jokes

Shkolnik tells vulgar jokes on demand.

- Scene file: `src/scenes/shkolnik-jokes.js`
- Source: rzhunemogu.ru (“vulgar” category) via the CORS proxy `api.codetabs.com`. Response is windows-1251, decoded with `TextDecoder`.
- Fallback: local jokes bank in `src/jokes.js` (~10 entries). Already-shown fallback jokes are remembered per session and don't repeat until the pool is drained.
- Effect: `+1 mood` per joke read.
- Buttons: “Ещё” (next joke) / “Выйти”.

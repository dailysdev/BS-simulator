name: Ben
language: Russian
role: Cook
game: Snack (QTE)

## Scene: ben-cook

Ben offers to order draniki (potato pancakes) for `20 zł`. The player “cooks” through 3 QTE rounds — stop the moving pointer inside the green zone.

- Scene file: `src/scenes/ben-cook.js`
- Cost: `20 zł` deducted on order.
- Each order increments `flags.dranikEaten`. Reaching `8` triggers the `pancreatitis` ending (see [CLAUDE.md](../../../CLAUDE.md) → Endings matrix).
- Mechanic: the pointer moves as a triangle wave via RAF. The green zone is ~22% wide at center; the inner “perfect” zone is ~8% (also counts as a hit).
- Result (by hit count out of 3):
  - **3** — Masterpiece: `+2 health`, `+5 mood`.
  - **2** — Decent: `+1 health`, `+3 mood`.
  - **1** — Burnt: `+0 health`, `-2 mood`.
  - **0** — Charcoal: `+0 health`, `-5 mood`.
- After the result: “Ещё” (re-order for 20 zł) and “Выйти”.
- If the player has less than 20 zł the order button is disabled and Ben refuses (“Без денег не кормлю”).
- Main source of `health` recovery in the game (besides Otec's «кранувка»).

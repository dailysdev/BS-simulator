name: Otec
language: Russian
role: Bar owner
game: Bar + Beer pong

## Scene 1: otec-bar

Otec pours drinks at the bar.

- Scene file: `src/scenes/otec-bar.js`
- Each paid drink: `+5 mood`, deducts its price from `money`, adjusts `health` (depends on the drink).
- “Кранувка плиз” is free, `+0.5 health`, **one per visit**. Flag: `kranuvkaUsed`. Reset when the player visits another character (tracked via `visit()` in `state.js`).
- From here the player can also enter the `otec-beerpong` mini-game.

## Scene 2: otec-beerpong

Physics-based beer pong.

- Scene file: `src/scenes/otec-beerpong.js`
- Stake: `50 zł`. Three cups per side.
- A targeting line oscillates above the top row via a RAF loop. On “Бросок” the line locks and the ball flies on a parabola. Hit is determined by the x-coordinate of the landing relative to the cup radius.
- Otec throws automatically: ~55% hit rate with random offset.
- Win: `+50 money`, `+10 mood`.
- Loss: `-50 money`.

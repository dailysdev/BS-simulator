name: Diana
language: Russian
role: Guest
game: Fighting (Mortal Kombat style)

## Scene: diana-fight

A Mortal Kombat-styled duel. Both fighters start at 100 HP; the original MK theme loops in the background.

- Scene file: `src/scenes/diana-fight.js`
- Music: `references/charakters/diana/theme.mp3` (looped, volume 0.45). Browsers may block autoplay until the first tap — the scene retries on `pointerdown`.
- Rematchable without limit. Each cleared run increments `flags.dianaWins` and scales Diana up.

### Controls

- **Удар (Punch)** — 6–10 damage, 550 ms cooldown.
- **Пинок (Kick)** — 12–18 damage, 1100 ms cooldown.
- **Блок (Block)** — hold to reduce incoming damage to 20% of raw roll. Attacking while blocking is disabled.

### Diana AI (LVL 1 base)

- Attacks every 950–1500 ms for 12–20 damage.
- Blocks incoming hits with 20% chance (incoming damage reduced to 20%).

### Difficulty scaling

For every `dianaWins` cleared:

- Attack interval: `-90 ms` min & max (floors: 450 / 900 ms).
- Damage min: `+1`, damage max: `+2`.
- Block chance: `+0.05`, capped at `0.55`.

The bar and intro banner show the current level (`ДИАНА · LVL N`, `ROUND N`).

### Outcome

- **Win** (Diana HP ≤ 0): `+30 zł`, `+15 mood`, banner “FLAWLESS!” / “LVL N CLEAR!”, increments `dianaWins`. Buttons: “Ещё раз” (re-enters the fight) and “В бар”.
- **Loss** (player HP ≤ 0): sets `flags.deathCause = "fight"` before `-2 health` so the `hospital` ending takes priority over `kolskaya` on death. Banner “K.O.”. Buttons: “Ещё раз” and “В бар”.

### Effects

- Hit: screen-shake on the struck card + red `-N` pop-up.
- Player block: blue glow on the player card while held.
- Diana block: brief blue pulse on Diana's card when she blocks a hit.
- Banners “FIGHT!” / “ROUND N” / “K.O.” / “FLAWLESS!” animate over 1.2 s.

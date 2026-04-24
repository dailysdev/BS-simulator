name: Malyshka
language: Belarusian
role: Guest
game: Borrow money

## Scene: malyshka-borrow

Malyshka can spot the player `50 zł`.

- Scene file: `src/scenes/malyshka-borrow.js`
- Loan: `+50 money`, `-10 mood`, debt (flag `malyshkaDebt`) increases by 50.
- Current debt is always visible.
- **One loan per visit** (flag `malyshkaBorrowedThisVisit`). A second attempt in the same visit triggers a random snarky refusal with no stat change.
- `malyshkaBorrowedThisVisit` resets when the player visits another character (tracked via `visit()` in `state.js`).

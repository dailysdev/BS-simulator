name: Vlados
language: Belarusian
role: Guest
game: Out-drink Vlados (Rock-Paper-Scissors)

## Scene: vlados-drink

Vlados offers a “парэчка” (currant liqueur) round in Belarusian. Mechanic: Rock-Paper-Scissors, match to 3 round wins.

- Scene file: `src/scenes/vlados-drink.js`
- Round:
  - Player loses: `-0.5 health`, `-5 mood`.
  - Ties don't count — replay.
  - Player wins the round: score increments.
- Match (first to 3):
  - Player wins → fullscreen playback of `references/charakters/vlados/vlados.mp4` (with a “Далей” skip button), then `+20 money`, `+10 mood`. Sets flag `vladosBeaten`; re-entries are blocked with “Хопіць, братка…”.
  - Player loses (Vlados 3) → “Выйсці” button, no extra penalty beyond the per-round damage.
- If `health → 0` on a losing round → routes to the appropriate death ending (`kolskaya` by default).

## Visuals

- Top-center score pill shows two sets of 3 dots with a `:` separator, no text labels.

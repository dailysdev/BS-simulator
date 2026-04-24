name: Малышка
language: Belarusian
role: Гость
game: Одолжить денег

## Игра: malyshka-borrow

У Малышки можно стрельнуть `50 zł`.

- Сцена: `src/scenes/malyshka-borrow.js`
- Заём: `+50 money`, `-10 mood`, долг (флаг `malyshkaDebt`) увеличивается на 50.
- Текущий размер долга всегда виден на экране.
- **Один заём за заход** (флаг `malyshkaBorrowedThisVisit`). Вторая попытка в тот же визит — случайный язвительный отказ без изменения статов.
- Флаг `malyshkaBorrowedThisVisit` сбрасывается после визита к другому персонажу (через `visit()` в `state.js`).

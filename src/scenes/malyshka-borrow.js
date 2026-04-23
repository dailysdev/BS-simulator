import { goTo } from "../sceneManager.js";
import { getCharacter } from "../characters.js";
import {
  changeMood,
  changeMoney,
  getState,
  getFlag,
  setFlag,
  setEnding,
} from "../state.js";
import { matchEnding } from "../endings.js";

const BORROW = 50;
const MOOD_COST = -10;

const LINES = [
  "Ну шо, зноў пазычаеш?",
  "Давай, дружа. Памятай, ты мне павінен.",
  "Ай, чорт з табой. Трымай.",
  "Толькі каб аддаў, добра?",
];

export function mount(root) {
  const c = getCharacter("malyshka");

  const el = document.createElement("section");
  el.className = "scene joke-scene malyshka-borrow";
  el.innerHTML = `
    <button class="bar__back" data-action="back" aria-label="Назад">←</button>

    <div class="joke-scene__portrait"
         style="background-image:url('${c.portrait}'); background-position:${c.focus}"></div>

    <div class="joke-scene__panel">
      <div class="joke-scene__speaker">${c.name}</div>
      <div class="debt" data-role="debt"></div>
      <div class="joke-scene__text" data-role="text">${pick(LINES)}</div>
      <div class="vlados-actions">
        <button class="btn" data-action="borrow">Стрэльнуць 50 zł</button>
      </div>
    </div>
  `;
  root.appendChild(el);

  const debtEl = el.querySelector('[data-role="debt"]');
  const textEl = el.querySelector('[data-role="text"]');

  const renderDebt = () => {
    const d = getFlag("malyshkaDebt") || 0;
    debtEl.innerHTML = d
      ? `Павінны Малышцы: <span class="debt__value">${d} zł</span>`
      : `Пакуль нічога не павінны.`;
  };
  renderDebt();

  const borrow = () => {
    changeMoney(BORROW);
    changeMood(MOOD_COST);
    const cur = getFlag("malyshkaDebt") || 0;
    setFlag("malyshkaDebt", cur + BORROW);

    const e = matchEnding(getState());
    if (e) {
      setEnding(e.id);
      return goTo("ending", { id: e.id });
    }

    textEl.textContent = pick(LINES);
    renderDebt();
  };

  const onClick = (ev) => {
    if (ev.target.closest('[data-action="back"]')) return goTo("bar");
    if (ev.target.closest('[data-action="borrow"]')) return borrow();
  };
  el.addEventListener("click", onClick);

  return () => el.removeEventListener("click", onClick);
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

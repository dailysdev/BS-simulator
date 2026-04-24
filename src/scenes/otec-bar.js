import { goTo } from "../sceneManager.js";
import { getCharacter } from "../characters.js";
import {
  changeMood,
  changeMoney,
  changeHealth,
  getState,
  getFlag,
  setFlag,
  setEnding,
  visit,
} from "../state.js";
import { matchEnding } from "../endings.js";

const drinks = [
  { id: "piwo", name: "Пиво", price: 15, mood: 5, health: -0.5 },
  { id: "parechka", name: "Парэчка", price: 10, mood: 5, health: -0.5 },
  { id: "kranuvka", name: "Кранувка плиз", price: 0, mood: 5, health: 0.5, once: true },
];

export function mount(root) {
  const c = getCharacter("otec");
  const { isNewVisit } = visit("otec");
  if (isNewVisit) setFlag("kranuvkaUsed", false);
  const el = document.createElement("section");
  el.className = "scene joke-scene otec-bar";
  el.innerHTML = `
    <button class="bar__back" data-action="back" aria-label="Назад">←</button>

    <div class="joke-scene__portrait"
         style="background-image:url('${c.portrait}'); background-position:${c.focus}"></div>

    <div class="joke-scene__panel">
      <div class="joke-scene__speaker">${c.name} · ${c.role}</div>
      <div class="joke-scene__text">Что наливать, дружище?</div>
      <div class="menu" data-role="menu"></div>
      <button class="menu__item menu__item--pong" data-action="pong">
        <span class="menu__name">Сыграть в бирпонг</span>
        <span class="menu__price">ставка 50 zł</span>
      </button>
    </div>
  `;
  root.appendChild(el);

  const menuEl = el.querySelector('[data-role="menu"]');

  const render = () => {
    menuEl.innerHTML = drinks.map(renderDrink).join("");
  };

  const renderDrink = (d) => {
    const disabled = d.once && getFlag("kranuvkaUsed") ? "disabled" : "";
    const priceLabel = d.price === 0 ? "0 zł" : `${d.price} zł`;
    const note = d.once && getFlag("kranuvkaUsed") ? '<span class="menu__note">уже наливал</span>' : "";
    return `
      <button class="menu__item" data-drink="${d.id}" ${disabled}>
        <span class="menu__name">${d.name}</span>
        <span class="menu__price">${priceLabel}</span>
        ${note}
      </button>
    `;
  };

  const buy = (d) => {
    if (d.once && getFlag("kranuvkaUsed")) return;
    changeMoney(-d.price);
    changeHealth(d.health);
    changeMood(d.mood);
    if (d.once) setFlag("kranuvkaUsed", true);

    const e = matchEnding(getState());
    if (e) {
      setEnding(e.id);
      return goTo("ending", { id: e.id });
    }
    render();
  };

  const onClick = (ev) => {
    if (ev.target.closest('[data-action="back"]')) return goTo("bar");
    if (ev.target.closest('[data-action="pong"]')) return goTo("otec-beerpong");
    const btn = ev.target.closest("[data-drink]");
    if (!btn || btn.disabled) return;
    const d = drinks.find((x) => x.id === btn.dataset.drink);
    if (d) buy(d);
  };
  el.addEventListener("click", onClick);

  render();

  return () => el.removeEventListener("click", onClick);
}

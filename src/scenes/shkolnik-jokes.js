import { goTo } from "../sceneManager.js";
import { getCharacter } from "../characters.js";
import { fetchJoke } from "../jokes.js";
import { changeMood, getState, setEnding, visit } from "../state.js";
import { matchEnding } from "../endings.js";

const LAUGHS = [
  "Апхапаха",
  "Кхекхекхе",
  "Бугога",
  "Ржунимагу",
  "Гыгыгы",
  "Ахахаха",
  "Хехехе",
  "Ыыыыы",
  "Пфхаха",
  "Охохо",
  "Ёмаё",
  "Угарнул",
  "Ору",
];

function pickLaugh(prev) {
  const pool = LAUGHS.filter((l) => l !== prev);
  return pool[Math.floor(Math.random() * pool.length)];
}

export function mount(root) {
  visit("shkolnik");
  const c = getCharacter("shkolnik");
  const el = document.createElement("section");
  el.className = "scene joke-scene";
  el.innerHTML = `
    <button class="bar__back" data-action="back" aria-label="Назад">←</button>

    <div class="joke-scene__portrait"
         style="background-image:url('${c.scene || c.avatar}'); background-position:${c.focus}"></div>

    <div class="joke-scene__panel">
      <div class="joke-scene__speaker">${c.name}</div>
      <div class="joke-scene__text" data-role="text">Загружаю анекдот…</div>
      <div class="joke-scene__actions">
        <button class="btn" data-action="read" disabled>…</button>
      </div>
      <div class="joke-scene__source" data-role="source"></div>
    </div>
  `;
  root.appendChild(el);

  const textEl = el.querySelector('[data-role="text"]');
  const sourceEl = el.querySelector('[data-role="source"]');
  const readBtn = el.querySelector('[data-action="read"]');

  let ac = null;
  let lastLaugh = null;

  const refreshLaugh = () => {
    lastLaugh = pickLaugh(lastLaugh);
    readBtn.textContent = `${lastLaugh} (+1)`;
  };

  const load = async () => {
    if (ac) ac.abort();
    ac = new AbortController();
    readBtn.disabled = true;
    readBtn.textContent = "…";
    textEl.textContent = "Загружаю анекдот…";
    sourceEl.textContent = "";
    try {
      const { text, source } = await fetchJoke(ac.signal);
      textEl.textContent = text;
      sourceEl.textContent = source === "local" ? "офлайн-банк" : "rzhunemogu.ru";
      refreshLaugh();
      readBtn.disabled = false;
    } catch (e) {
      if (e.name !== "AbortError") {
        textEl.textContent = "Не получилось загрузить. Попробуй ещё раз.";
        refreshLaugh();
        readBtn.disabled = false;
      }
    }
  };

  const onClick = (e) => {
    if (e.target.closest('[data-action="back"]')) {
      if (ac) ac.abort();
      return goTo("bar");
    }
    if (e.target.closest('[data-action="read"]')) {
      changeMood(1);
      const ending = matchEnding(getState());
      if (ending) {
        setEnding(ending.id);
        if (ac) ac.abort();
        return goTo("ending", { id: ending.id });
      }
      load();
    }
  };
  el.addEventListener("click", onClick);

  load();

  return () => {
    if (ac) ac.abort();
    el.removeEventListener("click", onClick);
  };
}

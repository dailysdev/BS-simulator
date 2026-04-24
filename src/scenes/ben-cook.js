import { goTo } from "../sceneManager.js";
import { getCharacter } from "../characters.js";
import {
  changeMood,
  changeMoney,
  changeHealth,
  getState,
  getStats,
  setEnding,
  visit,
} from "../state.js";
import { matchEnding } from "../endings.js";

const DISH_PRICE = 20;
const ROUNDS = 3;
const POINTER_SPEED = 0.9; // traversals per second
const GREEN_ZONE = 0.22; // width fraction
const PERFECT_ZONE = 0.08; // width fraction

const STEP_LABELS = ["Нашинкуй", "Обжарь", "Подай"];

const RESULTS = {
  3: {
    title: "Шедэўр!",
    text: "Бен: «Вось гэта я разумею, хлопец. З'еш, пакуль гарачае».",
    health: 2,
    mood: 5,
  },
  2: {
    title: "Нармальна",
    text: "Бен: «Жраць можна. Не фестываль, але сытна».",
    health: 1,
    mood: 3,
  },
  1: {
    title: "Прыгарэла",
    text: "Бен: «Ну ты і кухар… Еш сваё падгарэлае».",
    health: 0,
    mood: -2,
  },
  0: {
    title: "Згарэла ўшчэнт",
    text: "Бен: «Гэта нават сабака не возьме. Плаці за прадукты».",
    health: 0,
    mood: -5,
  },
};

export function mount(root) {
  const c = getCharacter("ben");
  visit("ben");

  const el = document.createElement("section");
  el.className = "scene joke-scene ben-cook";
  el.innerHTML = `
    <button class="bar__back" data-action="back" aria-label="Назад">←</button>

    <div class="joke-scene__portrait joke-scene__portrait--dim"
         style="background-image:url('${c.portrait}'); background-position:${c.focus}"></div>

    <div class="joke-scene__panel">
      <div class="joke-scene__speaker">${c.name} · ${c.role}</div>
      <div class="joke-scene__text" data-role="text">Бен: «Закажаш закусь? Дранікі, 20 zł. Але гатаваць будзеш сам — я толькі падказваю».</div>
      <div class="cook" data-role="stage"></div>
      <div class="joke-scene__actions" data-role="actions"></div>
    </div>
  `;
  root.appendChild(el);

  const textEl = el.querySelector('[data-role="text"]');
  const stageEl = el.querySelector('[data-role="stage"]');
  const actionsEl = el.querySelector('[data-role="actions"]');

  let phase = "menu"; // menu | playing | result
  let round = 0;
  let hits = 0;
  let rafId = null;
  let startTs = 0;

  const cleanupFns = [];

  function renderMenu() {
    phase = "menu";
    stageEl.innerHTML = "";
    const canAfford = getStats().money >= DISH_PRICE;
    actionsEl.innerHTML = `
      <button class="btn btn--primary" data-action="order" ${canAfford ? "" : "disabled"}>Заказать (${DISH_PRICE} zł)</button>
      <button class="btn" data-action="back">Выйти</button>
    `;
    if (!canAfford) {
      textEl.textContent = "Бен: «Без грошай не кармлю, брат. Ідзі зарабі».";
    }
  }

  function startGame() {
    changeMoney(-DISH_PRICE);
    round = 0;
    hits = 0;
    phase = "playing";
    renderRound();
  }

  function renderRound() {
    textEl.textContent = `Крок ${round + 1}/${ROUNDS}: ${STEP_LABELS[round]}. Жми, калі стрэлка ў зялёнай зоне.`;
    stageEl.innerHTML = `
      <div class="cook__track">
        <div class="cook__zone cook__zone--green" style="left:${(50 - GREEN_ZONE * 50).toFixed(2)}%; width:${(GREEN_ZONE * 100).toFixed(2)}%"></div>
        <div class="cook__zone cook__zone--perfect" style="left:${(50 - PERFECT_ZONE * 50).toFixed(2)}%; width:${(PERFECT_ZONE * 100).toFixed(2)}%"></div>
        <div class="cook__pointer" data-role="pointer"></div>
      </div>
      <div class="cook__hits" data-role="hits">${renderHitsDots()}</div>
    `;
    actionsEl.innerHTML = `
      <button class="btn btn--primary" data-action="strike">Гатова!</button>
    `;
    startPointer();
  }

  function renderHitsDots() {
    let s = "";
    for (let i = 0; i < ROUNDS; i++) {
      if (i < round) s += `<span class="cook__dot cook__dot--${hits > i ? "hit" : "miss"}"></span>`;
      else s += `<span class="cook__dot"></span>`;
    }
    return s;
  }

  function startPointer() {
    const pointer = stageEl.querySelector('[data-role="pointer"]');
    startTs = performance.now();
    const loop = (ts) => {
      const elapsed = (ts - startTs) / 1000;
      // triangle wave 0..1..0 with period = 2 / POINTER_SPEED
      const period = 2 / POINTER_SPEED;
      const t = (elapsed % period) / period; // 0..1
      const pos = t < 0.5 ? t * 2 : (1 - t) * 2; // 0..1..0
      pointer.style.left = `${pos * 100}%`;
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
  }

  function stopPointer() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  function strike() {
    if (phase !== "playing") return;
    const pointer = stageEl.querySelector('[data-role="pointer"]');
    stopPointer();
    const leftPct = parseFloat(pointer.style.left) / 100;
    const dist = Math.abs(leftPct - 0.5);
    let hitClass = "miss";
    if (dist <= PERFECT_ZONE / 2) {
      hits += 1;
      hitClass = "perfect";
    } else if (dist <= GREEN_ZONE / 2) {
      hits += 1;
      hitClass = "good";
    }
    pointer.classList.add(`cook__pointer--${hitClass}`);

    round += 1;
    const hitsEl = stageEl.querySelector('[data-role="hits"]');
    if (hitsEl) hitsEl.innerHTML = renderHitsDots();

    setTimeout(() => {
      if (round >= ROUNDS) finish();
      else renderRound();
    }, 520);
  }

  function finish() {
    phase = "result";
    const res = RESULTS[hits];
    if (res.health) changeHealth(res.health);
    if (res.mood) changeMood(res.mood);

    const end = matchEnding(getState());
    if (end) {
      setEnding(end.id);
      return goTo("ending", { id: end.id });
    }

    textEl.textContent = res.text;
    stageEl.innerHTML = `
      <div class="cook__result">
        <div class="cook__result-title">${res.title}</div>
        <div class="cook__result-stats">
          ${res.health ? `<span>+${res.health} HP</span>` : ""}
          ${res.mood > 0 ? `<span>+${res.mood} MOOD</span>` : res.mood < 0 ? `<span>${res.mood} MOOD</span>` : ""}
        </div>
      </div>
    `;
    const canAfford = getStats().money >= DISH_PRICE;
    actionsEl.innerHTML = `
      <button class="btn btn--primary" data-action="order" ${canAfford ? "" : "disabled"}>Яшчэ (${DISH_PRICE} zł)</button>
      <button class="btn" data-action="back">Выйти</button>
    `;
  }

  const onClick = (ev) => {
    const act = ev.target.closest("[data-action]")?.dataset.action;
    if (!act) return;
    if (act === "back") return goTo("bar");
    if (act === "order") return startGame();
    if (act === "strike") return strike();
  };
  el.addEventListener("click", onClick);
  cleanupFns.push(() => el.removeEventListener("click", onClick));

  renderMenu();

  return () => {
    stopPointer();
    cleanupFns.forEach((f) => f());
  };
}

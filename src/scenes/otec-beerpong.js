import { goTo } from "../sceneManager.js";
import { getCharacter } from "../characters.js";
import {
  changeMoney,
  changeMood,
  getState,
  setEnding,
  visit,
} from "../state.js";
import { matchEnding } from "../endings.js";

const BET = 50;
const WIN_MOOD = 10;
const CUPS = 3;
const AIM_SPEED = 0.85; // traversals per second (full arena width one way)
const BALL_DURATION = 780; // ms
const ARC_HEIGHT = 0.55; // fraction of arena height
const OTEC_HIT_CHANCE = 0.55;
const OTEC_NEAR_MISS_OFFSET = 0.6; // in cup-radius units
const OTEC_WILD_MISS_OFFSET_RANGE = [1.5, 2.8];

const PLAYER_HIT = ["Чётко!", "Пошёл, красавчик!", "Есть!"];
const PLAYER_MISS = ["Мимо…", "Рука дрогнула.", "В молоко."];
const OTEC_HIT = ["Отец попал.", "Опытный, чёрт.", "Пей."];
const OTEC_MISS = ["Отец мажет.", "Промах Отца.", "Пролетел!"];

const WIN_PHRASE = "Забрал банк! Так-то.";
const LOSS_PHRASE = "Отец обыграл. Пятьдесят как не бывало.";

export function mount(root) {
  const c = getCharacter("otec");
  visit("otec");

  const el = document.createElement("section");
  el.className = "scene joke-scene otec-beerpong";
  el.innerHTML = `
    <button class="bar__back" data-action="back" aria-label="Назад">←</button>

    <div class="joke-scene__portrait joke-scene__portrait--dim"
         style="background-image:url('${c.scene || c.avatar}'); background-position:${c.focus}"></div>

    <div class="pong" data-role="arena">
      <div class="pong__row pong__row--otec">
        ${cupMarkup("otec")}
      </div>

      <div class="pong__aim" data-role="aim" hidden></div>

      <div class="pong__row pong__row--player">
        ${cupMarkup("player")}
      </div>

      <div class="pong__ball" data-role="ball" hidden></div>
    </div>

    <div class="joke-scene__panel pong__panel">
      <div class="joke-scene__speaker">${c.name} · БИРПОНГ · ${BET} zł</div>
      <div class="joke-scene__text" data-role="text">Ставка ${BET} zł. По тры стакана. Гуляем?</div>
      <div class="vlados-actions" data-role="actions"></div>
    </div>
  `;
  root.appendChild(el);

  const textEl = el.querySelector('[data-role="text"]');
  const actionsEl = el.querySelector('[data-role="actions"]');
  const arena = el.querySelector('[data-role="arena"]');
  const aim = el.querySelector('[data-role="aim"]');
  const ball = el.querySelector('[data-role="ball"]');

  const otecCupEls = [...el.querySelectorAll("[data-cup-otec]")];
  const playerCupEls = [...el.querySelectorAll("[data-cup-player]")];
  const otecCups = Array(CUPS).fill(true);
  const playerCups = Array(CUPS).fill(true);

  let rafId = null;
  let aimX = 0;
  let aimDir = 1;
  let arenaRect = null;
  let finished = false;

  const refreshRect = () => {
    arenaRect = arena.getBoundingClientRect();
  };

  const centersFor = (cupEls) => {
    const r0 = arenaRect || arena.getBoundingClientRect();
    return cupEls.map((cupEl) => {
      const r = cupEl.getBoundingClientRect();
      return {
        cx: r.left + r.width / 2 - r0.left,
        cy: r.top + r.height / 2 - r0.top,
        radius: r.width / 2,
      };
    });
  };

  const renderCups = () => {
    otecCupEls.forEach((cup, i) => cup.classList.toggle("cup--empty", !otecCups[i]));
    playerCupEls.forEach((cup, i) => cup.classList.toggle("cup--empty", !playerCups[i]));
  };

  const showStart = () => {
    actionsEl.innerHTML = `
      <button class="btn" data-action="start">Сыграць · ${BET} zł</button>
      <button class="btn btn--ghost" data-action="back">Выйти</button>
    `;
  };

  const showShoot = () => {
    actionsEl.innerHTML = `<button class="btn" data-action="shoot">Бросок</button>`;
  };

  const showBusy = () => {
    actionsEl.innerHTML = `<button class="btn" disabled>…</button>`;
  };

  const showEnd = (phrase) => {
    textEl.textContent = phrase;
    finished = true;
    actionsEl.innerHTML = `<button class="btn" data-action="exit">Выйти</button>`;
  };

  const startAim = () => {
    refreshRect();
    aim.hidden = false;
    aimX = 0;
    aimDir = 1;
    let last = performance.now();
    const tick = (now) => {
      const dt = (now - last) / 1000;
      last = now;
      const w = arenaRect.width;
      aimX += aimDir * AIM_SPEED * w * dt;
      if (aimX > w) { aimX = w; aimDir = -1; }
      if (aimX < 0) { aimX = 0; aimDir = 1; }
      aim.style.transform = `translateX(${aimX}px)`;
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
  };

  const stopAim = () => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    aim.hidden = true;
  };

  const animateBall = (from, to) =>
    new Promise((resolve) => {
      ball.hidden = false;
      const start = performance.now();
      const h = arenaRect.height * ARC_HEIGHT;
      const tick = (now) => {
        const t = Math.min(1, (now - start) / BALL_DURATION);
        const x = from.x + (to.x - from.x) * t;
        const y = from.y + (to.y - from.y) * t - 4 * h * t * (1 - t);
        const scale = 1 - 0.4 * (1 - Math.abs(2 * t - 1));
        ball.style.transform = `translate(${x - 8}px, ${y - 8}px) scale(${scale})`;
        if (t < 1) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });

  const playerShoot = async () => {
    showBusy();
    stopAim();
    refreshRect();
    const targetX = aimX;
    const centers = centersFor(otecCupEls);
    const target = { x: targetX, y: centers[0].cy };
    const from = { x: arenaRect.width / 2, y: arenaRect.height * 0.9 };
    await animateBall(from, target);

    let hitIdx = -1;
    for (let i = 0; i < CUPS; i++) {
      if (!otecCups[i]) continue;
      if (Math.abs(targetX - centers[i].cx) <= centers[i].radius * 0.95) {
        hitIdx = i;
        break;
      }
    }
    if (hitIdx !== -1) {
      otecCups[hitIdx] = false;
      renderCups();
      textEl.textContent = pick(PLAYER_HIT);
    } else {
      textEl.textContent = pick(PLAYER_MISS);
    }
    ball.hidden = true;

    if (otecCups.every((x) => !x)) return resolveMatch(true);

    await wait(650);
    await otecShoot();
  };

  const otecShoot = async () => {
    textEl.textContent = "Отец целится…";
    refreshRect();
    const remainingIdx = playerCups.map((v, i) => (v ? i : -1)).filter((i) => i !== -1);
    const targetIdx = remainingIdx[Math.floor(Math.random() * remainingIdx.length)];
    const centers = centersFor(playerCupEls);
    const target = centers[targetIdx];

    const hit = Math.random() < OTEC_HIT_CHANCE;
    let landX;
    if (hit) {
      landX = target.cx + (Math.random() - 0.5) * target.radius * 0.8;
    } else {
      const near = Math.random() < 0.5;
      const dir = Math.random() < 0.5 ? -1 : 1;
      const factor = near
        ? OTEC_NEAR_MISS_OFFSET + Math.random() * 0.4
        : OTEC_WILD_MISS_OFFSET_RANGE[0] +
          Math.random() *
            (OTEC_WILD_MISS_OFFSET_RANGE[1] - OTEC_WILD_MISS_OFFSET_RANGE[0]);
      landX = target.cx + dir * target.radius * factor;
    }
    landX = clamp(landX, 10, arenaRect.width - 10);

    const from = { x: arenaRect.width / 2, y: arenaRect.height * 0.1 };
    const to = { x: landX, y: target.cy };
    await wait(500);
    await animateBall(from, to);

    let hitIdx = -1;
    for (let i = 0; i < CUPS; i++) {
      if (!playerCups[i]) continue;
      if (Math.abs(landX - centers[i].cx) <= centers[i].radius * 0.95) {
        hitIdx = i;
        break;
      }
    }
    if (hitIdx !== -1) {
      playerCups[hitIdx] = false;
      renderCups();
      textEl.textContent = pick(OTEC_HIT);
    } else {
      textEl.textContent = pick(OTEC_MISS);
    }
    ball.hidden = true;

    if (playerCups.every((x) => !x)) return resolveMatch(false);

    await wait(550);
    startAim();
    showShoot();
  };

  const resolveMatch = (won) => {
    stopAim();
    changeMoney(won ? BET : -BET);
    if (won) changeMood(WIN_MOOD);
    const e = matchEnding(getState());
    if (e) {
      setEnding(e.id);
      return goTo("ending", { id: e.id });
    }
    showEnd(won ? WIN_PHRASE : LOSS_PHRASE);
  };

  const startMatch = () => {
    textEl.textContent = "Прыцэльвайся і кідай!";
    refreshRect();
    startAim();
    showShoot();
  };

  const onClick = (ev) => {
    if (finished && ev.target.closest('[data-action="exit"]')) return goTo("otec-bar");
    if (ev.target.closest('[data-action="back"]')) {
      stopAim();
      return goTo("otec-bar");
    }
    if (ev.target.closest('[data-action="start"]')) return startMatch();
    if (ev.target.closest('[data-action="shoot"]')) return playerShoot();
  };
  el.addEventListener("click", onClick);

  renderCups();
  showStart();

  return () => {
    stopAim();
    el.removeEventListener("click", onClick);
  };
}

function cupMarkup(side) {
  let out = "";
  for (let i = 0; i < CUPS; i++) {
    out += `<span class="cup" data-cup-${side}="${i}"></span>`;
  }
  return out;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

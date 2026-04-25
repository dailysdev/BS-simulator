import { goTo } from "../sceneManager.js";
import { getCharacter } from "../characters.js";
import {
  changeMood,
  changeMoney,
  changeHealth,
  getFlag,
  setFlag,
  visit,
} from "../state.js";
import { checkAndRouteEnding } from "../scene-helpers.js";

const MAX_HP = 100;

// Player — slightly nerfed compared to v1
const PLAYER_PUNCH = { min: 6, max: 10, cooldown: 550, label: "Удар" };
const PLAYER_KICK = { min: 12, max: 18, cooldown: 1100, label: "Пинок" };

// Diana base stats; each previous win (dianaWins) makes her harder
const DIANA_BASE = {
  attackMinMs: 950,
  attackMaxMs: 1500,
  dmgMin: 12,
  dmgMax: 20,
  blockChance: 0.2,
};
const DIANA_PER_WIN = {
  attackMs: -90,    // faster
  dmgMin: 1,
  dmgMax: 2,
  blockChance: 0.05,
};
const DIANA_FLOOR = {
  attackMinMs: 450,
  attackMaxMs: 900,
  blockChanceMax: 0.55,
};

const BLOCK_MITIGATION = 0.2; // incoming dmg multiplier while blocking

const WIN_MONEY = 30;
const WIN_MOOD = 15;
const LOSS_HEALTH = -2;

const INTRO_QUOTES_FIRST = [
  "Диана: «Ну что, боец, попробуешь?»",
  "Диана: «Я в клубной лиге третье место. Удачи».",
  "Диана: «Fight! По-честному, без скидок».",
];
const INTRO_QUOTES_REMATCH = [
  "Диана: «Опять пришёл? На этот раз без поблажек».",
  "Диана: «Помнишь, как было? Теперь будет хуже».",
  "Диана: «Снова ты. Ну, получай по новой».",
];

const WIN_QUOTES = [
  "Ты вырубил Диану. Уважуха.",
  "Flawless-ish. Она ещё шевелится, но встать не может.",
  "Чемпион, забирай банк.",
];
const LOSS_QUOTES = [
  "Диана: «Слабовато. Иди тренируйся».",
  "K.O. Лежишь в отключке, Отец отливает воду.",
  "Finish him? Она уже закончила.",
];

const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function dianaConfig(wins) {
  const scaledAttackMin = Math.max(
    DIANA_FLOOR.attackMinMs,
    DIANA_BASE.attackMinMs + wins * DIANA_PER_WIN.attackMs,
  );
  const scaledAttackMax = Math.max(
    DIANA_FLOOR.attackMaxMs,
    DIANA_BASE.attackMaxMs + wins * DIANA_PER_WIN.attackMs,
  );
  return {
    attackMinMs: scaledAttackMin,
    attackMaxMs: Math.max(scaledAttackMax, scaledAttackMin + 200),
    dmgMin: DIANA_BASE.dmgMin + wins * DIANA_PER_WIN.dmgMin,
    dmgMax: DIANA_BASE.dmgMax + wins * DIANA_PER_WIN.dmgMax,
    blockChance: Math.min(
      DIANA_FLOOR.blockChanceMax,
      DIANA_BASE.blockChance + wins * DIANA_PER_WIN.blockChance,
    ),
  };
}

export function mount(root) {
  const c = getCharacter("diana");
  visit("diana");

  const wins = getFlag("dianaWins") || 0;
  const diana = dianaConfig(wins);

  const el = document.createElement("section");
  el.className = "scene diana-fight";
  el.innerHTML = `
    <button class="bar__back" data-action="back" aria-label="Назад">←</button>
    <audio data-role="music" src="references/charakters/diana/theme.mp3" loop preload="auto"></audio>
    <div class="mk">
      <div class="mk__hud">
        <div class="mk__bar mk__bar--player">
          <div class="mk__bar-name">ТЫ</div>
          <div class="mk__bar-track"><div class="mk__bar-fill" data-role="playerHp"></div></div>
        </div>
        <div class="mk__vs">VS</div>
        <div class="mk__bar mk__bar--enemy">
          <div class="mk__bar-name">ДИАНА · LVL ${wins + 1}</div>
          <div class="mk__bar-track mk__bar-track--rev"><div class="mk__bar-fill" data-role="dianaHp"></div></div>
        </div>
      </div>

      <div class="mk__stage">
        <div class="mk__fighter mk__fighter--player" data-role="playerCard">
          <div class="mk__fighter-sprite mk__fighter-sprite--player"></div>
        </div>
        <div class="mk__fighter mk__fighter--enemy" data-role="dianaCard">
          <div class="mk__fighter-sprite" style="background-image:url('${c.scene || c.avatar}'); background-position:${c.focus}"></div>
        </div>
        <div class="mk__banner" data-role="banner" hidden></div>
      </div>

      <div class="mk__log" data-role="log">${pick(wins === 0 ? INTRO_QUOTES_FIRST : INTRO_QUOTES_REMATCH)}</div>

      <div class="mk__controls" data-role="controls">
        <button class="btn mk__btn" data-action="punch">${PLAYER_PUNCH.label}</button>
        <button class="btn mk__btn mk__btn--block" data-action="block">БЛОК</button>
        <button class="btn mk__btn" data-action="kick">${PLAYER_KICK.label}</button>
      </div>

      <div class="mk__actions" data-role="endActions" hidden></div>
    </div>
  `;
  root.appendChild(el);

  const audioEl = el.querySelector('[data-role="music"]');
  const playerBar = el.querySelector('[data-role="playerHp"]');
  const dianaBar = el.querySelector('[data-role="dianaHp"]');
  const playerCard = el.querySelector('[data-role="playerCard"]');
  const dianaCard = el.querySelector('[data-role="dianaCard"]');
  const logEl = el.querySelector('[data-role="log"]');
  const bannerEl = el.querySelector('[data-role="banner"]');
  const controlsEl = el.querySelector('[data-role="controls"]');
  const endEl = el.querySelector('[data-role="endActions"]');

  let playerHp = MAX_HP;
  let dianaHp = MAX_HP;
  let playerBlocking = false;
  let lastPunch = 0;
  let lastKick = 0;
  let dianaTimer = null;
  let finished = false;
  const cleanupFns = [];

  // Music
  audioEl.volume = 0.45;
  const tryPlay = () => audioEl.play().catch(() => {});
  tryPlay();
  const resume = () => { tryPlay(); };
  el.addEventListener("pointerdown", resume, { once: true });

  function renderBars() {
    playerBar.style.width = `${Math.max(0, playerHp)}%`;
    dianaBar.style.width = `${Math.max(0, dianaHp)}%`;
    playerBar.dataset.low = playerHp <= 30 ? "1" : "0";
    dianaBar.dataset.low = dianaHp <= 30 ? "1" : "0";
  }
  renderBars();

  function showBanner(text, cls = "") {
    bannerEl.textContent = text;
    bannerEl.className = `mk__banner ${cls}`.trim();
    bannerEl.hidden = false;
    setTimeout(() => { bannerEl.hidden = true; }, 1200);
  }

  function hit(cardEl, dmg) {
    cardEl.classList.remove("mk__fighter--hit");
    void cardEl.offsetWidth;
    cardEl.classList.add("mk__fighter--hit");
    const pop = document.createElement("div");
    pop.className = "mk__dmg";
    pop.textContent = `-${Math.round(dmg)}`;
    cardEl.appendChild(pop);
    setTimeout(() => pop.remove(), 700);
  }

  function flashBlock(cardEl) {
    cardEl.classList.remove("mk__fighter--blocked");
    void cardEl.offsetWidth;
    cardEl.classList.add("mk__fighter--blocked");
    setTimeout(() => cardEl.classList.remove("mk__fighter--blocked"), 320);
  }

  function playerAttack(kind) {
    if (finished) return;
    const now = performance.now();
    if (playerBlocking) {
      logEl.textContent = "Нельзя бить, пока блокируешь.";
      return;
    }
    const spec = kind === "kick" ? PLAYER_KICK : PLAYER_PUNCH;
    const last = kind === "kick" ? lastKick : lastPunch;
    if (now - last < spec.cooldown) return;
    if (kind === "kick") lastKick = now; else lastPunch = now;

    const rawDmg = randi(spec.min, spec.max);
    const blocked = Math.random() < diana.blockChance;
    const dmg = blocked ? Math.max(1, Math.round(rawDmg * BLOCK_MITIGATION)) : rawDmg;
    dianaHp -= dmg;
    if (blocked) {
      flashBlock(dianaCard);
      logEl.textContent = `Диана блокирует. ${spec.label}: -${dmg}`;
    } else {
      hit(dianaCard, dmg);
      logEl.textContent = `${spec.label}: -${dmg}`;
    }
    renderBars();
    if (dianaHp <= 0) return endMatch(true);
  }

  function dianaAttack() {
    if (finished) return;
    const dmgRaw = randi(diana.dmgMin, diana.dmgMax);
    const dmg = playerBlocking ? Math.max(1, Math.round(dmgRaw * BLOCK_MITIGATION)) : dmgRaw;
    playerHp -= dmg;
    hit(playerCard, dmg);
    logEl.textContent = playerBlocking
      ? `Диана пробила блок: -${dmg}`
      : `Диана бьёт: -${dmg}`;
    renderBars();
    if (playerHp <= 0) return endMatch(false);
    scheduleDiana();
  }

  function scheduleDiana() {
    clearTimeout(dianaTimer);
    const delay = rand(diana.attackMinMs, diana.attackMaxMs);
    dianaTimer = setTimeout(dianaAttack, delay);
  }
  scheduleDiana();

  function setBlock(on) {
    if (finished) return;
    playerBlocking = on;
    playerCard.classList.toggle("mk__fighter--blocking", on);
  }

  function endMatch(win) {
    if (finished) return;
    finished = true;
    clearTimeout(dianaTimer);
    controlsEl.hidden = true;
    if (win) {
      showBanner(wins === 0 ? "FLAWLESS!" : `LVL ${wins + 1} CLEAR!`, "mk__banner--win");
      logEl.textContent = pick(WIN_QUOTES);
      changeMoney(WIN_MONEY);
      changeMood(WIN_MOOD);
      setFlag("dianaWins", wins + 1);
    } else {
      showBanner("K.O.", "mk__banner--loss");
      logEl.textContent = pick(LOSS_QUOTES);
      setFlag("deathCause", "fight");
      changeHealth(LOSS_HEALTH);
    }

    if (checkAndRouteEnding()) return;
    setFlag("deathCause", null);
    showEndButtons(win);
  }

  function showEndButtons(isWin) {
    endEl.hidden = false;
    endEl.innerHTML = `
      <div class="mk__result">
        ${isWin ? `+${WIN_MONEY} zł · +${WIN_MOOD} MOOD` : `${LOSS_HEALTH} HP`}
      </div>
      <div class="mk__end-actions">
        <button class="btn btn--primary" data-action="rematch">Ещё раз</button>
        <button class="btn" data-action="back">В бар</button>
      </div>
    `;
  }

  const onClick = (ev) => {
    const act = ev.target.closest("[data-action]")?.dataset.action;
    if (!act) return;
    if (act === "back") return goTo("bar");
    if (act === "rematch") return goTo("diana-fight");
    if (act === "punch") return playerAttack("punch");
    if (act === "kick") return playerAttack("kick");
  };
  el.addEventListener("click", onClick);
  cleanupFns.push(() => el.removeEventListener("click", onClick));

  const blockBtn = el.querySelector('[data-action="block"]');
  const blockOn = (ev) => { ev.preventDefault(); setBlock(true); };
  const blockOff = () => setBlock(false);
  blockBtn.addEventListener("pointerdown", blockOn);
  blockBtn.addEventListener("pointerup", blockOff);
  blockBtn.addEventListener("pointerleave", blockOff);
  blockBtn.addEventListener("pointercancel", blockOff);
  cleanupFns.push(() => {
    blockBtn.removeEventListener("pointerdown", blockOn);
    blockBtn.removeEventListener("pointerup", blockOff);
    blockBtn.removeEventListener("pointerleave", blockOff);
    blockBtn.removeEventListener("pointercancel", blockOff);
  });

  showBanner(wins === 0 ? "FIGHT!" : `ROUND ${wins + 1}`, "mk__banner--fight");

  return () => {
    finished = true;
    clearTimeout(dianaTimer);
    audioEl.pause();
    audioEl.src = "";
    cleanupFns.forEach((f) => f());
  };
}

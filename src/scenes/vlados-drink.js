import { goTo } from "../sceneManager.js";
import { getCharacter } from "../characters.js";
import {
  changeMood,
  changeMoney,
  changeHealth,
  getState,
  setEnding,
  getFlag,
  setFlag,
  visit,
} from "../state.js";
import { matchEnding } from "../endings.js";

const CHOICES = [
  { id: "kamen", label: "Камень" },
  { id: "nazhnicy", label: "Нажніцы" },
  { id: "papera", label: "Папера" },
];

const BEATS = { kamen: "nazhnicy", nazhnicy: "papera", papera: "kamen" };

const INTROS = [
  "Ну шо, дружа! Давай па парэчцы? Да трох перамог.",
  "Да трох перамог, добра? Хто першы — той малайчына.",
  "Налью табе парэчкі. Гуляем да трох, дамовіліся?",
];

const BANTER_WIN = ["Эх, пайшла!", "Прамімо, дружа…", "Глых!", "Ну ты даеш…"];
const BANTER_LOSS = ["Ты ж прыгажун!", "Ну малайчына!", "Ды я амаль перамог…"];
const BANTER_TIE = ["Нічыя, паўтараем.", "Абодва балбесы.", "Ну і што гэта было?"];

const WIN_PHRASE = "Усё, пайшоў я… ты кумір.";
const LOSS_PHRASE = "Слабы ты, дружа… яшчэ заходзь.";
const ALREADY_PHRASE = "Хопіць, братка, я больш не магу…";

const ROUNDS_TO_WIN = 3;
const LOSS_HP = -0.5;
const LOSS_MOOD = -5;
const WIN_MONEY = 20;
const WIN_MOOD = 10;

const VIDEO_PATH = "references/charakters/vlados/vlados.mp4";

export function mount(root) {
  visit("vlados");
  const c = getCharacter("vlados");

  const el = document.createElement("section");
  el.className = "scene joke-scene vlados-drink";
  el.innerHTML = `
    <button class="bar__back" data-action="back" aria-label="Назад">←</button>

    <div class="joke-scene__portrait"
         style="background-image:url('${c.scene || c.avatar}'); background-position:${c.focus}"></div>

    <div class="vlados-score" data-role="score"></div>

    <div class="joke-scene__panel">
      <div class="joke-scene__speaker">${c.name}</div>
      <div class="joke-scene__text" data-role="text">…</div>
      <div class="vlados-reveal" data-role="reveal" hidden></div>
      <div class="vlados-actions" data-role="actions"></div>
    </div>

    <div class="vlados-video" data-role="video-wrap" hidden>
      <video class="vlados-video__el"
             data-role="video"
             src="${VIDEO_PATH}"
             playsinline></video>
      <button class="btn vlados-video__skip" data-action="skip-video">Далей</button>
    </div>
  `;
  root.appendChild(el);

  const textEl = el.querySelector('[data-role="text"]');
  const scoreEl = el.querySelector('[data-role="score"]');
  const revealEl = el.querySelector('[data-role="reveal"]');
  const actionsEl = el.querySelector('[data-role="actions"]');
  const videoWrap = el.querySelector('[data-role="video-wrap"]');
  const video = el.querySelector('[data-role="video"]');

  let playerWins = 0;
  let vladosWins = 0;
  let awarded = false;

  const alreadyBeaten = getFlag("vladosBeaten");

  const renderScore = () => {
    scoreEl.innerHTML = `
      <div class="vlados-score__side">
        <div class="vlados-score__who">Ты</div>
        <div class="vlados-score__pips">${pipsHtml(playerWins)}</div>
      </div>
      <div class="vlados-score__vs">да ${ROUNDS_TO_WIN}</div>
      <div class="vlados-score__side">
        <div class="vlados-score__who">${c.name}</div>
        <div class="vlados-score__pips">${pipsHtml(vladosWins)}</div>
      </div>
    `;
  };

  const pipsHtml = (n) => {
    let out = "";
    for (let i = 0; i < ROUNDS_TO_WIN; i++) {
      out += `<span class="pip ${i < n ? "pip--full" : "pip--empty"}"></span>`;
    }
    return out;
  };

  const showChoices = (prompt) => {
    revealEl.hidden = true;
    textEl.textContent = prompt;
    actionsEl.innerHTML = CHOICES.map(
      (ch) => `<button class="btn vlados-choice" data-choice="${ch.id}">${ch.label}</button>`
    ).join("");
  };

  const showContinue = (label = "Далей") => {
    actionsEl.innerHTML = `<button class="btn" data-action="next">${label}</button>`;
  };

  const showEnd = (phrase) => {
    textEl.textContent = phrase;
    revealEl.hidden = true;
    actionsEl.innerHTML = `<button class="btn" data-action="exit">Выйсці</button>`;
  };

  const showReveal = (playerId, vladosId, outcome) => {
    const p = CHOICES.find((x) => x.id === playerId);
    const v = CHOICES.find((x) => x.id === vladosId);
    revealEl.hidden = false;
    revealEl.innerHTML = `
      <div class="vlados-reveal__row">
        <div class="vlados-reveal__side">
          <div class="vlados-reveal__who">Ты</div>
          <div class="vlados-reveal__pick">${p.label}</div>
        </div>
        <div class="vlados-reveal__vs">vs</div>
        <div class="vlados-reveal__side">
          <div class="vlados-reveal__who">${c.name}</div>
          <div class="vlados-reveal__pick">${v.label}</div>
        </div>
      </div>
      <div class="vlados-reveal__outcome vlados-reveal__outcome--${outcome}">
        ${outcome === "win" ? "Раунд твой" : outcome === "loss" ? "Раунд Владоса" : "Нічыя"}
      </div>
    `;
  };

  const playRound = (playerId) => {
    const vladosId = CHOICES[Math.floor(Math.random() * CHOICES.length)].id;
    let outcome;
    if (playerId === vladosId) outcome = "tie";
    else if (BEATS[playerId] === vladosId) outcome = "win";
    else outcome = "loss";

    showReveal(playerId, vladosId, outcome);

    if (outcome === "win") {
      playerWins++;
      renderScore();
      textEl.textContent = pick(BANTER_WIN);
      if (playerWins >= ROUNDS_TO_WIN) {
        return onMatchWin();
      }
    } else if (outcome === "loss") {
      vladosWins++;
      renderScore();
      changeHealth(LOSS_HP);
      changeMood(LOSS_MOOD);
      textEl.textContent = pick(BANTER_LOSS);
      const e = matchEnding(getState());
      if (e) {
        setEnding(e.id);
        return goTo("ending", { id: e.id });
      }
      if (vladosWins >= ROUNDS_TO_WIN) {
        return showEnd(LOSS_PHRASE);
      }
    } else {
      textEl.textContent = pick(BANTER_TIE);
    }
    showContinue("Яшчэ");
  };

  const awardMatchWin = () => {
    if (awarded) return;
    awarded = true;
    setFlag("vladosBeaten", true);
    changeMoney(WIN_MONEY);
    changeMood(WIN_MOOD);
  };

  const onMatchWin = () => {
    awardMatchWin();
    const e = matchEnding(getState());
    if (e) {
      setEnding(e.id);
      return goTo("ending", { id: e.id });
    }
    videoWrap.hidden = false;
    try {
      video.play();
    } catch {}
    video.addEventListener("ended", endVideo, { once: true });
  };

  const endVideo = () => {
    videoWrap.hidden = true;
    try { video.pause(); } catch {}
    showEnd(WIN_PHRASE);
  };

  const onClick = (ev) => {
    if (ev.target.closest('[data-action="back"]')) return goTo("bar");
    if (ev.target.closest('[data-action="exit"]')) return goTo("bar");
    if (ev.target.closest('[data-action="skip-video"]')) return endVideo();
    if (ev.target.closest('[data-action="next"]')) return showChoices("Налівай!");
    const choiceBtn = ev.target.closest("[data-choice]");
    if (choiceBtn) return playRound(choiceBtn.dataset.choice);
  };
  el.addEventListener("click", onClick);

  if (alreadyBeaten) {
    playerWins = ROUNDS_TO_WIN;
    renderScore();
    showEnd(ALREADY_PHRASE);
  } else {
    renderScore();
    textEl.textContent = pick(INTROS);
    actionsEl.innerHTML = `<button class="btn" data-action="next">П'ём!</button>`;
  }

  return () => {
    el.removeEventListener("click", onClick);
    try { video.pause(); } catch {}
  };
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

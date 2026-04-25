import { getStats, onChange } from "./state.js";
import { HEALTH_LOW } from "./config.js";

let mounted = false;

const formatDelta = (d, decimals = 0) => {
  const sign = d > 0 ? "+" : "";
  const val = decimals ? d.toFixed(decimals) : Math.round(d);
  return `${sign}${val}`;
};

const formatStat = (key, v) => {
  if (key === "mood") return (v > 0 ? "+" : "") + Math.round(v);
  if (key === "health") return Number.isInteger(v) ? String(v) : v.toFixed(1);
  return String(v);
};

export function mountHud() {
  if (mounted) return;
  mounted = true;
  const hud = document.getElementById("hud");
  const slots = {
    health: hud.querySelector('[data-stat="health"]'),
    money: hud.querySelector('[data-stat="money"]'),
    mood: hud.querySelector('[data-stat="mood"]'),
  };
  const values = {
    health: slots.health.querySelector('[data-role="health"]'),
    money: slots.money.querySelector('[data-role="money"]'),
    mood: slots.mood.querySelector('[data-role="mood"]'),
  };

  let prev = { ...getStats() };

  const render = () => {
    const s = getStats();
    for (const key of ["health", "money", "mood"]) {
      const newV = s[key];
      const oldV = prev[key];
      values[key].textContent = formatStat(key, newV);
      if (newV !== oldV) flash(slots[key], newV - oldV, key);
    }
    hud.dataset.low = s.health <= HEALTH_LOW ? "1" : "0";
    prev = { ...s };
  };

  render();
  onChange(render);
}

function flash(slotEl, delta, key) {
  if (!delta) return;
  const dir = delta > 0 ? "up" : "down";
  slotEl.classList.remove("hud__stat--up", "hud__stat--down");
  // force reflow so re-adding class restarts animation
  void slotEl.offsetWidth;
  slotEl.classList.add(`hud__stat--${dir}`);
  setTimeout(() => slotEl.classList.remove(`hud__stat--${dir}`), 650);

  const decimals = key === "health" && !Number.isInteger(delta) ? 1 : 0;
  const pop = document.createElement("span");
  pop.className = `hud__delta hud__delta--${dir}`;
  pop.textContent = formatDelta(delta, decimals);
  slotEl.appendChild(pop);
  setTimeout(() => pop.remove(), 900);
}

export function show() {
  document.getElementById("hud").hidden = false;
}

export function hide() {
  document.getElementById("hud").hidden = true;
}

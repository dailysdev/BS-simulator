import { getStats, onChange } from "./state.js";

let mounted = false;

export function mountHud() {
  if (mounted) return;
  mounted = true;
  const hud = document.getElementById("hud");
  const h = hud.querySelector('[data-role="health"]');
  const m = hud.querySelector('[data-role="money"]');
  const mo = hud.querySelector('[data-role="mood"]');
  const render = () => {
    const s = getStats();
    h.textContent = String(s.health);
    m.textContent = String(s.money);
    mo.textContent = (s.mood > 0 ? "+" : "") + s.mood;
    hud.dataset.low = s.health <= 1 ? "1" : "0";
  };
  render();
  onChange(render);
}

export function show() {
  document.getElementById("hud").hidden = false;
}

export function hide() {
  document.getElementById("hud").hidden = true;
}

import { goTo } from "../sceneManager.js";
import { getEnding } from "../endings.js";
import { newGame } from "../state.js";

export function mount(root, params = {}) {
  const e = getEnding(params.id);
  const el = document.createElement("section");
  el.className = "scene ending";
  el.innerHTML = `
    <div class="ending__kicker">Финал</div>
    <h1 class="ending__title">${e?.title || "Конец"}</h1>
    <p class="ending__text">${e?.text || ""}</p>
    <button class="btn" data-action="restart">Сыграть ещё раз</button>
  `;
  root.appendChild(el);

  const onClick = (ev) => {
    if (ev.target.closest('[data-action="restart"]')) {
      newGame();
      goTo("splash");
    }
  };
  el.addEventListener("click", onClick);
  return () => el.removeEventListener("click", onClick);
}

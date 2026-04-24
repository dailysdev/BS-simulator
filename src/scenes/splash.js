import { goTo } from "../sceneManager.js";
import { hasSave, newGame, resetState, loadState } from "../state.js";

export function mount(root) {
  const save = loadState();
  // Offer "Продолжить" only if there's a save that hasn't already ended.
  const canContinue = hasSave() && !save?.ending;

  const el = document.createElement("section");
  el.className = "scene splash";
  el.innerHTML = `
    <h1 class="splash__title">
      <span class="kicker">Welcome to</span>
      <span class="main">Beer Station<br/>Simulator</span>
    </h1>

    <div class="splash__actions">
      ${
        canContinue
          ? `<button class="btn" data-action="continue">Продолжить</button>
             <button class="btn btn--ghost" data-action="new">Новая игра</button>`
          : `<button class="btn" data-action="new">Начать игру</button>`
      }
    </div>

    <div class="splash__footer">v0.1 · prototype</div>
  `;
  root.appendChild(el);

  const onClick = (e) => {
    const action = e.target.closest("[data-action]")?.dataset.action;
    if (!action) return;
    if (action === "continue") {
      goTo("bar");
    } else if (action === "new") {
      if (canContinue && !confirm("Начать заново? Текущий прогресс будет стёрт.")) return;
      resetState();
      newGame();
      goTo("bar");
    }
  };
  el.addEventListener("click", onClick);

  return () => el.removeEventListener("click", onClick);
}

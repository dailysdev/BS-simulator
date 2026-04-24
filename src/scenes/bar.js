import { goTo } from "../sceneManager.js";

export async function mount(root) {
  const { characters, getCharacter } = await import(`../characters.js?v=${Date.now()}`);
  const el = document.createElement("section");
  el.className = "scene bar";
  el.innerHTML = `
    <button class="bar__back" data-action="back" aria-label="Назад">←</button>

    <div class="bar__stage">
      <div class="bar__counter">
        <div class="bar__hint">Выбери, к кому подсесть</div>
        <div class="bar__guests" role="list">
          ${characters.filter((c) => !c.hidden).map(renderGuest).join("")}
        </div>
        <div class="bar__counter-top"></div>
      </div>
    </div>

    <div class="dialog" hidden>
      <div class="dialog__card">
        <div class="dialog__title"></div>
        <div class="dialog__text">— Привет. Квест скоро появится.</div>
        <button class="btn btn--ghost" data-action="close-dialog">Закрыть</button>
      </div>
    </div>
  `;
  root.appendChild(el);

  const dialog = el.querySelector(".dialog");
  const dialogTitle = el.querySelector(".dialog__title");

  const openDialog = (c) => {
    dialogTitle.textContent = c.name;
    dialog.hidden = false;
  };
  const closeDialog = () => {
    dialog.hidden = true;
  };

  const onClick = (e) => {
    if (e.target.closest('[data-action="back"]')) return goTo("splash");
    if (e.target.closest('[data-action="close-dialog"]')) return closeDialog();
    if (e.target === dialog) return closeDialog();

    const guestEl = e.target.closest("[data-guest]");
    if (guestEl) {
      const c = getCharacter(guestEl.dataset.guest);
      if (!c) return;
      if (c.action) return goTo(c.action);
      openDialog(c);
    }
  };
  el.addEventListener("click", onClick);

  return () => el.removeEventListener("click", onClick);
}

function renderGuest(c) {
  const portrait = c.avatar
    ? `<div class="guest__portrait" style="background-image:url('${c.avatar}'); background-position:${c.focus || "50% 30%"}"></div>`
    : `<div class="guest__portrait guest__portrait--empty" aria-hidden="true">?</div>`;
  return `
    <button class="guest" data-guest="${c.id}" role="listitem">
      ${portrait}
      <div class="guest__name">${c.name}</div>
    </button>
  `;
}

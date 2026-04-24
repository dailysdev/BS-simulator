import { show as showHud, hide as hideHud } from "./hud.js";

const root = () => document.getElementById("app");

const hudHiddenIn = new Set(["splash", "ending"]);

let currentCleanup = null;

export async function goTo(name, params = {}) {
  if (!name) throw new Error("goTo: scene name required");

  if (currentCleanup) currentCleanup();
  root().innerHTML = "";

  if (hudHiddenIn.has(name)) hideHud();
  else showHud();

  // Dynamic import with cache-bust so adding a new scene file never requires
  // editing this module. Scene name must match src/scenes/<name>.js.
  const mod = await import(`./scenes/${name}.js?v=${Date.now()}`);
  currentCleanup = (await mod.mount(root(), params)) || null;
}

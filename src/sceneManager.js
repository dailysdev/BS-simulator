import { show as showHud, hide as hideHud } from "./hud.js";
import { setSceneMute } from "./bgm.js";

const root = () => document.getElementById("app");

const hudHiddenIn = new Set(["splash", "ending"]);
// Scenes that bring their own soundtrack — silence the global BGM while they run.
const bgmMutedIn = new Set(["diana-fight"]);

let currentCleanup = null;

export async function goTo(name, params = {}) {
  if (!name) throw new Error("goTo: scene name required");

  if (currentCleanup) currentCleanup();
  root().innerHTML = "";

  if (hudHiddenIn.has(name)) hideHud();
  else showHud();

  setSceneMute(bgmMutedIn.has(name));

  // Dynamic import with cache-bust so adding a new scene file never requires
  // editing this module. Scene name must match src/scenes/<name>.js.
  const mod = await import(`./scenes/${name}.js?v=${Date.now()}`);
  currentCleanup = (await mod.mount(root(), params)) || null;
}

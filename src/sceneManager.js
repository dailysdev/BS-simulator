import { show as showHud, hide as hideHud } from "./hud.js";

const root = () => document.getElementById("app");

const scenes = {
  splash: () => import("./scenes/splash.js"),
  bar: () => import("./scenes/bar.js"),
  "shkolnik-jokes": () => import("./scenes/shkolnik-jokes.js"),
  "otec-bar": () => import("./scenes/otec-bar.js"),
  "vlados-drink": () => import("./scenes/vlados-drink.js"),
  "malyshka-borrow": () => import("./scenes/malyshka-borrow.js"),
  ending: () => import("./scenes/ending.js"),
};

const hudHiddenIn = new Set(["splash", "ending"]);

let currentCleanup = null;

export async function goTo(name, params = {}) {
  const loader = scenes[name];
  if (!loader) throw new Error(`Unknown scene: ${name}`);

  if (currentCleanup) currentCleanup();
  root().innerHTML = "";

  if (hudHiddenIn.has(name)) hideHud();
  else showHud();

  const mod = await loader();
  currentCleanup = mod.mount(root(), params) || null;
}

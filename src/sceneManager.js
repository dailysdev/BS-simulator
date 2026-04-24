import { show as showHud, hide as hideHud } from "./hud.js";

const root = () => document.getElementById("app");

const V = `?v=${Date.now()}`;

const scenes = {
  splash: () => import(`./scenes/splash.js${V}`),
  bar: () => import(`./scenes/bar.js${V}`),
  "shkolnik-jokes": () => import(`./scenes/shkolnik-jokes.js${V}`),
  "otec-bar": () => import(`./scenes/otec-bar.js${V}`),
  "otec-beerpong": () => import(`./scenes/otec-beerpong.js${V}`),
  "vlados-drink": () => import(`./scenes/vlados-drink.js${V}`),
  "malyshka-borrow": () => import(`./scenes/malyshka-borrow.js${V}`),
  "ben-cook": () => import(`./scenes/ben-cook.js${V}`),
  ending: () => import(`./scenes/ending.js${V}`),
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
  currentCleanup = (await mod.mount(root(), params)) || null;
}

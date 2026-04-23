const root = () => document.getElementById("app");

const scenes = {
  splash: () => import("./scenes/splash.js"),
  bar: () => import("./scenes/bar.js"),
};

let currentCleanup = null;

export async function goTo(name, params = {}) {
  const loader = scenes[name];
  if (!loader) throw new Error(`Unknown scene: ${name}`);

  if (currentCleanup) currentCleanup();
  root().innerHTML = "";

  const mod = await loader();
  currentCleanup = mod.mount(root(), params) || null;
}

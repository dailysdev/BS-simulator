import { getState, setEnding } from "./state.js";
import { matchEnding } from "./endings.js";
import { goTo } from "./sceneManager.js";

// Run after every stat mutation. If an ending now matches, route to it and
// return `true` so the caller can early-out. Otherwise return `false`.
export function checkAndRouteEnding() {
  const e = matchEnding(getState());
  if (!e) return false;
  setEnding(e.id);
  goTo("ending", { id: e.id });
  return true;
}

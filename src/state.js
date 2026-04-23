const KEY = "bs-simulator:save:v1";

const defaultState = () => ({
  version: 1,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  progress: {
    currentScene: "bar",
    completedQuests: [],
  },
});

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.version !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveState(state) {
  state.updatedAt = Date.now();
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function resetState() {
  localStorage.removeItem(KEY);
}

export function newGame() {
  const s = defaultState();
  saveState(s);
  return s;
}

export function hasSave() {
  return loadState() !== null;
}

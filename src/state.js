const KEY = "bs-simulator:save:v2";

const defaultStats = () => ({ mood: 0, money: 50, health: 5 });

const defaultState = () => ({
  version: 2,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  stats: defaultStats(),
  flags: {},
  ending: null,
  progress: {
    currentScene: "bar",
    completedQuests: [],
  },
});

let state = load() || defaultState();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.version !== 2) return null;
    if (!parsed.stats) parsed.stats = defaultStats();
    if (!parsed.flags) parsed.flags = {};
    return parsed;
  } catch {
    return null;
  }
}

function persist() {
  state.updatedAt = Date.now();
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function loadState() {
  return load();
}

export function saveState(s) {
  state = s;
  persist();
  emit();
}

export function resetState() {
  localStorage.removeItem(KEY);
  state = defaultState();
  emit();
}

export function newGame() {
  state = defaultState();
  persist();
  emit();
  return state;
}

export function hasSave() {
  return load() !== null;
}

export function getState() {
  return state;
}

export function getStats() {
  return state.stats;
}

export function changeMood(n) {
  state.stats.mood += n;
  persist();
  emit();
}

export function changeMoney(n) {
  state.stats.money += n;
  persist();
  emit();
}

export function changeHealth(n) {
  state.stats.health = Math.max(0, state.stats.health + n);
  persist();
  emit();
}

export function setEnding(id) {
  state.ending = id;
  persist();
  emit();
}

export function getFlag(key) {
  return state.flags?.[key];
}

export function setFlag(key, value) {
  state.flags = state.flags || {};
  state.flags[key] = value;
  persist();
  emit();
}

export function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit() {
  for (const fn of listeners) fn(state);
}

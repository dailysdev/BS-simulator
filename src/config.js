// Game-wide constants. Anything tweaked across multiple modules belongs here.

// Persistence
export const SAVE_KEY = "bs-simulator:save:v2";
export const SAVE_VERSION = 2;

// Starting stats — applied on newGame() and on first launch
export const START_STATS = Object.freeze({
  mood: 0,
  money: 200,
  health: 5,
});

// HUD thresholds
export const HEALTH_LOW = 1;        // shows red glow on the HP capsule
export const MOOD_HAPPY_LIMIT = 50; // > this triggers the "durka" ending

// Ben cook
export const DRANIK_LIMIT = 8;      // ≥ this triggers the "pancreatitis" ending

// Background music
export const BGM_SRC = "references/song.mp3";
export const BGM_VOLUME = 0.25;
// Scenes that bring their own soundtrack (BGM is paused while they run)
export const BGM_MUTED_SCENES = Object.freeze(["diana-fight"]);

// HUD visibility
export const HUD_HIDDEN_SCENES = Object.freeze(["splash", "ending"]);

// Default scene focus when a character omits its own
export const DEFAULT_PORTRAIT_FOCUS = "50% 30%";

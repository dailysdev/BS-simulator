import { BGM_VOLUME } from "./config.js";

const el = () => document.getElementById("bgm");

let mutedByScene = false;
let userUnmuted = false;

export function playBgm() {
  const a = el();
  if (!a) return;
  a.volume = BGM_VOLUME;
  if (!mutedByScene && userUnmuted) a.muted = false;
  a.play().catch(() => {});
}

export function pauseBgm() {
  const a = el();
  if (!a) return;
  a.pause();
}

export function setSceneMute(on) {
  mutedByScene = on;
  const a = el();
  if (!a) return;
  if (on) {
    a.pause();
  } else {
    if (userUnmuted) a.muted = false;
    a.play().catch(() => {});
  }
}

// The <audio id="bgm"> tag autoplays muted; on first real user gesture we unmute.
export function armBgmOnFirstInteraction() {
  const events = ["pointerdown", "click", "keydown", "touchstart"];
  const handler = () => {
    userUnmuted = true;
    const a = el();
    if (a && !mutedByScene) {
      a.muted = false;
      a.volume = BGM_VOLUME;
      a.play().catch(() => {});
    }
    events.forEach((ev) => window.removeEventListener(ev, handler, true));
  };
  events.forEach((ev) => window.addEventListener(ev, handler, true));
}

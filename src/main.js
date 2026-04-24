import { goTo } from "./sceneManager.js";
import { mountHud } from "./hud.js";
import { armBgmOnFirstInteraction } from "./bgm.js";

mountHud();
armBgmOnFirstInteraction();
goTo("splash");

const PROXY = "https://api.codetabs.com/v1/proxy?quest=";
const SOURCE = "https://rzhunemogu.ru/Rand.aspx?CType=11";

const fallback = [
  "Заходит улитка в бар, бармен её выкидывает. Через год она возвращается: «За что?!»",
  "— Дорогой, ты меня любишь? — Конечно. — А докажи! — Окей, вызываю свидетелей.",
  "— Почему ты всегда опаздываешь? — Потому что на работу тянет меньше, чем домой.",
  "— Я тебе изменил. — С кем?! — С совестью. Она оказалась сильнее.",
  "Муж жене: — Дорогая, тебе не кажется, что ты слишком много говоришь? — Кажется, продолжай.",
  "— У тебя есть принципы? — Есть, но я их не соблюдаю.",
  "Жена мужу: «Если бы ты был настоящим мужчиной…» Муж: «…меня бы здесь уже не было».",
  "— Доктор, я забываю всё через пять минут! — Когда это началось? — Что началось?",
  "— Ты куда? — В спортзал. — А мешок с мусором? — Это я и есть.",
  "Любовь — это когда вы вдвоём смотрите в одну сторону. Обычно в холодильник.",
];

const seen = new Set();

export async function fetchJoke(signal) {
  try {
    const res = await fetch(PROXY + encodeURIComponent(SOURCE), { signal });
    if (!res.ok) throw new Error("proxy " + res.status);
    const buf = await res.arrayBuffer();
    const xml = new TextDecoder("windows-1251").decode(buf);
    const text = parseRzhunemogu(xml);
    if (text) return { text, source: "rzhunemogu" };
  } catch (e) {
    if (e.name === "AbortError") throw e;
  }
  return { text: pickFallback(), source: "local" };
}

function parseRzhunemogu(xml) {
  const m = xml.match(/<content>([\s\S]*?)<\/content>/);
  if (!m) return null;
  return m[1].replace(/\r/g, "").trim();
}

function pickFallback() {
  const pool = fallback.filter((t) => !seen.has(t));
  const arr = pool.length ? pool : (seen.clear(), fallback);
  const t = arr[Math.floor(Math.random() * arr.length)];
  seen.add(t);
  return t;
}

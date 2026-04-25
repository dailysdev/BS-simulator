import { DRANIK_LIMIT, MOOD_HAPPY_LIMIT } from "./config.js";

export const endings = [
  {
    id: "pancreatitis",
    priority: 120,
    when: ({ flags }) => (flags?.dranikEaten || 0) >= DRANIK_LIMIT,
    title: "Панкреатит от драников",
    text:
      "Девятый драник стал последним. Доктор в приёмном сказал: «Ну сколько можно жареного, мужик». Капельница, диета и долгая лекция — вечер определённо закончился.",
  },
  {
    id: "hospital",
    priority: 110,
    when: ({ stats, flags }) => stats.health <= 0 && flags?.deathCause === "fight",
    title: "Уехали в больницу",
    text:
      "Диана уложила тебя так, что очнулся ты под капельницей. Медсестра: «Вечер для вас, боец, определённо закончился». Где-то по соседству храпит ещё один любитель файтинга.",
  },
  {
    id: "kolskaya",
    priority: 100,
    when: ({ stats }) => stats.health <= 0,
    title: "Увезли на кольскую",
    text:
      "Здоровье кончилось. Ты помнишь только мигалку и чей-то голос: «Дыши, дыши…»",
  },
  {
    id: "durka",
    priority: 90,
    when: ({ stats }) => stats.mood > MOOD_HAPPY_LIMIT,
    title: "Увезли в дурку",
    text:
      "Стало так хорошо, что окружающие забеспокоились. Белый халат, тихий голос, и всё по расписанию.",
  },
];

export function matchEnding(state) {
  return (
    endings
      .filter((e) => e.when(state))
      .sort((a, b) => b.priority - a.priority)[0] || null
  );
}

export function getEnding(id) {
  return endings.find((e) => e.id === id) || null;
}

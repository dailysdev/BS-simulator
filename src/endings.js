export const endings = [
  {
    id: "kolskaya",
    priority: 100,
    when: ({ stats }) => stats.health <= 0,
    title: "Увезли на кольскую",
    text: "Здоровье кончилось. Ты помнишь только мигалку и чей-то голос: «Дыши, дыши…»",
  },
  {
    id: "durka",
    priority: 90,
    when: ({ stats }) => stats.mood > 50,
    title: "Увезли в дурку",
    text: "Стало так хорошо, что окружающие забеспокоились. Белый халат, тихий голос, и всё по расписанию.",
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

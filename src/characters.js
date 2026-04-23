export const characters = [
  {
    id: "otec",
    name: "Отец",
    language: "ru",
    role: "Владелец бара",
    portrait: "references/charakters/otec/image.png",
    focus: "50% 30%",
  },
  {
    id: "vlados",
    name: "Владос",
    language: "be",
    role: "Гость",
    portrait: "references/charakters/vlados/scene2.png",
    focus: "50% 28%",
  },
  {
    id: "malyshka",
    name: "Малышка",
    language: "be",
    role: "Гость",
    portrait: "references/charakters/malyshka/577c619e-2e92-4477-b6bc-aad384c1c94c.png",
    focus: "62% 35%",
  },
  {
    id: "vital",
    name: "Віталь",
    language: "be",
    role: "Гость",
    portrait: "references/charakters/vital/28ea3a6c-3185-46f1-9f4b-1daafe16f0b3.png",
    focus: "45% 30%",
  },
  {
    id: "shkolnik",
    name: "Школьник",
    language: "ru",
    role: "Гость",
    game: "анекдоты",
    portrait: "references/charakters/shkolnik/scene.png",
    focus: "50% 26%",
  },
  {
    id: "ben",
    name: "Бен",
    language: "ru",
    role: "Повар",
    portrait: "references/charakters/ben/ecad18a2-d9d3-41d3-922c-346ade0f7362.png",
    focus: "50% 20%",
  },
];

export function getCharacter(id) {
  return characters.find((c) => c.id === id) || null;
}

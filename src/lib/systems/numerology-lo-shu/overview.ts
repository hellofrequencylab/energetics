import type { SystemOverview } from "@/lib/systems/overview-types";

/**
 * Reader-facing overview for the Lo Shu grid system. Original prose, second
 * person, no em dashes. Stats keys match the engine's native factor keys.
 */
export const overview: SystemOverview = {
  intro:
    "The Lo Shu grid reads the digits of your birth date laid into an ancient 3 by 3 square. Each number from 1 to 9 has a fixed home in the square, and we drop your date's digits into their homes to see what gathers, what repeats, and what is missing.",
  how:
    "Start with the picture of the whole grid. The numbers that show up are strengths already in play, the ones that repeat are doubled down and amplified, and the ones missing point at qualities you tend to grow into rather than start with. Your strongest number is the cell filled the most, a natural lean. The square also holds eight lines, three across, three down, and two on the diagonals. When a line is fully filled it reads as a complete strength, and when a whole line is empty it marks a theme to develop. Two summary numbers travel alongside the grid: your driver, from the day you were born, and your conductor, from the whole date reduced. Read the grid as a map of leanings and growing edges, not a scorecard. A missing number is an invitation, not a deficit.",
  appliesToLife:
    "The numbers you carry tend to show up as the strengths people notice first and the habits you reach for without thinking. A repeated number can feel like a quality turned up loud, a gift when you aim it and a lot when you do not. The missing numbers often name the very things you spend a life building, and many people find they fill those cells through the people they partner with and the skills they choose to learn. The complete lines point at planes of life that come together easily for you, and the empty lines at the ones worth tending on purpose.",
  lineageNote:
    "The Lo Shu square comes from a Chinese tradition many centuries old, where the 3 by 3 magic square (every row, column, and diagonal summing to 15) carries deep symbolic weight. Reading a birth date through the grid is a practice that grew alongside numerology in several cultures. The placements here follow the classic square, and the line readings and growth notes are our own original schematic, not reproduced text. We compute it from your date alone, and your date stays private to your chart.",
  stats: {
    grid:
      "The whole picture: which of the cells 1 to 9 your birth date fills, and how often.",
    present:
      "The numbers already in play for you, the strengths your date carries from the start.",
    missing:
      "The numbers your date does not carry, the qualities you tend to grow into over time.",
    repeated:
      "Numbers that appear more than once, a quality turned up loud and worth aiming with care.",
    strongest:
      "The cell your date fills the most: a natural strength you can reliably lean on.",
    "complete-arrows":
      "Lines of the square that are fully filled: planes of life that tend to come together easily.",
    "empty-arrows":
      "Lines of the square that are entirely empty: themes worth tending on purpose.",
    driver:
      "A summary number from the day you were born: the everyday push you tend to lead with.",
    conductor:
      "A summary number from your whole date reduced: the steadier direction underneath.",
  },
};

import type { SystemOverview } from "@/lib/systems/overview-types";

/**
 * Reader-facing overview for the Kabbalah Tree of Life system. Original prose,
 * second person, no em dashes. Stats keys match the engine's native factor keys.
 */
export const overview: SystemOverview = {
  intro:
    "The Tree of Life reads your name through gematria, the old practice of giving each letter a number. We transliterate the letters of your name to their Hebrew counterparts, add their values, and place that sum on the Tree: its ten spheres, three pillars, and four worlds.",
  how:
    "Your gematria is the total value of your name. From it we find your sephirah, one of the ten spheres of the Tree, each a station with its own quality, from the crown at the top to the kingdom at the root. Your sephirah sits on one of three pillars: the pillar of force that initiates, the pillar of form that shapes and receives, or the pillar of balance that reconciles the two. Your world is one of four planes of being, from action and the body up through feeling, thought, and spirit. A path number marks one of the 22 connecting paths, and a root number folds your gematria down to a single digit so the Tree can speak alongside the numerology systems. Read these as a map of where your name rests on the Tree, a lens for reflection rather than a fixed station.",
  appliesToLife:
    "Your sephirah tends to describe the quality you most naturally embody, whether that is steady structure, open mercy, sharp discernment, or harmonizing beauty. Your pillar shows in how you tend to move: leaning forward to initiate, drawing in to shape and steady, or seeking the middle that holds both. Your world points at the plane where you feel most at home, the hands-on and practical, the felt and emotional, the conceptual, or the spiritual. Held lightly, these can help you notice where your gifts already flow and which spheres of the Tree invite you to grow.",
  lineageNote:
    "Kabbalah is a living mystical tradition within Judaism, studied for many centuries, with the Tree of Life and gematria among its central images. Reading a personal name onto the Tree is an interpretive practice, and the way we transliterate Latin letters to Hebrew values, then fold the sum onto a sphere, pillar, world, and path, is our own original schematic, not a reproduction of any copyrighted table. We name it as the reconstruction it is, compute it from your name alone, and keep your name private to your chart.",
  stats: {
    gematria:
      "The total number value of your name, the sum we place on the Tree.",
    sephirah:
      "Your sphere on the Tree of Life: the station whose quality you most naturally embody.",
    pillar:
      "The pillar your sphere sits on: force that initiates, form that shapes, or balance that holds both.",
    path:
      "One of the 22 connecting paths of the Tree, a thread linking the spheres.",
    world:
      "Your plane of being among the four worlds, from action and body up to spirit.",
    root:
      "Your gematria folded to a single digit: a numerology bridge so the Tree can speak alongside your numbers.",
  },
};

import type { SystemOverview } from "../overview-types";

/**
 * Reader-facing overview for the Egyptian Decans system. Original prose, second
 * person, no em dashes. `stats` keys match the engine's native factor keys in
 * engine.ts so each line explains the reader's own decan.
 */
export const overview: SystemOverview = {
  intro:
    "The decans divide the zodiac into thirty-six ten degree slices, three to a sign. They began as a band of star groups the ancient Egyptians used to mark the hours of the night, and were later folded into Western astrology as the faces of the signs. Your decan places your Sun more precisely than your sign alone, and gives it a planetary ruler and a kindred flavor drawn from a sign of the same element.",
  how:
    "Read your Sun decan first. It tells you which third of your sign your Sun falls in and which planet rules that face in the old Chaldean order, from Mars and the Sun through to Saturn and Jupiter. That ruling planet adds a distinct accent on top of your sign. Your decan also carries a triplicity face, a second sign of the same element that colors the slice with a related tone. If you know your birth time and place, the rising decan adds the slice that was climbing the eastern horizon at your birth, an older way of marking the moment. Your Moon decan adds an inward, emotional reading. Some of this needs only your date, and the rising decan unlocks with an exact time and place.",
  appliesToLife:
    "In daily life your decan ruler often sharpens how your sign shows up: two people with the Sun in the same sign can feel different because their faces are ruled by different planets, one leaning to drive and another to care or to craft. The triplicity face is a quieter influence, a kindred quality from the same element that rounds out your style. The rising decan, when you have it, points to how you tend to begin and to meet a new situation. Read together, the decans are a fine grained shading on the broader picture, a way to notice the particular grain of your nature.",
  lineageNote:
    "The decans are genuinely ancient, first attested in Egyptian star tables used for timekeeping, and later absorbed into Hellenistic and medieval astrology as the faces, with planetary rulers assigned in the Chaldean order. We treat the decanic faces as a reconstruction in spirit: the slicing and the rulerships are well attested, while the meanings here are our own. The face rulers and the triplicity scheme are working conventions that traditions read in their own ways, so treat your decan as a language for reflection rather than a fixed verdict.",
  stats: {
    decan: "Your Sun decan: which ten degree third of your sign your Sun falls in, with its old planetary face ruler.",
    "moon-decan": "Your Moon decan: the same slicing applied to your Moon, an inward and emotional reading.",
    "decan-ruler": "The planet that rules your Sun's decan in the Chaldean order, an accent layered on top of your sign.",
    "decan-face": "The kindred sign of your decan's own element that colors the slice with a related tone.",
    "rising-decan": "The decan that was climbing the eastern horizon at your birth, an older marker of the moment (needs an exact time and place).",
  },
};

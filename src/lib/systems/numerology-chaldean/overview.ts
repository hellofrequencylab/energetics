import type { SystemOverview } from "@/lib/systems/overview-types";

/**
 * Overview content for the Chaldean name numerology system. House copy rules: no
 * em dashes, second person, original prose only. Stats are keyed by the engine's
 * native factor keys (name-number, compound, soul-urge, personality, cornerstone,
 * capstone, hidden-passion, balance).
 */
export const overview: SystemOverview = {
  intro:
    "Name numerology reads the numbers held in the letters of your full name. It is the one voice on your chart drawn from your name rather than your birth moment, so it adds a thread the sky and the calendar cannot.",
  how:
    "Each letter carries a Chaldean value. Add the values of your whole name and reduce them to a single digit and you have your name number, with the unreduced total kept as your compound. The vowels add up to a soul urge number, the inner pull behind what you do, and the consonants add up to a personality number, the read people tend to get first. A few finer details fill in the shape: your cornerstone is the value of the first letter, how you tend to begin a thing, your capstone is the last letter, how you tend to finish, your hidden passion is the value that shows up most often across your name, a drive that keeps surfacing, and your balance reads the name number and soul urge together as the steadier tone the whole name settles into. Treat these as angles on the same name, not a verdict, and notice where they agree.",
  appliesToLife:
    "Your name number tends to color how you lead, connect, and steady yourself across a day. The soul urge points at what quietly motivates you in relationships and work, while the personality number describes the first impression you give before anyone knows you well. The cornerstone shows in how you start something new, the capstone in how you bring it to a close, and the hidden passion in the pull you return to again and again. When your name number lines up with a reading from your birth chart and another from your birth date, that agreement across three independent sources is worth leaning on.",
  lineageNote:
    "This draws on the Chaldean tradition, rooted in ancient Babylon, which assigns letters the values 1 through 8. The number 9 is treated as sacred and is never given to a letter, so it only ever appears as a reduced result. The values here follow that older scheme rather than the more common Pythagorean one, and we name it as the reconstruction it is.",
  stats: {
    "name-number":
      "Your core name number, the overall tone the letters of your full name sound together.",
    compound:
      "The unreduced total behind your name number, kept because the larger figure carries its own shading in this tradition.",
    "soul-urge":
      "Your soul urge, summed from the vowels, pointing at the inner motivation behind what you reach for.",
    personality:
      "Your personality number, summed from the consonants, describing the impression you give before people know you well.",
    cornerstone:
      "The value of the first letter of your name: how you tend to approach and begin a new thing.",
    capstone:
      "The value of the last letter of your name: how you tend to follow through and finish.",
    "hidden-passion":
      "The value that appears most often across your name: an underlying drive that keeps returning.",
    balance:
      "Your name number and soul urge read together: the steadier tone the whole name settles into.",
  },
};

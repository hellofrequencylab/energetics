/**
 * Help Center content (docs as code).
 *
 * This is the single, versioned source for everything the in-app Help Center
 * renders at /help. Update it in the same change that ships a feature, so the
 * help "gets written to as we go" (see CONTRIBUTING.md, Definition of Done).
 *
 * Voice rules (from the OneSky design scope, docs/DESIGN.md): no em dashes
 * anywhere, active voice, sentence case, plain verbs, name things by what the
 * person controls. The systems list is NOT hard-coded here; it comes from the
 * registry at render time so it can never drift from what the app actually runs.
 */

/** A renderable block. Kept tiny so we need no markdown dependency. */
export type Block =
  | { type: "p"; text: string }
  | { type: "list"; items: string[] }
  | { type: "steps"; items: string[] };

export interface HelpArticle {
  slug: string;
  title: string;
  summary: string;
  body: Block[];
}

export interface HelpCategory {
  slug: string;
  title: string;
  blurb: string;
  articles: HelpArticle[];
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ChangelogEntry {
  date: string; // ISO date
  title: string;
  notes: string[];
}

/** One line per system, keyed by registry id. Combined with live registry meta. */
export const SYSTEM_BLURBS: Record<string, string> = {
  "western-tropical": "The Western birth chart: planets in signs and houses, read from the real sky.",
  "vedic-jyotish": "The Indian sidereal system: grahas, nakshatras, and whole sign houses.",
  hellenistic: "Traditional Greek astrology: sect, the Lot of Fortune, and the chart ruler.",
  "chinese-bazi": "The Four Pillars: your year, month, day, and hour as stems and branches.",
  "zi-wei-dou-shu": "Purple Star astrology: a chart of palaces and stars from your lunar birth date.",
  tzolkin: "The Maya sacred count: your day sign and galactic tone.",
  dreamspell: "A modern reconstruction of the Maya count. Shown for interest, kept out of the synthesis.",
  "human-design": "A hybrid map of energy centers, gates, and channels from two birth moments.",
  "gene-keys": "A contemplative sequence drawn from the same activations as Human Design.",
  "numerology-pythagorean": "Numbers from your birth date: your life path and related cycles.",
  "numerology-chaldean": "Numbers from the sound of your name.",
  "tarot-birth-cards": "Major Arcana cards drawn from your birth date.",
  "nine-star-ki": "A Japanese system of nine stars from your birth year and month.",
  "celtic-tree": "A modern tree calendar keyed to your birth date.",
  mahabote: "A Burmese system keyed to the weekday you were born.",
  "akan-day-names": "West African day names from the weekday of your birth.",
  "norse-runes": "A modern rune mapping keyed to your birth date.",
  "egyptian-decans": "The 36 decans: ten degree slices of the sky and their rulers.",
  "kabbalah-tree-of-life": "The Tree of Life: letters and paths placed by the gematria of your name.",
  "tibetan-astrology": "The Tibetan calendar: your birth year animal and element, parkha, and mewa.",
  "numerology-lo-shu": "The Lo Shu grid: numbers laid out from the digits of your birth date.",
};

/** Plain-language label for each lineage tag. */
export const LINEAGE_LABEL: Record<string, string> = {
  traditional: "Living tradition",
  hybrid: "Hybrid",
  "modern-reconstruction": "Modern reconstruction",
};

export const CATEGORIES: HelpCategory[] = [
  {
    slug: "getting-started",
    title: "Getting started",
    blurb: "What OneSky does and how to read your first chart.",
    articles: [
      {
        slug: "what-onesky-is",
        title: "What OneSky is",
        summary: "Many traditions. One sky. Read separately, then compared honestly.",
        body: [
          {
            type: "p",
            text: "OneSky reads your birth moment through many traditions at once. The sky is computed one time. Each tradition then interprets it on its own, without seeing the others.",
          },
          {
            type: "p",
            text: "A separate layer shows you two things: where independent traditions agree (convergence), and where they pull in different directions (tension). OneSky never blends them into a single score, and it always tells you which tradition said what.",
          },
        ],
      },
      {
        slug: "read-your-chart",
        title: "Read your chart in three steps",
        summary: "Enter your birth moment, see each tradition, watch them converge.",
        body: [
          {
            type: "steps",
            items: [
              "Enter your birth moment. Your date is all you need to begin.",
              "See every tradition, kept whole. Each system shows its own reading.",
              "Watch where they converge. The synthesis shows real overlap, fully attributed.",
            ],
          },
        ],
      },
      {
        slug: "precision",
        title: "What your birth time and place unlock",
        summary: "Date alone works. Time and place add depth.",
        body: [
          {
            type: "p",
            text: "More detail unlocks more of the chart. You stay in control of how much you share.",
          },
          {
            type: "list",
            items: [
              "Date only: planetary signs and the date-based systems.",
              "Date and time: degrees, the lunar phase, and aspects between planets.",
              "Date, time, and place: your ascendant, midheaven, and house placements.",
            ],
          },
          {
            type: "p",
            text: "If you are not sure of your birth time, use the time unknown option. OneSky shows you exactly which parts of the reading depend on a time, so nothing is implied that the data cannot support.",
          },
        ],
      },
      {
        slug: "your-name",
        title: "Why we ask for your full name",
        summary: "Your name unlocks name numerology, and it stays yours.",
        body: [
          {
            type: "p",
            text: "Your full name unlocks name numerology, which reads the numbers in the letters of your name. It is the one system built from your name rather than the sky or the calendar, so it counts as its own independent voice. When it lands on the same theme as a sky-based and a date-based system, that agreement is genuinely strong.",
          },
          {
            type: "p",
            text: "Your name is optional. Your date alone still produces a full reading. If you are signed out, nothing is saved. If you sign in and save a chart, your name is stored under your account and only you can read it.",
          },
        ],
      },
    ],
  },
  {
    slug: "how-it-works",
    title: "How the synthesis works",
    blurb: "Convergence, tension, and why there is no single score.",
    articles: [
      {
        slug: "convergence-and-tension",
        title: "Convergence and tension",
        summary: "Agreement across independent systems, and where they differ.",
        body: [
          {
            type: "p",
            text: "A convergence is a point where independent traditions land on the same theme, element, or value about you. A tension is a place where two readings genuinely oppose each other.",
          },
          {
            type: "p",
            text: "OneSky ranks convergences by how many independent sources agree, so the strongest signals rise to the top for the right reason: more separate traditions point the same way.",
          },
        ],
      },
      {
        slug: "no-single-score",
        title: "Why there is no single score",
        summary: "A blended number hides which tradition said what.",
        body: [
          {
            type: "p",
            text: "A single compatibility or personality score would throw away the most useful information: the source. OneSky keeps provenance on every claim, so you can always trace a reading back to the tradition and the placement it came from.",
          },
        ],
      },
      {
        slug: "independent-sources",
        title: "Independent sources, counted honestly",
        summary: "The sky, the calendar, and your name each count once.",
        body: [
          {
            type: "p",
            text: "Systems that read the same input are not independent, so OneSky groups them and counts each group as one voice when ranking convergences.",
          },
          {
            type: "list",
            items: [
              "The sky: systems computed from planetary positions count together as one voice.",
              "The calendar: systems read from your date count together as one voice.",
              "Your name: name-based numerology forms its own voice.",
            ],
          },
          {
            type: "p",
            text: "A system that is derived from another (for example, a reading built on top of your Western chart) never double counts its parent.",
          },
        ],
      },
      {
        slug: "lineage",
        title: "Lineage, labeled not laundered",
        summary: "Living traditions, hybrids, and modern reconstructions are named.",
        body: [
          {
            type: "p",
            text: "OneSky labels the lineage of every system plainly. Living traditions are honored as they are. Modern reconstructions are marked as such, and some are shown for interest while staying out of the structural synthesis, so a recent invention never poses as an ancient lineage.",
          },
        ],
      },
      {
        slug: "your-reading",
        title: "Your reading, written live",
        summary: "Optional prose over the synthesis. It reads the structure, never computes it.",
        body: [
          {
            type: "p",
            text: "After the convergences and tensions are computed, you can ask for a reading: plain prose that walks through what the structure shows. Choose write my reading and it streams in live, a little at a time, so you can start reading right away.",
          },
          {
            type: "p",
            text: "The reading only describes the synthesis above it. It never invents a convergence, a tension, or a score, and it leads with the threads the most independent traditions agree on. The resonance page has its own reading, written through the lens you pick, platonic or intimate.",
          },
          {
            type: "p",
            text: "A reading is saved once it is written, so opening the same chart again brings it back instantly without writing it from scratch. Pick rewrite any time you want to see it again.",
          },
        ],
      },
    ],
  },
  {
    slug: "account-and-data",
    title: "Your account and data",
    blurb: "Sign in, what we store, and what stays yours.",
    articles: [
      {
        slug: "sign-in",
        title: "Sign in or create an account",
        summary: "Use a password, or get a one-time magic link by email.",
        body: [
          {
            type: "p",
            text: "You can sign in two ways. With a password: choose create an account, enter your email and a password, and you are in. Next time, enter the same email and password. With a magic link: switch to the magic link tab, enter your email, and we send you a one-time link, so there is no password to remember.",
          },
          {
            type: "p",
            text: "Forgot your password? On the password tab, choose forgot password and we email you a link to set a new one. If an email does not arrive within a minute, check your spam folder, then request a new one.",
          },
        ],
      },
      {
        slug: "your-data",
        title: "What we store, and what stays yours",
        summary: "Your birth data is yours, and you can compute without an account.",
        body: [
          {
            type: "p",
            text: "You can compute a full chart without signing in. Nothing is saved in that case.",
          },
          {
            type: "p",
            text: "When you sign in and save a chart, your birth data is stored under your account and protected by row level security, so only you can read it. You can ask us to remove it at any time.",
          },
        ],
      },
      {
        slug: "edit-a-chart",
        title: "Edit or correct a saved chart",
        summary: "Fix a birth date, time, or place, and the reading updates.",
        body: [
          {
            type: "p",
            text: "Open a saved chart and select edit on the birth data card, or use the edit link next to any chart on your account page. You can change the date, the time, or the birthplace, or mark the time or place as unknown.",
          },
          {
            type: "p",
            text: "When you save, OneSky recomputes the chart from the corrected data. The precision and timezone are worked out for you, and the synthesis and reading update to match. You can also rename a chart or, for practitioner accounts, keep private notes on it.",
          },
        ],
      },
    ],
  },
  {
    slug: "for-builders",
    title: "For builders",
    blurb: "How OneSky is put together, for engineers and operators.",
    articles: [
      {
        slug: "architecture",
        title: "Architecture in one idea",
        summary: "Compute the sky once. Keep engines pure. Synthesize deterministically.",
        body: [
          {
            type: "p",
            text: "The sky is computed once as shared infrastructure. Each system is a pure, isolated engine that never sees another engine's output. The synthesis layer is deterministic and reads only normalized, provenance-tagged values. It computes no scores and uses no language model.",
          },
          {
            type: "p",
            text: "The optional narrative layer reads the finished synthesis and writes prose. It never changes the structure.",
          },
        ],
      },
      {
        slug: "where-things-live",
        title: "Where things live",
        summary: "Repo docs that go deeper than this page.",
        body: [
          {
            type: "list",
            items: [
              "README.md: the project overview and the one idea.",
              "AGENTS.md: the architecture rules to follow before editing the engine.",
              "SYSTEMS.md: the living roadmap of every system and its status.",
              "docs/RUNBOOK.md: how to configure, deploy, and operate the app.",
              "docs/adr: the record of significant engineering decisions.",
              "docs/DESIGN.md: the OneSky design language and site scope.",
            ],
          },
        ],
      },
      {
        slug: "run-test-deploy",
        title: "Run, test, and deploy",
        summary: "The commands and the hosting setup.",
        body: [
          {
            type: "list",
            items: [
              "npm run dev: start the local app.",
              "npm run test: run the engine and synthesis tests.",
              "npm run typecheck and npm run lint: gate every change.",
              "Deploy: merge to main, and Vercel builds production. Data lives in the isolated energetics schema on Supabase.",
            ],
          },
        ],
      },
    ],
  },
];

export const FAQ: FaqItem[] = [
  {
    question: "Is OneSky accurate?",
    answer:
      "The chart math uses the Swiss Ephemeris for real planetary positions. A few systems are still being checked against trusted references, and OneSky labels those plainly rather than hiding them.",
  },
  {
    question: "Is OneSky free?",
    answer:
      "You can compute a full birth chart and see where the traditions converge without paying. Paid plans for deeper, ongoing features are on the way.",
  },
  {
    question: "How is my birth data handled?",
    answer:
      "If you are signed out, nothing is saved. If you sign in and save a chart, your birth data is stored under your account and protected by row level security, so only you can read it.",
  },
  {
    question: "Do I need my exact birth time?",
    answer:
      "No. Your date alone produces a reading. Adding your time unlocks degrees, the lunar phase, and aspects. Adding your place unlocks your ascendant and houses.",
  },
  {
    question: "Should I use the web or the app?",
    answer:
      "Start on the web. A native app for daily use is planned, and one account will carry across both.",
  },
];

/**
 * User-facing release highlights, newest first. This is the "what's new" surface.
 * Keep entries plain and benefit-led. The fuller technical record lives in
 * CHANGELOG.md.
 */
export const CHANGELOG: ChangelogEntry[] = [
  {
    date: "2026-06-15",
    title: "Save your resonance comparisons",
    notes: [
      "When you compare two of your saved charts, you can now save that resonance to your account.",
      "Your saved resonances live on your account page: open one to read it again, or remove it.",
    ],
  },
  {
    date: "2026-06-15",
    title: "A clearer chart page",
    notes: [
      "Your convergence chart now sits front and center at the top of the page.",
      "Below it, your reading and systems are on the left, with a details rail on the right for managing the chart and seeing it at a glance.",
    ],
  },
  {
    date: "2026-06-15",
    title: "The same menu everywhere",
    notes: [
      "The top and bottom menus are now identical on every page, including the home page.",
      "What you see fits your account: admins get an Admin link, and signed-in menus include your charts and a sign out.",
    ],
  },
  {
    date: "2026-06-15",
    title: "One consistent look across the site",
    notes: [
      "Every page now shares the same width, headings, cards, and buttons, so moving around feels of a piece.",
      "The convergence map opens less crowded, with more room between points and a clear center.",
    ],
  },
  {
    date: "2026-06-15",
    title: "Sign in with a password, or a magic link",
    notes: [
      "You can now create an account with an email and password, and sign in with them anytime.",
      "Prefer no password? The one-time magic link is still there, and you can reset your password by email.",
    ],
  },
  {
    date: "2026-06-14",
    title: "The birth form fits your phone",
    notes: [
      "On a phone, the form now fills the screen on its own: the top bar and the extra button step aside so you can focus on entering your birth moment.",
    ],
  },
  {
    date: "2026-06-14",
    title: "A cleaner, more consistent account area",
    notes: [
      "Your account and admin pages now share one look: the same page width, headings, cards, and buttons throughout.",
      "Signed-in pages gained a simple tab row to move between your charts, resonance, and (for admins) the systems catalog.",
    ],
  },
  {
    date: "2026-06-14",
    title: "Tensions connect real points now",
    notes: [
      "Every end of a tension is a theme point on the map, linked to the tradition that holds it, so nothing floats off on its own.",
      "Drag any point, including a single-tradition tension pole, and its lines follow.",
    ],
  },
  {
    date: "2026-06-14",
    title: "Cleaner tension lines",
    notes: [
      "The poles of a tension now sit out near the systems that hold them, so each tension reads as a clean line instead of crowding the center.",
      "The ⟷ marker shows when you hover or select a tension, and drag either end to move the line with it.",
    ],
  },
  {
    date: "2026-06-14",
    title: "Tidy a busy map, and lines that follow",
    notes: [
      "A new min connections slider on the map lets you show only the themes that connect a number of points you choose, so you can thin out a crowded chart.",
      "Drag any point, a theme or a tension pole, and the lines attached to it now follow as you move it.",
    ],
  },
  {
    date: "2026-06-14",
    title: "Every tension shows on the map",
    notes: [
      "The convergence map now draws all of your tensions, not just the ones between two cross-confirmed themes.",
      "When one side of a tension is held by a single tradition, it shows as a small violet pole near the systems that hold it, so the full picture is visible.",
    ],
  },
  {
    date: "2026-06-14",
    title: "A real page for each system",
    notes: [
      "Every system now has an in-depth page: what it is, how to read your result, how it applies to your life, and a plain meaning for each of your stats.",
      "We added more detail to each reading and more connections between systems, so it is easier to see what is strong, what is a tension, and who you are in each tradition.",
    ],
  },
  {
    date: "2026-06-14",
    title: "Name numerology is here",
    notes: [
      "Add your full name to read name numerology, the numbers in the letters of your name.",
      "It adds an independent voice to the synthesis, so when it agrees with the sky and the calendar, that agreement means more.",
      "Your name is optional and stays yours: nothing is saved unless you sign in and save the chart.",
    ],
  },
  {
    date: "2026-06-14",
    title: "Explore your strengths and tensions",
    notes: [
      "The convergence chart is now an explorer: switch between a map, ranked strength bars, system arcs, and a table.",
      "Choose a lens for everything, just your strengths, or just your tensions, and filter by what each system reads from.",
      "Click any theme to see your strength and your growth edge, and ask for a deeper reading. Drag the map around (it remembers your layout) and save it as an image.",
    ],
  },
  {
    date: "2026-06-14",
    title: "Every theme on the chart, and what it means for you",
    notes: [
      "The convergence chart now shows every theme it found, with tension lines that connect opposing themes and follow them as you drag.",
      "Turn the tension lines on or off, and click any theme or tension to read how it tends to show up in your life.",
    ],
  },
  {
    date: "2026-06-14",
    title: "The convergence chart is now interactive",
    notes: [
      "Hover any point for a label, click a theme or tension to read about it in the panel beside the chart, and click a system to see its chart and stats.",
      "Themes are spread out so they are all visible, and you can drag any one to move it around.",
    ],
  },
  {
    date: "2026-06-14",
    title: "A clearer systems dashboard",
    notes: [
      "Each system now reads as a tidy card: your chart on the left, your energy at a glance on the right, how it applies underneath.",
      "A row on each card shows the themes you share with other systems, and tapping one jumps you straight there.",
    ],
  },
  {
    date: "2026-06-14",
    title: "A clearer home page",
    notes: [
      "The home page now explains plainly what OneSky does: your chart read across many traditions at once, with the few things they all agree on surfaced for you.",
      "New sections walk through how it works and what you get, in plain, readable language.",
    ],
  },
  {
    date: "2026-06-14",
    title: "The convergence chart now makes sense at a glance",
    notes: [
      "The chart labels your strongest themes and pulls them toward the center as more traditions agree, with a plain summary of what it says about your energy.",
      "Every section now explains what it is, and each system shows an energy cheat sheet so you can read it quickly.",
    ],
  },
  {
    date: "2026-06-14",
    title: "An interactive convergence chart, and a clearer reader",
    notes: [
      "Your reading now opens with an interactive convergence chart: your systems on a ring, the themes they agree on pulling toward the center, and the tensions between them. Tap any point for details.",
      "Bigger, easier-to-read text, a plain explanation on every system, and the chart wheel now sits with your Western astrology.",
      "Your written reading is saved to your chart and shown right away, until you choose to refresh it.",
    ],
  },
  {
    date: "2026-06-14",
    title: "A warmer look, and a page for every system",
    notes: [
      "OneSky has a warmer, more readable look, with one consistent header and footer across the site.",
      "Each system now has its own page: your details, the system and its lineage, your chart drawn in its traditional form, and how it connects to the other systems.",
    ],
  },
  {
    date: "2026-06-14",
    title: "Each system now shows its own chart",
    notes: [
      "Every tradition draws in its own traditional form, from your data: the Human Design bodygraph, the BaZi four pillars, the Maya kin, the Dreamspell signature, your Tarot birth cards, and your numerology life path.",
      "The illustrations are original and built from your chart, not stock images.",
    ],
  },
  {
    date: "2026-06-14",
    title: "A focused set of systems, with more on the way",
    notes: [
      "Your reading now leads with a focused core set of traditions, kept clear and uncluttered.",
      "More systems are registered behind the scenes and can be switched on over time.",
    ],
  },
  {
    date: "2026-06-14",
    title: "Readings write live, and you can edit a chart",
    notes: [
      "Your reading now streams in live as it is written, over the synthesis it reads and never computes.",
      "The resonance page has its own reading, written through the lens you pick, platonic or intimate.",
      "A reading is saved once written, so reopening a chart brings it back instantly.",
      "Edit a saved chart's birth date, time, or place, and the reading updates to match.",
    ],
  },
  {
    date: "2026-06-14",
    title: "OneSky is live",
    notes: [
      "Read your birth moment across many traditions, with a synthesis that shows real overlap.",
      "Create an account with a magic link and save your charts privately.",
      "Search for any birthplace in the world as you type.",
    ],
  },
  {
    date: "2026-06-14",
    title: "Chart compute fixed on the live site",
    notes: [
      "Computing a chart now returns your full reading instead of an error.",
    ],
  },
  {
    date: "2026-06-14",
    title: "Sign in completes reliably",
    notes: [
      "Magic-link sign in now finishes and returns you to OneSky already signed in.",
    ],
  },
];

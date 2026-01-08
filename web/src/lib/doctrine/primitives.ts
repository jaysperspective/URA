// src/lib/doctrine/primitives.ts

export type PlanetSlug =
  | "sun"
  | "moon"
  | "mercury"
  | "venus"
  | "mars"
  | "jupiter"
  | "saturn"
  | "uranus"
  | "neptune"
  | "pluto"
  | "chiron"
  | "north_node"
  | "south_node";

export type SignSlug =
  | "aries"
  | "taurus"
  | "gemini"
  | "cancer"
  | "leo"
  | "virgo"
  | "libra"
  | "scorpio"
  | "sagittarius"
  | "capricorn"
  | "aquarius"
  | "pisces";

export type Modality = "cardinal" | "fixed" | "mutable";
export type Element = "fire" | "earth" | "air" | "water";

export type Planet = {
  slug: PlanetSlug;
  name: string;
  core: string;
  gift: string;
  shadow: string;
  directive: string;
};

export type Sign = {
  slug: SignSlug;
  name: string;
  strategy: string;
  element: Element;
  modality: Modality;
  gift: string;
  shadow: string;
  directive: string;
};

export type House = {
  num: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  label: string;
  name: string;
  domain: string;
  gift: string;
  shadow: string;
  directive: string;
};

export const PLANETS: Planet[] = [
  { slug: "sun", name: "Sun", core: "Identity, vitality, purpose, conscious will", gift: "Radiate", shadow: "Ego rigidity", directive: "Lead with purpose; burn clean." },
  { slug: "moon", name: "Moon", core: "Emotional regulation, instinct, memory, safety", gift: "Feel/hold", shadow: "Mood enmeshment", directive: "Name the need; build the container." },
  { slug: "mercury", name: "Mercury", core: "Perception, cognition, language, decision-making", gift: "Analyze/speak", shadow: "Nervous looping", directive: "Clarify; then communicate." },
  { slug: "venus", name: "Venus", core: "Value, attraction, harmony, attachment", gift: "Attract/relate", shadow: "People-pleasing/indulgence", directive: "Choose what you truly value." },
  { slug: "mars", name: "Mars", core: "Drive, assertion, conflict, survival energy", gift: "Act/defend", shadow: "Reactivity", directive: "Act with clean intent." },
  { slug: "jupiter", name: "Jupiter", core: "Expansion, meaning, belief systems, opportunity", gift: "Expand/teach", shadow: "Excess/dogma", directive: "Grow with discernment." },
  { slug: "saturn", name: "Saturn", core: "Limits, discipline, responsibility, time", gift: "Structure/commit", shadow: "Fear/avoidance", directive: "Do the work; earn the result." },
  { slug: "uranus", name: "Uranus", core: "Disruption, awakening, individuation, innovation", gift: "Liberate", shadow: "Chaos for its own sake", directive: "Break patterns—keep truth." },
  { slug: "neptune", name: "Neptune", core: "Dissolution, faith, imagination, illusion", gift: "Merge/dream", shadow: "Confusion/escape", directive: "Seek the real signal." },
  { slug: "pluto", name: "Pluto", core: "Power, compulsion, death/rebirth, transformation", gift: "Transform", shadow: "Control obsession", directive: "Shed skins; choose integrity." },
  { slug: "chiron", name: "Chiron", core: "Wound pattern, sensitivity, mentoring through pain", gift: "Teach/heal", shadow: "Identity stuck in wound", directive: "Turn pain into skill, gently." },
  { slug: "north_node", name: "North Node", core: "Growth edge, future direction, unfamiliar medicine", gift: "Evolve", shadow: "Anxiety of the new", directive: "Walk toward the stretch." },
  { slug: "south_node", name: "South Node", core: "Past mastery, comfort groove, default pattern", gift: "Recall", shadow: "Stagnation", directive: "Use the gift; don’t live there." },
];

export const SIGNS: Sign[] = [
  { slug: "aries", name: "Aries", strategy: "Initiate, act, confront", element: "fire", modality: "cardinal", gift: "Courage", shadow: "Impulsiveness", directive: "Start clean; own the choice." },
  { slug: "taurus", name: "Taurus", strategy: "Stabilize, preserve, value", element: "earth", modality: "fixed", gift: "Steadiness", shadow: "Stubbornness", directive: "Build slowly; keep what matters." },
  { slug: "gemini", name: "Gemini", strategy: "Connect, compare, communicate", element: "air", modality: "mutable", gift: "Curiosity", shadow: "Scatteredness", directive: "Gather data; don’t dilute it." },
  { slug: "cancer", name: "Cancer", strategy: "Protect, remember, nurture", element: "water", modality: "cardinal", gift: "Care", shadow: "Defensiveness", directive: "Protect without closing." },
  { slug: "leo", name: "Leo", strategy: "Express, radiate, create", element: "fire", modality: "fixed", gift: "Confidence", shadow: "Pride", directive: "Create from the heart, not applause." },
  { slug: "virgo", name: "Virgo", strategy: "Refine, analyze, improve", element: "earth", modality: "mutable", gift: "Precision", shadow: "Perfectionism", directive: "Make it useful; ship it." },
  { slug: "libra", name: "Libra", strategy: "Balance, negotiate, harmonize", element: "air", modality: "cardinal", gift: "Fairness", shadow: "Indecision", directive: "Choose the just line." },
  { slug: "scorpio", name: "Scorpio", strategy: "Penetrate, bond, transform", element: "water", modality: "fixed", gift: "Depth", shadow: "Control", directive: "Go deep; stay honest." },
  { slug: "sagittarius", name: "Sagittarius", strategy: "Explore, believe, expand", element: "fire", modality: "mutable", gift: "Optimism", shadow: "Overreach", directive: "Aim wide; verify truth." },
  { slug: "capricorn", name: "Capricorn", strategy: "Structure, commit, govern", element: "earth", modality: "cardinal", gift: "Discipline", shadow: "Coldness", directive: "Earn it; keep it human." },
  { slug: "aquarius", name: "Aquarius", strategy: "Detach, innovate, decentralize", element: "air", modality: "fixed", gift: "Originality", shadow: "Alienation", directive: "Be different with purpose." },
  { slug: "pisces", name: "Pisces", strategy: "Dissolve, empathize, transcend", element: "water", modality: "mutable", gift: "Compassion", shadow: "Escape", directive: "Surrender without disappearing." },
];

export const HOUSES: House[] = [
  { num: 1, label: "1st", name: "Self & Orientation", domain: "Identity, approach, embodiment", gift: "Presence", shadow: "Self-absorption", directive: "Stand where you are; move intentionally." },
  { num: 2, label: "2nd", name: "Resources", domain: "Money, skills, self-worth, possessions", gift: "Stewardship", shadow: "Scarcity/clinging", directive: "Price yourself honestly; build skills." },
  { num: 3, label: "3rd", name: "Mind", domain: "Thinking, learning, siblings, language", gift: "Fluency", shadow: "Noise/overthinking", directive: "Say what’s true; keep it simple." },
  { num: 4, label: "4th", name: "Roots", domain: "Home, family, emotional foundation", gift: "Grounding", shadow: "Regression", directive: "Secure the base; then build." },
  { num: 5, label: "5th", name: "Creation", domain: "Art, joy, romance, children", gift: "Play", shadow: "Validation-seeking", directive: "Create for life, not performance." },
  { num: 6, label: "6th", name: "Maintenance", domain: "Work, health, service, routines", gift: "Craft", shadow: "Burnout", directive: "Small habits decide outcomes." },
  { num: 7, label: "7th", name: "Mirrors", domain: "Partnership, contracts, projections", gift: "Cooperation", shadow: "Codependence", directive: "Choose mirrors that tell the truth." },
  { num: 8, label: "8th", name: "Depth", domain: "Shared resources, power, sex, death/rebirth", gift: "Alchemy", shadow: "Obsession", directive: "Share cleanly; transform consciously." },
  { num: 9, label: "9th", name: "Meaning", domain: "Philosophy, travel, belief systems", gift: "Vision", shadow: "Dogma", directive: "Test beliefs in real life." },
  { num: 10, label: "10th", name: "Authority", domain: "Career, reputation, legacy", gift: "Leadership", shadow: "Status addiction", directive: "Serve something bigger than ego." },
  { num: 11, label: "11th", name: "Collective", domain: "Community, networks, future goals", gift: "Belonging", shadow: "Crowd-loss", directive: "Find your people; keep your spine." },
  { num: 12, label: "12th", name: "Unseen", domain: "Subconscious, surrender, retreat", gift: "Spirit", shadow: "Avoidance", directive: "Rest, reflect, release—then return." },
];

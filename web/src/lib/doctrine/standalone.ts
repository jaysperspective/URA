// src/lib/doctrine/standalone.ts
// Standalone doctrine cards for individual signs, houses, and planets

export type StandaloneCard = {
  key: string;
  type: "sign" | "house" | "planet";
  labels: {
    name: string;
    category: string;
  };
  core: string;
  description: string;
  strengths: string[];
  shadows: string[];
  directives: string[];
  tags: string[];
};

export const SIGN_CARDS: StandaloneCard[] = [
  {
    key: "sign|aries",
    type: "sign",
    labels: { name: "Aries", category: "Sign" },
    core: "Initiate, act, confront",
    description: "Aries represents the energy of initiation and new beginnings. It is the spark that starts the fire, the first breath of spring. Aries energy is direct, courageous, and unafraid to pioneer new territory. It acts first and thinks later, trusting instinct over deliberation.",
    strengths: ["Courage", "Initiative", "Directness", "Pioneering spirit"],
    shadows: ["Impulsiveness", "Aggression", "Impatience", "Self-absorption"],
    directives: ["Start clean; own the choice.", "Act before hesitation sets in.", "Lead with presence, not performance."],
    tags: ["aries", "fire", "cardinal"],
  },
  {
    key: "sign|taurus",
    type: "sign",
    labels: { name: "Taurus", category: "Sign" },
    core: "Stabilize, sustain, enjoy",
    description: "Taurus represents the energy of consolidation and preservation. It builds upon what has been started, creating lasting structures and cultivating resources. Taurus energy is patient, sensual, and committed to quality over speed.",
    strengths: ["Patience", "Reliability", "Sensuality", "Resourcefulness"],
    shadows: ["Stubbornness", "Possessiveness", "Resistance to change", "Materialism"],
    directives: ["Build slowly and well.", "Trust the process of accumulation.", "Honor what sustains you."],
    tags: ["taurus", "earth", "fixed"],
  },
  {
    key: "sign|gemini",
    type: "sign",
    labels: { name: "Gemini", category: "Sign" },
    core: "Connect, communicate, explore",
    description: "Gemini represents the energy of mental exploration and connection. It gathers information, makes connections, and communicates ideas. Gemini energy is curious, adaptable, and thrives on variety and intellectual stimulation.",
    strengths: ["Curiosity", "Adaptability", "Communication", "Quick thinking"],
    shadows: ["Superficiality", "Inconsistency", "Restlessness", "Scattered focus"],
    directives: ["Say what's true; keep it simple.", "Follow curiosity without losing focus.", "Connect ideas to action."],
    tags: ["gemini", "air", "mutable"],
  },
  {
    key: "sign|cancer",
    type: "sign",
    labels: { name: "Cancer", category: "Sign" },
    core: "Nurture, protect, belong",
    description: "Cancer represents the energy of emotional depth and protection. It creates safe containers for growth, nurtures what matters, and honors the importance of belonging. Cancer energy is intuitive, caring, and deeply connected to home and roots.",
    strengths: ["Nurturing", "Intuition", "Emotional depth", "Protectiveness"],
    shadows: ["Moodiness", "Clinginess", "Defensiveness", "Over-sensitivity"],
    directives: ["Secure the base; then build.", "Trust your emotional intelligence.", "Protect without smothering."],
    tags: ["cancer", "water", "cardinal"],
  },
  {
    key: "sign|leo",
    type: "sign",
    labels: { name: "Leo", category: "Sign" },
    core: "Create, express, radiate",
    description: "Leo represents the energy of creative self-expression and vitality. It brings warmth, generosity, and the courage to be seen. Leo energy is confident, dramatic, and committed to living with heart and authenticity.",
    strengths: ["Creativity", "Generosity", "Confidence", "Leadership"],
    shadows: ["Pride", "Attention-seeking", "Domination", "Stubbornness"],
    directives: ["Lead with purpose; burn clean.", "Create from the heart.", "Shine without diminishing others."],
    tags: ["leo", "fire", "fixed"],
  },
  {
    key: "sign|virgo",
    type: "sign",
    labels: { name: "Virgo", category: "Sign" },
    core: "Refine, serve, improve",
    description: "Virgo represents the energy of analysis and service. It seeks to improve, refine, and make useful. Virgo energy is discerning, practical, and committed to excellence through attention to detail and meaningful contribution.",
    strengths: ["Discernment", "Service", "Precision", "Practicality"],
    shadows: ["Perfectionism", "Criticism", "Anxiety", "Over-analysis"],
    directives: ["Improve quality, not scale.", "Serve without martyrdom.", "Trust 'good enough' when appropriate."],
    tags: ["virgo", "earth", "mutable"],
  },
  {
    key: "sign|libra",
    type: "sign",
    labels: { name: "Libra", category: "Sign" },
    core: "Balance, relate, harmonize",
    description: "Libra represents the energy of relationship and equilibrium. It seeks fairness, beauty, and harmony in all exchanges. Libra energy is diplomatic, aesthetic, and committed to creating balance between self and other.",
    strengths: ["Diplomacy", "Fairness", "Aesthetic sense", "Partnership"],
    shadows: ["Indecision", "People-pleasing", "Avoidance of conflict", "Superficiality"],
    directives: ["Seek balance without losing yourself.", "Name what's fair; act on it.", "Create beauty that serves."],
    tags: ["libra", "air", "cardinal"],
  },
  {
    key: "sign|scorpio",
    type: "sign",
    labels: { name: "Scorpio", category: "Sign" },
    core: "Transform, penetrate, regenerate",
    description: "Scorpio represents the energy of depth and transformation. It goes beneath the surface, confronts what others avoid, and facilitates profound change. Scorpio energy is intense, perceptive, and committed to truth at any cost.",
    strengths: ["Depth", "Transformation", "Perception", "Resilience"],
    shadows: ["Obsession", "Control", "Jealousy", "Destructiveness"],
    directives: ["Go deep without drowning.", "Transform what no longer serves.", "Use power responsibly."],
    tags: ["scorpio", "water", "fixed"],
  },
  {
    key: "sign|sagittarius",
    type: "sign",
    labels: { name: "Sagittarius", category: "Sign" },
    core: "Expand, explore, believe",
    description: "Sagittarius represents the energy of expansion and meaning-making. It seeks the bigger picture, explores new horizons, and connects experience to purpose. Sagittarius energy is optimistic, adventurous, and committed to growth through understanding.",
    strengths: ["Optimism", "Vision", "Adventure", "Wisdom-seeking"],
    shadows: ["Over-extension", "Dogmatism", "Restlessness", "Bluntness"],
    directives: ["Aim high without losing ground.", "Seek meaning, not just experience.", "Share wisdom without preaching."],
    tags: ["sagittarius", "fire", "mutable"],
  },
  {
    key: "sign|capricorn",
    type: "sign",
    labels: { name: "Capricorn", category: "Sign" },
    core: "Structure, achieve, master",
    description: "Capricorn represents the energy of structure and mastery. It builds lasting institutions, achieves through discipline, and takes responsibility for outcomes. Capricorn energy is ambitious, practical, and committed to excellence through sustained effort.",
    strengths: ["Discipline", "Responsibility", "Achievement", "Strategic thinking"],
    shadows: ["Rigidity", "Workaholism", "Pessimism", "Coldness"],
    directives: ["Build structures that last.", "Take responsibility without martyrdom.", "Master through practice, not force."],
    tags: ["capricorn", "earth", "cardinal"],
  },
  {
    key: "sign|aquarius",
    type: "sign",
    labels: { name: "Aquarius", category: "Sign" },
    core: "Innovate, liberate, connect",
    description: "Aquarius represents the energy of innovation and collective vision. It sees beyond convention, values individuality, and works toward ideals that serve the whole. Aquarius energy is progressive, humanitarian, and committed to authentic community.",
    strengths: ["Innovation", "Independence", "Humanitarianism", "Vision"],
    shadows: ["Detachment", "Rebellion for its own sake", "Eccentricity", "Emotional distance"],
    directives: ["Innovate without alienating.", "Serve the collective without losing yourself.", "Connect through ideas and ideals."],
    tags: ["aquarius", "air", "fixed"],
  },
  {
    key: "sign|pisces",
    type: "sign",
    labels: { name: "Pisces", category: "Sign" },
    core: "Dissolve, imagine, transcend",
    description: "Pisces represents the energy of dissolution and transcendence. It connects to the whole, dissolves boundaries, and accesses realms beyond the ordinary. Pisces energy is compassionate, imaginative, and committed to healing through surrender.",
    strengths: ["Compassion", "Imagination", "Intuition", "Spiritual connection"],
    shadows: ["Escapism", "Victimhood", "Confusion", "Boundary dissolution"],
    directives: ["Dissolve without losing form.", "Dream with discernment.", "Serve through presence, not rescue."],
    tags: ["pisces", "water", "mutable"],
  },
];

export const HOUSE_CARDS: StandaloneCard[] = [
  {
    key: "house|1",
    type: "house",
    labels: { name: "1st House", category: "House" },
    core: "Self & Orientation",
    description: "The 1st House represents identity, approach to life, and how you present yourself to the world. It is the lens through which you see life and through which others first perceive you. This is the house of embodiment and personal presence.",
    strengths: ["Presence", "Initiative", "Self-awareness", "Personal agency"],
    shadows: ["Self-absorption", "Image fixation", "Aggression", "Defensiveness"],
    directives: ["Stand where you are; move intentionally.", "Own your presence.", "Lead with authenticity."],
    tags: ["house1", "angular", "self"],
  },
  {
    key: "house|2",
    type: "house",
    labels: { name: "2nd House", category: "House" },
    core: "Resources",
    description: "The 2nd House represents money, skills, self-worth, and possessions. It governs what you value, what you have, and what you can build with. This is the house of material security and personal resources.",
    strengths: ["Stewardship", "Resourcefulness", "Self-worth", "Practical skill"],
    shadows: ["Scarcity mindset", "Clinging", "Materialism", "Self-doubt"],
    directives: ["Price yourself honestly; build skills.", "Cultivate what you have.", "Value substance over accumulation."],
    tags: ["house2", "succedent", "resources"],
  },
  {
    key: "house|3",
    type: "house",
    labels: { name: "3rd House", category: "House" },
    core: "Mind",
    description: "The 3rd House represents thinking, learning, communication, and immediate environment. It governs siblings, neighbors, and daily exchanges. This is the house of mental activity and local connection.",
    strengths: ["Fluency", "Curiosity", "Adaptability", "Communication"],
    shadows: ["Noise", "Overthinking", "Superficiality", "Scattered attention"],
    directives: ["Say what's true; keep it simple.", "Learn actively.", "Connect ideas to action."],
    tags: ["house3", "cadent", "mind"],
  },
  {
    key: "house|4",
    type: "house",
    labels: { name: "4th House", category: "House" },
    core: "Roots",
    description: "The 4th House represents home, family, emotional foundation, and origins. It governs your private life and psychological roots. This is the house of belonging and inner security.",
    strengths: ["Grounding", "Emotional depth", "Nurturing", "Foundation"],
    shadows: ["Regression", "Family patterns", "Insularity", "Emotional flooding"],
    directives: ["Secure the base; then build.", "Honor your roots without being trapped by them.", "Create sanctuary."],
    tags: ["house4", "angular", "roots"],
  },
  {
    key: "house|5",
    type: "house",
    labels: { name: "5th House", category: "House" },
    core: "Expression",
    description: "The 5th House represents creativity, joy, romance, and self-expression. It governs children, play, and what brings you alive. This is the house of creative vitality and authentic pleasure.",
    strengths: ["Creativity", "Joy", "Courage to create", "Authentic expression"],
    shadows: ["Drama", "Attention-seeking", "Recklessness", "Self-indulgence"],
    directives: ["Create from the heart.", "Play without performance.", "Express without seeking approval."],
    tags: ["house5", "succedent", "expression"],
  },
  {
    key: "house|6",
    type: "house",
    labels: { name: "6th House", category: "House" },
    core: "Service",
    description: "The 6th House represents work, health, daily routine, and service. It governs how you maintain yourself and contribute through practical action. This is the house of craft and functional well-being.",
    strengths: ["Craft", "Service", "Health awareness", "Practical discipline"],
    shadows: ["Perfectionism", "Burnout", "Anxiety", "Servitude"],
    directives: ["Improve quality, not scale.", "Serve without martyrdom.", "Maintain what matters."],
    tags: ["house6", "cadent", "service"],
  },
  {
    key: "house|7",
    type: "house",
    labels: { name: "7th House", category: "House" },
    core: "Partnership",
    description: "The 7th House represents one-on-one relationships, partnerships, and open enemies. It governs marriage, business partners, and how you relate to significant others. This is the house of balance and committed relationship.",
    strengths: ["Partnership", "Balance", "Commitment", "Relational skill"],
    shadows: ["Projection", "Dependency", "Conflict avoidance", "Loss of self"],
    directives: ["Relate without losing yourself.", "Commit with clarity.", "See others clearly."],
    tags: ["house7", "angular", "partnership"],
  },
  {
    key: "house|8",
    type: "house",
    labels: { name: "8th House", category: "House" },
    core: "Transformation",
    description: "The 8th House represents shared resources, intimacy, death, and regeneration. It governs what you share deeply with others and what must transform. This is the house of depth and psychological power.",
    strengths: ["Depth", "Transformation", "Intimacy", "Regeneration"],
    shadows: ["Control", "Obsession", "Power struggles", "Fear of loss"],
    directives: ["Go deep without drowning.", "Transform what no longer serves.", "Share power responsibly."],
    tags: ["house8", "succedent", "transformation"],
  },
  {
    key: "house|9",
    type: "house",
    labels: { name: "9th House", category: "House" },
    core: "Expansion",
    description: "The 9th House represents higher learning, travel, philosophy, and meaning. It governs your worldview and how you expand beyond the familiar. This is the house of vision and understanding.",
    strengths: ["Vision", "Wisdom", "Adventure", "Meaning-making"],
    shadows: ["Dogmatism", "Over-extension", "Preachiness", "Escapism"],
    directives: ["Aim high without losing ground.", "Seek meaning, not just experience.", "Expand with integrity."],
    tags: ["house9", "cadent", "expansion"],
  },
  {
    key: "house|10",
    type: "house",
    labels: { name: "10th House", category: "House" },
    core: "Achievement",
    description: "The 10th House represents career, public reputation, and authority. It governs your place in the world and what you're known for. This is the house of mastery and public contribution.",
    strengths: ["Achievement", "Authority", "Discipline", "Public contribution"],
    shadows: ["Status obsession", "Workaholism", "Coldness", "Image over substance"],
    directives: ["Build structures that last.", "Earn authority through mastery.", "Contribute visibly and responsibly."],
    tags: ["house10", "angular", "achievement"],
  },
  {
    key: "house|11",
    type: "house",
    labels: { name: "11th House", category: "House" },
    core: "Community",
    description: "The 11th House represents groups, friends, hopes, and collective vision. It governs your social networks and aspirations for the future. This is the house of belonging beyond family and idealistic connection.",
    strengths: ["Community", "Vision", "Friendship", "Collective purpose"],
    shadows: ["Detachment", "Conformity", "Utopianism", "Social anxiety"],
    directives: ["Connect through shared purpose.", "Contribute to the collective.", "Dream with others, act with discernment."],
    tags: ["house11", "succedent", "community"],
  },
  {
    key: "house|12",
    type: "house",
    labels: { name: "12th House", category: "House" },
    core: "Dissolution",
    description: "The 12th House represents the unconscious, solitude, hidden matters, and transcendence. It governs what lies beneath awareness and the process of letting go. This is the house of endings and spiritual depth.",
    strengths: ["Intuition", "Compassion", "Transcendence", "Inner work"],
    shadows: ["Self-undoing", "Escapism", "Confusion", "Victimhood"],
    directives: ["Dissolve without losing form.", "Honor the unseen.", "Retreat to restore, not escape."],
    tags: ["house12", "cadent", "dissolution"],
  },
];

export const PLANET_CARDS: StandaloneCard[] = [
  {
    key: "planet|sun",
    type: "planet",
    labels: { name: "Sun", category: "Planet" },
    core: "Identity, vitality, purpose, conscious will",
    description: "The Sun represents your core identity, life force, and central purpose. It is who you are at the deepest level—your essential self that seeks to shine and be recognized. The Sun shows what vitalizes you and where you find meaning.",
    strengths: ["Radiance", "Vitality", "Purpose", "Leadership"],
    shadows: ["Ego rigidity", "Pride", "Self-absorption", "Need for validation"],
    directives: ["Lead with purpose; burn clean.", "Shine without diminishing others.", "Know your center."],
    tags: ["sun", "luminary", "identity"],
  },
  {
    key: "planet|moon",
    type: "planet",
    labels: { name: "Moon", category: "Planet" },
    core: "Emotional nature, instinct, needs, belonging",
    description: "The Moon represents your emotional nature, instinctive responses, and what you need to feel safe. It governs habits, memory, and the inner world. The Moon shows how you nurture and need to be nurtured.",
    strengths: ["Emotional intelligence", "Nurturing", "Intuition", "Receptivity"],
    shadows: ["Moodiness", "Neediness", "Reactivity", "Clinging to the past"],
    directives: ["Honor your needs without being ruled by them.", "Trust your instincts.", "Create emotional safety."],
    tags: ["moon", "luminary", "emotion"],
  },
  {
    key: "planet|mercury",
    type: "planet",
    labels: { name: "Mercury", category: "Planet" },
    core: "Communication, thought, learning, exchange",
    description: "Mercury represents how you think, communicate, and process information. It governs language, commerce, and mental activity. Mercury shows your learning style and how you connect ideas.",
    strengths: ["Communication", "Intelligence", "Adaptability", "Curiosity"],
    shadows: ["Overthinking", "Superficiality", "Nervous energy", "Duplicity"],
    directives: ["Think clearly; speak precisely.", "Learn actively.", "Connect without scattering."],
    tags: ["mercury", "personal", "mind"],
  },
  {
    key: "planet|venus",
    type: "planet",
    labels: { name: "Venus", category: "Planet" },
    core: "Love, value, beauty, attraction",
    description: "Venus represents what you love, value, and find beautiful. It governs relationships, aesthetics, and pleasure. Venus shows how you attract and what attracts you, as well as your relationship to money and comfort.",
    strengths: ["Love", "Harmony", "Aesthetic sense", "Diplomacy"],
    shadows: ["Vanity", "Laziness", "People-pleasing", "Over-indulgence"],
    directives: ["Love without losing yourself.", "Create beauty that serves.", "Value what matters."],
    tags: ["venus", "personal", "love"],
  },
  {
    key: "planet|mars",
    type: "planet",
    labels: { name: "Mars", category: "Planet" },
    core: "Drive, action, desire, assertion",
    description: "Mars represents how you act, assert yourself, and pursue what you want. It governs energy, competition, and courage. Mars shows your fighting style and how you handle conflict and desire.",
    strengths: ["Courage", "Initiative", "Drive", "Decisiveness"],
    shadows: ["Aggression", "Impatience", "Destructiveness", "Impulsiveness"],
    directives: ["Act decisively; clean up afterward.", "Channel anger constructively.", "Fight for what matters."],
    tags: ["mars", "personal", "action"],
  },
  {
    key: "planet|jupiter",
    type: "planet",
    labels: { name: "Jupiter", category: "Planet" },
    core: "Growth, expansion, meaning, opportunity",
    description: "Jupiter represents how you grow, expand, and find meaning. It governs luck, philosophy, and higher learning. Jupiter shows where you seek more and how you connect to larger patterns of purpose.",
    strengths: ["Wisdom", "Generosity", "Optimism", "Vision"],
    shadows: ["Excess", "Over-confidence", "Wastefulness", "Preachiness"],
    directives: ["Expand with integrity.", "Seek meaning, not just more.", "Share wisdom without imposing."],
    tags: ["jupiter", "social", "expansion"],
  },
  {
    key: "planet|saturn",
    type: "planet",
    labels: { name: "Saturn", category: "Planet" },
    core: "Structure, discipline, limitation, mastery",
    description: "Saturn represents structure, responsibility, and the work of maturation. It governs limits, time, and achievement through sustained effort. Saturn shows where you must grow up and what you can master.",
    strengths: ["Discipline", "Responsibility", "Mastery", "Endurance"],
    shadows: ["Rigidity", "Fear", "Pessimism", "Coldness"],
    directives: ["Do the work; earn the authority.", "Accept necessary limits.", "Build slowly and well."],
    tags: ["saturn", "social", "structure"],
  },
  {
    key: "planet|uranus",
    type: "planet",
    labels: { name: "Uranus", category: "Planet" },
    core: "Liberation, innovation, disruption, awakening",
    description: "Uranus represents the urge to break free, innovate, and awaken to new possibilities. It governs sudden change, technology, and the unconventional. Uranus shows where you seek freedom and how you individuate.",
    strengths: ["Innovation", "Independence", "Insight", "Liberation"],
    shadows: ["Rebellion", "Instability", "Detachment", "Eccentricity"],
    directives: ["Innovate without alienating.", "Free yourself without destroying.", "Awaken to what's possible."],
    tags: ["uranus", "transpersonal", "liberation"],
  },
  {
    key: "planet|neptune",
    type: "planet",
    labels: { name: "Neptune", category: "Planet" },
    core: "Transcendence, imagination, dissolution, spirituality",
    description: "Neptune represents the urge to dissolve boundaries, imagine, and connect to the transcendent. It governs dreams, illusions, and spiritual longing. Neptune shows where reality blurs and where you seek the divine.",
    strengths: ["Imagination", "Compassion", "Spiritual connection", "Artistic vision"],
    shadows: ["Escapism", "Delusion", "Victimhood", "Confusion"],
    directives: ["Dream with discernment.", "Dissolve without losing form.", "Serve through presence."],
    tags: ["neptune", "transpersonal", "transcendence"],
  },
  {
    key: "planet|pluto",
    type: "planet",
    labels: { name: "Pluto", category: "Planet" },
    core: "Transformation, power, death/rebirth, depth",
    description: "Pluto represents the process of profound transformation through destruction and renewal. It governs power, the unconscious, and what must die to be reborn. Pluto shows where you must face the depths.",
    strengths: ["Transformation", "Depth", "Power", "Regeneration"],
    shadows: ["Obsession", "Control", "Destructiveness", "Power abuse"],
    directives: ["Transform what no longer serves.", "Use power responsibly.", "Go deep without drowning."],
    tags: ["pluto", "transpersonal", "transformation"],
  },
  {
    key: "planet|chiron",
    type: "planet",
    labels: { name: "Chiron", category: "Planet" },
    core: "Wound, healing, teaching, bridge",
    description: "Chiron represents the wound that doesn't fully heal but becomes a source of wisdom and healing for others. It governs where we are hurt and how we transform that hurt into teaching. Chiron shows your deepest vulnerability and gift.",
    strengths: ["Healing", "Wisdom", "Teaching", "Empathy"],
    shadows: ["Victimhood", "Re-wounding", "Avoidance", "Martyr complex"],
    directives: ["Heal by helping others heal.", "Accept the wound; don't worship it.", "Teach what you've learned."],
    tags: ["chiron", "asteroid", "healing"],
  },
  {
    key: "planet|northnode",
    type: "planet",
    labels: { name: "North Node", category: "Point" },
    core: "Growth direction, destiny, unfamiliar territory",
    description: "The North Node represents the direction of growth and evolution in this lifetime. It points toward unfamiliar territory that feels uncomfortable but necessary. The North Node shows what you're learning to become.",
    strengths: ["Growth", "Evolution", "Purpose", "New skills"],
    shadows: ["Avoidance", "Fear of the unfamiliar", "Resistance to growth"],
    directives: ["Move toward discomfort.", "Develop new capacities.", "Trust the growth direction."],
    tags: ["northnode", "node", "destiny"],
  },
  {
    key: "planet|southnode",
    type: "planet",
    labels: { name: "South Node", category: "Point" },
    core: "Past mastery, comfort zone, release",
    description: "The South Node represents past mastery and the familiar territory you must release to grow. It shows talents and patterns that come easily but can become traps. The South Node indicates what to honor but not over-rely on.",
    strengths: ["Natural talent", "Experience", "Comfort", "Mastery"],
    shadows: ["Stagnation", "Over-reliance", "Comfort addiction", "Regression"],
    directives: ["Honor past mastery without clinging.", "Release what holds you back.", "Use old skills in service of new growth."],
    tags: ["southnode", "node", "release"],
  },
];

// Lookup maps for quick access
export const STANDALONE_CARDS = new Map<string, StandaloneCard>();

for (const card of [...SIGN_CARDS, ...HOUSE_CARDS, ...PLANET_CARDS]) {
  STANDALONE_CARDS.set(card.key, card);
}

// Helper to normalize standalone keys
export function normalizeStandaloneKey(type: "sign" | "house" | "planet", value: string): string | null {
  const v = value.toLowerCase().replace(/\s+/g, "").replace(/node$/, "node");

  if (type === "sign") {
    const signs = ["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"];
    if (signs.includes(v)) return `sign|${v}`;
    return null;
  }

  if (type === "house") {
    const num = parseInt(v.replace(/\D/g, ""));
    if (num >= 1 && num <= 12) return `house|${num}`;
    return null;
  }

  if (type === "planet") {
    const planets: Record<string, string> = {
      sun: "sun",
      moon: "moon",
      mercury: "mercury",
      venus: "venus",
      mars: "mars",
      jupiter: "jupiter",
      saturn: "saturn",
      uranus: "uranus",
      neptune: "neptune",
      pluto: "pluto",
      chiron: "chiron",
      northnode: "northnode",
      southnode: "southnode",
      "north node": "northnode",
      "south node": "southnode",
    };
    const mapped = planets[v];
    if (mapped) return `planet|${mapped}`;
    return null;
  }

  return null;
}

export function getStandaloneCard(type: "sign" | "house" | "planet", value: string): StandaloneCard | null {
  const key = normalizeStandaloneKey(type, value);
  if (!key) return null;
  return STANDALONE_CARDS.get(key) ?? null;
}

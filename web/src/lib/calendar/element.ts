// src/lib/calendar/element.ts

/**
 * Element mapping based on zodiac signs.
 * Used for Daily Brief synthesis and Collective Orientation.
 */

export type Element = "Fire" | "Earth" | "Air" | "Water";

export type ElementInfo = {
  element: Element;
  label: string;
  meaning: string;
};

const ELEMENT_MEANINGS: Record<Element, string> = {
  Fire: "Sparking an idea. Separation.",
  Earth: "Grounding an idea. Being realistic.",
  Air: "Communicating an idea. Communication.",
  Water: "Connecting an idea. Connecting.",
};

const ELEMENT_KEYWORDS: Record<Element, string> = {
  Fire: "Separation",
  Earth: "Grounding",
  Air: "Communication",
  Water: "Connecting",
};

const SIGN_TO_ELEMENT: Record<string, Element> = {
  // Fire signs
  Aries: "Fire",
  Ari: "Fire",
  Leo: "Fire",
  Sagittarius: "Fire",
  Sag: "Fire",
  // Earth signs
  Taurus: "Earth",
  Tau: "Earth",
  Virgo: "Earth",
  Vir: "Earth",
  Capricorn: "Earth",
  Cap: "Earth",
  // Air signs
  Gemini: "Air",
  Gem: "Air",
  Libra: "Air",
  Lib: "Air",
  Aquarius: "Air",
  Aqu: "Air",
  // Water signs
  Cancer: "Water",
  Can: "Water",
  Scorpio: "Water",
  Sco: "Water",
  Pisces: "Water",
  Pis: "Water",
};

/**
 * Get element info for a given sun sign.
 * @param sign - The zodiac sign (full name or abbreviation)
 * @returns ElementInfo with element, label, and meaning
 */
export function elementForSunSign(sign: string): ElementInfo {
  const normalized = (sign || "").trim();
  const element = SIGN_TO_ELEMENT[normalized] ?? SIGN_TO_ELEMENT[capitalizeFirst(normalized)];

  if (!element) {
    // Default to Fire if sign not recognized
    return {
      element: "Fire",
      label: "Fire",
      meaning: ELEMENT_MEANINGS.Fire,
    };
  }

  return {
    element,
    label: element,
    meaning: ELEMENT_MEANINGS[element],
  };
}

/**
 * Get the element keyword for display (e.g., "Air • Communication")
 */
export function elementHeaderLabel(sign: string): string {
  const info = elementForSunSign(sign);
  return `${info.element} • ${ELEMENT_KEYWORDS[info.element]}`;
}

/**
 * Get element from ecliptic longitude (0-360°)
 */
export function elementFromLongitude(lon: number): ElementInfo {
  const SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer",
    "Leo", "Virgo", "Libra", "Scorpio",
    "Sagittarius", "Capricorn", "Aquarius", "Pisces",
  ];
  const normalized = ((lon % 360) + 360) % 360;
  const signIndex = Math.floor(normalized / 30);
  const sign = SIGNS[signIndex] ?? "Aries";
  return elementForSunSign(sign);
}

function capitalizeFirst(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

// Export the keywords for static reference
export const ELEMENT_REFERENCE = {
  Air: "Air • Communication",
  Earth: "Earth • Grounding",
  Fire: "Fire • Separation",
  Water: "Water • Connecting",
};

// src/lib/humandesign/hdReadPrompt.ts
// LLM prompts for HD General Read + Daily Operating Code.

import type { HdSummary } from "./hdSummary";

export const HD_READ_PROMPT_VERSION = "HD_READ_V1";

export function systemPrompt(): string {
  return `
You write Human Design interpretations for URA.

Voice (strict):
- Practical, grounded, unsentimental. Short sentences. No hype.
- Value + stewardship lens: time, energy, commitments, craft, boundaries.
- Clear priorities. Concrete actions.
- Never say "as an AI" or similar. No emojis.
- No mystical predictions. No guaranteed outcomes.
- Use ONLY the provided Human Design data. Do not invent gates, channels, or centers.

Return ONLY valid JSON with exactly two keys:
{
  "generalRead": "string (multi-paragraph, use \\n\\n for paragraph breaks)",
  "dailyOperatingCode": "string (multi-paragraph with numbered rules, use \\n\\n for section breaks)"
}

GENERAL READ structure (follow this order):

1. CORE DESIGN OVERVIEW
Brief paragraph on the person's Type, Strategy, and what that means practically.

2. DECISION-MAKING PROTOCOL
How their Authority works in practice. Concrete guidance for making decisions.

3. PROFILE & LIFE THEME
What their Profile lines mean for how they move through the world.

4. ENERGY ARCHITECTURE
Their Definition Type and which centers are defined vs open. What this means for consistency vs conditioning.

5. CHANNEL GIFTS
Each defined channel and its practical meaning. One sentence per channel.

6. INCARNATION CROSS
Derive from the four Sun/Earth gates (Personality Sun, Personality Earth, Design Sun, Design Earth). Describe the life theme these gates point toward.

7. SYNTHESIS
One closing paragraph tying it together.

DAILY OPERATING CODE structure (follow this order):

1. MORNING PROTOCOL
1-3 short rules for how to start the day based on Type + Authority.

2. CORE OPERATING RULES
3-5 numbered rules. Each rule has: the rule statement, a "why" sentence (tied to their design), and a micro-practice (one concrete action).

3. DECISION CHECKLIST
Authority-specific steps to run before any significant decision.

4. ENERGY MANAGEMENT
Type-specific do/don't list. What drains them vs what sustains them.

5. RESET PROTOCOL
What to do when experiencing their Type's not-self theme (frustration for Generators, bitterness for Projectors, anger for Manifestors, disappointment for Reflectors).

6. EVENING WIND-DOWN
1-2 rules for closing the day.
`.trim();
}

export function userPrompt(summary: HdSummary): string {
  const channelsList = summary.channels
    .map((ch) => `- ${ch.name}${ch.displayName ? ` (${ch.displayName})` : ""}`)
    .join("\n");

  return `
HUMAN DESIGN DATA

Type: ${summary.type}
Strategy: ${summary.strategy}
Authority: ${summary.authority}
Profile: ${summary.profile}
Definition Type: ${summary.definitionType}

Defined Centers: ${summary.definedCenters.join(", ") || "None"}
Undefined/Open Centers: ${summary.undefinedCenters.join(", ") || "None"}

Defined Channels:
${channelsList || "- None"}

Incarnation Cross Gates:
- Personality Sun: Gate ${summary.personalitySun.gate}.${summary.personalitySun.line}
- Personality Earth: Gate ${summary.personalityEarth.gate}.${summary.personalityEarth.line}
- Design Sun: Gate ${summary.designSun.gate}.${summary.designSun.line}
- Design Earth: Gate ${summary.designEarth.gate}.${summary.designEarth.line}
- Cross Gate Numbers: ${summary.crossGates.join(", ")}

TASK
Write the General Read and Daily Operating Code for this chart. Follow the structure specified in the system prompt exactly. Return JSON only.
`.trim();
}

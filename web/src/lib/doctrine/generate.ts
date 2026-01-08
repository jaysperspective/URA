// src/lib/doctrine/generate.ts
import { PLANETS, SIGNS, HOUSES, type PlanetSlug, type SignSlug } from "./primitives";

export type DoctrineCard = {
  key: string; // planet|sign|houseNum
  placement: { planet: string; sign: string; house: number };
  labels: { placement: string; element: string; modality: string };
  function: { planet: string; core: string };
  style: { sign: string; strategy: string; element: string; modality: string };
  arena: { house: number; name: string; domain: string };
  synthesis: string;
  strengths: string[];
  shadows: string[];
  directives: string[];
  tags: string[];
};

export function generateOne(planet: PlanetSlug, sign: SignSlug, houseNum: number): DoctrineCard {
  const p = PLANETS.find(x => x.slug === planet);
  const s = SIGNS.find(x => x.slug === sign);
  const h = HOUSES.find(x => x.num === houseNum);

  if (!p) throw new Error(`Unknown planet/body: ${planet}`);
  if (!s) throw new Error(`Unknown sign: ${sign}`);
  if (!h) throw new Error(`Unknown house: ${houseNum}`);

  const placementLabel = `${p.name} in ${s.name} — ${h.label} House`;

  const synthesis =
    `${p.core} expresses through ${s.strategy.toLowerCase()} in the domain of ${h.domain.toLowerCase()}. ` +
    `Strength comes from ${p.gift.toLowerCase()} shaped by ${s.gift.toLowerCase()} and aimed at ${h.gift.toLowerCase()}. ` +
    `Pressure shows as ${p.shadow.toLowerCase()} when ${s.shadow.toLowerCase()} or ${h.shadow.toLowerCase()} takes over. ` +
    `Directive: ${p.directive} ${s.directive} ${h.directive}`;

  return {
    key: `${p.slug}|${s.slug}|${h.num}`,
    placement: { planet: p.name, sign: s.name, house: h.num },
    labels: { placement: placementLabel, element: s.element, modality: s.modality },
    function: { planet: p.name, core: p.core },
    style: { sign: s.name, strategy: s.strategy, element: s.element, modality: s.modality },
    arena: { house: h.num, name: h.name, domain: h.domain },
    synthesis,
    strengths: [p.gift, s.gift, h.gift],
    shadows: [p.shadow, s.shadow, h.shadow],
    directives: [p.directive, s.directive, h.directive],
    tags: [p.slug, s.slug, `house${h.num}`, s.element, s.modality],
  };
}

export function generateAll(): { meta: any; cards: DoctrineCard[] } {
  const cards: DoctrineCard[] = [];
  for (const p of PLANETS) {
    for (const s of SIGNS) {
      for (const h of HOUSES) {
        cards.push(generateOne(p.slug, s.slug, h.num));
      }
    }
  }
  return {
    meta: {
      planets: PLANETS.length,
      signs: SIGNS.length,
      houses: HOUSES.length,
      total: cards.length, // 1872 with chiron + nodes
    },
    cards,
  };
}

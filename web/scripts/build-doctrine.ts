// scripts/build-doctrine.ts
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { generateAll } from "../src/lib/doctrine/generate";

function main() {
  const out = generateAll();
  const target = resolve(process.cwd(), "src/lib/doctrine/doctrine.generated.json");
  writeFileSync(target, JSON.stringify(out, null, 2), "utf8");
  console.log(`Wrote ${out.meta.total} cards -> ${target}`);
}

main();

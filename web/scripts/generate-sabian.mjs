// scripts/generate-sabian.mjs
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

const ROOT = process.cwd();

// Load Next-style env files (local should win)
dotenv.config({ path: path.resolve(ROOT, ".env") });
dotenv.config({ path: path.resolve(ROOT, ".env.local"), override: true });

const OUT_PATH = path.resolve(ROOT, "src/lib/sabian/uraSabian.ts");

function mustEnv(...names) {
  for (const name of names) {
    const v = process.env[name];
    if (v && String(v).trim()) return String(v).trim();
  }
  throw new Error(`Missing env. Tried: ${names.join(", ")}`);
}

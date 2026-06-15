#!/usr/bin/env node
/**
 * Copies rectangular 4:3 flag SVGs from flag-icons for every ISO code in the backend seed.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const crmRoot = path.resolve(__dirname, '..');
const backendRoot = path.resolve(crmRoot, '../sbm-backend');
const seedPath = path.join(backendRoot, 'supabase/migrations/20260608120100_seed_reference_data.sql');
const sourceDir = path.join(crmRoot, 'node_modules/flag-icons/flags/4x3');
const targetDir = path.join(crmRoot, 'public/flags/4x3');

function extractIsoCodes(sql) {
  const codes = new Set();
  const re = /\('([A-Z]{2})',\s*'/g;
  let match;
  while ((match = re.exec(sql)) !== null) {
    codes.add(match[1].toLowerCase());
  }
  return [...codes].sort();
}

function main() {
  if (!fs.existsSync(seedPath)) {
    console.error(`Seed file not found: ${seedPath}`);
    process.exit(1);
  }
  if (!fs.existsSync(sourceDir)) {
    console.error('flag-icons not installed. Run: pnpm add -D flag-icons');
    process.exit(1);
  }

  const sql = fs.readFileSync(seedPath, 'utf8');
  const codes = extractIsoCodes(sql);

  fs.mkdirSync(targetDir, { recursive: true });

  let copied = 0;
  const missing = [];

  for (const code of codes) {
    const src = path.join(sourceDir, `${code}.svg`);
    const dest = path.join(targetDir, `${code}.svg`);
    if (!fs.existsSync(src)) {
      missing.push(code);
      continue;
    }
    fs.copyFileSync(src, dest);
    copied += 1;
  }

  console.log(`Synced ${copied}/${codes.length} flags to public/flags/4x3/`);
  if (missing.length > 0) {
    console.warn(`Missing flags (${missing.length}): ${missing.join(', ')}`);
  }
}

main();

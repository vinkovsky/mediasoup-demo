import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const callNextRoot = path.resolve(__dirname, '..');
const outDir = path.join(callNextRoot, 'out');
const targetDir = path.resolve(callNextRoot, '..', 'server', 'public', 'call');

async function main() {
  // Ensure `out/` exists (run `npm run build` first).
  try {
    await fs.access(outDir);
  } catch {
    throw new Error(`Missing build output at ${outDir}. Run: npm run build`);
  }

  await fs.rm(targetDir, { recursive: true, force: true });
  await fs.mkdir(targetDir, { recursive: true });
  await fs.cp(outDir, targetDir, { recursive: true });

  // eslint-disable-next-line no-console
  console.log(`Exported call-next to ${targetDir}`);
}

await main();


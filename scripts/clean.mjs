import fs from 'node:fs';
import { OUTPUTS } from './lib/paths.mjs';
const output = process.argv[2] || OUTPUTS.production;
if (!Object.values(OUTPUTS).includes(output))
  throw new Error(`Unknown generated output: ${output}`);
fs.rmSync(output, { recursive: true, force: true });

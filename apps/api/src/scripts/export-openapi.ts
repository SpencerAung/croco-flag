import fs from 'node:fs';
import { generateSpecs } from 'hono-openapi';
// Your Hono app
import { createApp } from '../app';
import { db } from '../db';

const app = createApp(db);

async function main() {
  const specs = await generateSpecs(app, {});
  const folderPath = './__generated__';

  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync('./__generated__');
  }

  fs.writeFileSync(
    './__generated__/openapi.json',
    JSON.stringify(specs, null, 2),
  );
}
main();

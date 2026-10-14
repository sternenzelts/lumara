// Encoding only: retain the generated composition; preserve full-size PNG sources.
const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require(process.env.LUMARA_SHARP_PATH || 'sharp');

(async () => {
  const root = path.resolve(__dirname, '..');
  const prompts = JSON.parse(await fs.readFile(path.join(root, 'art-prompts.json'), 'utf8'));
  const sourceDir = path.join(root, 'art-source');
  await fs.mkdir(sourceDir, { recursive: true });
  for (const asset of prompts.assets) {
    const source = path.join(sourceDir, `${asset.id}-v1.png`);
    try { await fs.access(source); } catch { await fs.copyFile(asset.generatedSource, source); }
    const output = path.join(root, 'public', 'chibi', `${asset.id}-v1.webp`);
    await sharp(source).resize({ width: 960, withoutEnlargement: true }).webp({ quality: 86 }).toFile(output);
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

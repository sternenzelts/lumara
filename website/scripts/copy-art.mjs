import { mkdir, copyFile, writeFile, readFile, unlink } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
const data = await readFile('src/characters.ts', 'utf8');
for (const match of data.matchAll(/art\('([^']+)'\s*,\s*'([^']+)'\)/g)) {
  const [, id, filename] = match;
  const source = path.resolve('../characters', id, `${filename}.webp`);
  const destination = path.join('public/art', id, `${filename}.webp`);
  await mkdir(path.dirname(destination), { recursive: true });
  await copyFile(source, destination);
  const hash = createHash('sha256').update(await readFile(source)).digest('hex');
  await writeFile(`${destination}.json`, JSON.stringify({ prompt: `Origin: user-supplied original project character artwork from ${source}. Character provenance: characters/${id}/source.md. Generation prompt was not supplied. Original SHA-256: ${hash}`, createdAt: new Date().toISOString() }, null, 2));
  await unlink(`${destination}.prompt.json`).catch(error => { if (error.code !== 'ENOENT') throw error; });
}
console.log('Copied current roster artwork without modifying original files.');

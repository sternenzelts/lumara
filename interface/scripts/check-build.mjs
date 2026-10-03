import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const groups = await Promise.all(entries.map(entry => entry.isDirectory() ? filesIn(path.join(directory, entry.name)) : [path.join(directory, entry.name)]));
  return groups.flat();
}
const files = await filesIn('dist');
const sizes = await Promise.all(files.map(async file => ({ file, bytes: (await stat(file)).size })));
const total = sizes.reduce((sum, item) => sum + item.bytes, 0);
const artifactLimits = process.argv.includes('--artifact-limits');
if (artifactLimits) {
  if (files.length > 250) throw new Error(`Artifact has ${files.length} files; maximum is 250.`);
  if (total >= 64 * 1024 * 1024) throw new Error('Artifact must be smaller than 64 MB.');
  for (const item of sizes) if (item.bytes >= 15 * 1024 * 1024) throw new Error(`${item.file} must be smaller than 15 MB.`);
}
const html = await readFile('dist/index.html', 'utf8');
const resources = [...html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="([^"]+)"/g)].map(match => match[1]);
for (const resource of resources) {
  if (resource.startsWith('https://fonts.googleapis.com/') || resource === 'https://fonts.googleapis.com' || resource === 'https://fonts.gstatic.com') continue;
  if (!resource.startsWith('./')) throw new Error(`Artifact resource must use a relative path: ${resource}`);
}
console.log(`Build checked: ${files.length} files, ${(total / 1024 / 1024).toFixed(2)} MB, largest ${(Math.max(...sizes.map(item => item.bytes)) / 1024 / 1024).toFixed(2)} MB. Paths are relative. Artifact size limits ${artifactLimits ? 'enabled' : 'disabled'}.`);

import { readdir, stat, readFile } from 'node:fs/promises';
import path from 'node:path';
async function walk(dir) { const list = await readdir(dir, { withFileTypes: true }); const all = []; for (const entry of list) { const file = path.join(dir, entry.name); if (entry.isDirectory()) all.push(...await walk(file)); else all.push(file); } return all; }
// The trailer ships at full master quality (Git LFS); it is exempt from the size limits.
const TRAILER = path.join('dist', 'video', 'lumara-anima-trailer.mp4');
const files = await walk('dist'); let bytes = 0;
if (files.includes(TRAILER) && (await stat(TRAILER)).size < 1024 * 1024) throw new Error('Trailer is a Git LFS pointer; check out with LFS');
for (const file of files) { if (file === TRAILER) continue; const info = await stat(file); bytes += info.size; if(info.size >= 15 * 1024 * 1024) throw new Error(`Oversized: ${file}`); }
if(files.length > 250 || bytes >= 64 * 1024 * 1024) throw new Error('Static build exceeds limits');
const html = await readFile('dist/index.html', 'utf8'); if(/(?:src|href)="\/(?!\/)/.test(html)) throw new Error('Nonrelative asset path');
console.log(`Static build checked: ${files.length} files, ${(bytes/1024/1024).toFixed(2)} MB, relative asset paths.`);

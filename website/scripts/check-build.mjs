import { readdir, stat, readFile } from 'node:fs/promises';
import path from 'node:path';
async function walk(dir) { const list = await readdir(dir, { withFileTypes: true }); const all = []; for (const entry of list) { const file = path.join(dir, entry.name); if (entry.isDirectory()) all.push(...await walk(file)); else all.push(file); } return all; }
const files = await walk('dist'); let bytes = 0;
for (const file of files) { const info = await stat(file); bytes += info.size; if(info.size >= 15 * 1024 * 1024) throw new Error(`Oversized: ${file}`); }
if(files.length > 250 || bytes >= 64 * 1024 * 1024) throw new Error('Static build exceeds limits');
const html = await readFile('dist/index.html', 'utf8'); if(/(?:src|href)="\/(?!\/)/.test(html)) throw new Error('Nonrelative asset path');
console.log(`Static build checked: ${files.length} files, ${(bytes/1024/1024).toFixed(2)} MB, relative asset paths.`);

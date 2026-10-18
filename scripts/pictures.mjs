// 0294: pictures of a visual change, taken by the builder and kept with the ticket's review pack. They're kept in the
// main checkout's speck/.cache/pictures/<id>/ (which git ignores), so a build in a worktree and the panel in the main
// checkout see the same ones. pictures.json there lists them in order: [{ file, caption }].

import fs from 'node:fs';
import path from 'node:path';
import { SpeckError, findRepoRoot, findTicket, padId, worktreeList } from './core.mjs';
import { sharedCacheDir } from './turns.mjs';

// What a picture's first bytes say it is, and the extension and type it's kept and served with.
const KINDS = [
  { ext: 'png', type: 'image/png', is: b => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { ext: 'jpg', type: 'image/jpeg', is: b => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: 'webp', type: 'image/webp', is: b => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP' },
];
const kindOf = b => KINDS.find(k => k.is(b)) || null;
const NAME = /^\d{1,3}\.(png|jpg|webp)$/;

// The ticket's pictures folder, without making it.
function picturesDir(repo, id) {
  let main = repo;
  try { main = worktreeList(repo)[0]?.path || repo; } catch { /* not a git checkout: this one */ }
  return path.join(main, 'speck', '.cache', 'pictures', padId(id));
}

// The ticket's pictures, in the order they were added: [{ file, caption, type }], with `file` the full path. Entries
// that can't be read as one, or whose file has gone, are left out. None when there's no list or it can't be read.
export function readPictures(repo, id) {
  const dir = picturesDir(repo, id);
  let list;
  try { list = JSON.parse(fs.readFileSync(path.join(dir, 'pictures.json'), 'utf8')); } catch { return []; }
  if (!Array.isArray(list)) return [];
  return list.flatMap(p => {
    if (!p || typeof p.file !== 'string' || !NAME.test(p.file) || typeof p.caption !== 'string' || !p.caption.trim()) return [];
    const file = path.join(dir, p.file);
    if (!fs.existsSync(file)) return [];
    return [{ file, caption: p.caption.replace(/\s+/g, ' ').trim(), type: KINDS.find(k => p.file.endsWith(`.${k.ext}`)).type }];
  });
}

// Copies the picture at `src` into the ticket's folder and adds it, with its caption, to the end of the list.
export function addPicture(repo, id, src, caption) {
  const t = findTicket(repo, id);
  const what = String(caption ?? '').replace(/\s+/g, ' ').trim();
  if (!what) throw new SpeckError('Say what the picture shows: speck picture <id> <file> "<caption>".');
  let body;
  try { body = fs.readFileSync(src); }
  catch (e) { throw new SpeckError(`Couldn't read the picture ${src}: ${e.code === 'ENOENT' ? 'there is no such file' : e.message}. Check the path, then run this again.`); }
  const kind = kindOf(body);
  if (!kind) throw new SpeckError(`${src} isn't a PNG, JPEG or WebP picture. Save the picture as one of those, then run this again.`);
  const dir = sharedCacheDir(repo, path.join('pictures', padId(t.fm.id)));
  const list = readPictures(repo, t.fm.id).map(p => ({ file: path.basename(p.file), caption: p.caption }));
  const n = list.reduce((m, p) => Math.max(m, Number(p.file.split('.')[0])), 0) + 1;
  if (n > 999) throw new SpeckError(`Ticket ${t.fm.id} already has the most pictures speck keeps. Run speck picture ${t.fm.id} --clear, then add them again.`);
  const file = `${n}.${kind.ext}`;
  fs.writeFileSync(path.join(dir, file), body);
  list.push({ file, caption: what });
  fs.writeFileSync(path.join(dir, 'pictures.json'), JSON.stringify(list, null, 2) + '\n');
  return path.join(dir, file);
}

// Removes all of the ticket's pictures, so pictures of an earlier version of the change aren't kept with the new ones.
export function clearPictures(repo, id) {
  const t = findTicket(repo, id);
  fs.rmSync(picturesDir(repo, t.fm.id), { recursive: true, force: true });
}

// The review pack's lines about its pictures: a heading and each one's caption and file, or none when it has none.
export function picturesLines(repo, id) {
  const all = readPictures(repo, id);
  return all.length ? ['', '### Pictures', ...all.map(p => `- ${p.caption}: \`${p.file}\``)] : [];
}

// The panel's list of the ticket's pictures: each one's caption and the address it's served at.
export const panelPictures = (repo, id) => readPictures(repo, id)
  .map((p, i) => ({ caption: p.caption, url: `/api/tickets/${padId(id)}/pictures/${i + 1}` }));

// The ticket's picture number `n` (from 1), as the panel serves it: { type, body }, or null when there's none.
export function pictureFile(repo, id, n) {
  const p = readPictures(repo, id)[Number(n) - 1];
  if (!p) return null;
  try { return { type: p.type, body: fs.readFileSync(p.file) }; } catch { return null; }
}

export function cmdPicture(args) {
  const [id, ...rest] = args;
  const repo = findRepoRoot();
  if (id && rest.length === 1 && rest[0] === '--clear') {
    clearPictures(repo, id);
    console.log(`Removed ticket ${padId(id)}'s pictures.`);
    return;
  }
  if (!id || rest.length !== 2 || rest.some(a => a.startsWith('--'))) throw new SpeckError('Usage: speck picture <id> <file> "<caption>", or speck picture <id> --clear');
  console.log(`Kept ${addPicture(repo, id, rest[0], rest[1])} with ticket ${padId(id)}'s review pack.`);
}

// 0352: a document task's folder in the main checkout's outputs/, where its build writes the document. outputs/ isn't
// in git, so a document written in a ticket's worktree would never reach the main checkout: it's written there instead.

import fs from 'node:fs';
import path from 'node:path';
import { TEMPLATES, SpeckError, findRepoRoot, findTicket, padId, ticketTask, ticketOutput, worktreeList } from './core.mjs';
import { outputProblem } from './lint.mjs';

// A document task's folder in the main checkout's outputs/, as an absolute path, without making it. The ticket's
// output must already have passed lint.
function outputPath(repo, t) {
  return path.join(mainCheckout(repo), outputRel(t));
}
const outputRel = t => path.join('outputs', path.posix.normalize(ticketOutput(t).trim().replace(/\\/g, '/')));
function mainCheckout(repo) {
  try { return worktreeList(repo)[0]?.path || repo; } catch { return repo; /* not a git checkout: this one */ }
}

// The ticket's folder, as an absolute path, made if it's missing. Refuses, making nothing, for a code ticket or an
// output that fails lint.
export function outputFolder(repo, id) {
  const t = findTicket(repo, id);
  const pad = padId(t.fm.id ?? id);
  if (ticketTask(t) !== 'document') throw new SpeckError(`Ticket ${pad} is a code ticket, not a document task, so it has no output folder.`);
  const problem = outputProblem(ticketOutput(t));
  if (problem) throw new SpeckError(`Ticket ${pad} has no output folder to give: ${problem} Fix it in the ticket, then run this again.`);
  const dir = outputPath(repo, t);
  try { fs.mkdirSync(dir, { recursive: true }); } catch (e) {
    throw new SpeckError(`Couldn't make ticket ${pad}'s output folder ${dir} (${e.code || e.message}). Make sure nothing on that path is a file, then run this again.`);
  }
  if (!fs.statSync(dir).isDirectory()) throw new SpeckError(`Ticket ${pad}'s output folder ${dir} is a file. Move it, then run this again.`);
  return dir.endsWith(path.sep) ? dir : dir + path.sep;
}

// 0353: what the reviewer prompt says about a document task's document: its folder and the files in it, or that it's
// empty or missing, and how to judge the criteria. Makes nothing. '' for a code ticket, whose prompt is unchanged.
export function documentSection(repo, t) {
  if (ticketTask(t) !== 'document') return '';
  const problem = outputProblem(ticketOutput(t));
  return fs.readFileSync(path.join(TEMPLATES, 'reviewer-document.md'), 'utf8').trim()
    .replace('{{WHERE}}', () => problem ? `The ticket gives no folder to read: ${problem} So there's no document to read: fail each criterion that needs one.` : documentWhere(outputPath(repo, t)));
}
function documentWhere(dir) {
  const where = `Read it in this folder:\n\n\`${dir.replace(/[\\/]+$/, '')}${path.sep}\``;
  let found;
  try {
    if (!fs.statSync(dir).isDirectory()) return `${where}\n\nThat's a file, not a folder, so the build has written nothing there.`;
    found = fs.readdirSync(dir, { recursive: true, withFileTypes: true }).filter(e => !e.isDirectory())
      .map(e => path.relative(dir, path.join(e.parentPath ?? e.path, e.name))).sort();
  } catch (e) {
    return `${where}\n\n${e.code === 'ENOENT' ? "The folder doesn't exist" : `The folder couldn't be read (${e.code || e.message})`}: the build has written nothing there.`;
  }
  if (!found.length) return `${where}\n\nThe folder is empty: the build has written nothing there.`;
  return [`${where}\n\nFiles in it:\n`, ...found.map(f => `- \`${f}\``)].join('\n');
}

// 0354: a document task's files, for its review pack: { where, files, why }, with `where` the folder's path from the
// project root and `files` each regular file in it, from that folder, or `why` it has none. Makes nothing. null for a
// code ticket.
function outputFiles(repo, t) {
  if (ticketTask(t) !== 'document') return null;
  const problem = outputProblem(ticketOutput(t));
  if (problem) return { why: `The ticket gives no folder for the document: ${problem}`, files: [] };
  const where = path.posix.join('outputs', path.posix.normalize(ticketOutput(t).trim().replace(/\\/g, '/')), '/');
  let files;
  try {
    const dir = unlinkedOutput(repo, t);
    if (!dir) return { where, files: [], why: `\`${where}\`, or a folder it's in, is a link, so speck doesn't list or open what's in it.` };
    files = fs.readdirSync(dir, { recursive: true, withFileTypes: true }).filter(e => e.isFile())
      .map(e => path.relative(dir, path.join(e.parentPath ?? e.path, e.name)).split(path.sep).join('/')).sort();
  } catch (e) {
    const why = e.code === 'ENOENT' ? "doesn't exist" : e.code === 'ENOTDIR' ? 'is a file, not a folder' : `couldn't be read (${e.code || e.message})`;
    return { where, files: [], why: `\`${where}\` ${why}, so the build has written nothing there.` };
  }
  return { where, files, why: files.length ? '' : `\`${where}\` is empty: the build has written nothing there.` };
}

// The ticket's output folder as an absolute path from the project root's real path, or null when the folder, or any
// folder it's in from outputs/ down, is a link, which could lead outside it. Throws when it can't be read.
function unlinkedOutput(repo, t) {
  const dir = path.resolve(fs.realpathSync(mainCheckout(repo)), outputRel(t));
  return fs.realpathSync(dir) === dir ? dir : null;
}

// The review pack's lines about a document task's files: a heading and each file's path from the project root, or why
// there are none. None for a code ticket. `links: false` leaves out the files, for the panel, which links to them itself.
export function documentLines(repo, t, { links = true } = {}) {
  const out = outputFiles(repo, t);
  if (!out || (!links && out.files.length)) return [];
  return ['', '### Document', ...(out.files.length ? out.files.map(f => `- \`${path.posix.join(out.where, f)}\``) : [`- ${out.why}`])];
}

// The panel's list of a document task's files: each one's path from the project root and the address it's served at.
export function panelDocuments(repo, t) {
  const out = outputFiles(repo, t);
  return out ? out.files.map(f => ({ path: path.posix.join(out.where, f),
    url: `/api/tickets/${padId(t.fm.id)}/output/${f.split('/').map(encodeURIComponent).join('/')}` })) : [];
}

// The file at `rel` in ticket `id`'s output folder, as the panel serves it: { type, body }, or null when the ticket isn't
// a document task, or `rel` isn't a regular file inside that folder, or leads outside it by `..` or by a link.
const TYPES = { md: 'text/markdown; charset=utf-8', markdown: 'text/markdown; charset=utf-8', txt: 'text/plain; charset=utf-8',
  csv: 'text/csv; charset=utf-8', html: 'text/html; charset=utf-8', htm: 'text/html; charset=utf-8', json: 'application/json',
  pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml' };
export function documentFile(repo, id, rel) {
  try {
    const t = findTicket(repo, id);
    if (ticketTask(t) !== 'document' || outputProblem(ticketOutput(t)) || typeof rel !== 'string' || !rel || rel.includes('\0')) return null;
    const dir = unlinkedOutput(repo, t);
    const file = dir && path.resolve(dir, rel);
    // Inside the folder, a regular file, and no link on the way to it, from outputs/ down.
    if (!dir || !file.startsWith(dir + path.sep) || !fs.lstatSync(file).isFile() || fs.realpathSync(file) !== file) return null;
    const ext = path.extname(file).slice(1).toLowerCase();
    return { type: Object.hasOwn(TYPES, ext) ? TYPES[ext] : 'application/octet-stream', body: fs.readFileSync(file) };
  } catch (e) {
    if (e instanceof SpeckError || e.code) return null;
    throw e;
  }
}

export function cmdOutput(args) {
  if (args.length !== 1 || args[0].startsWith('--')) throw new SpeckError('Usage: speck output <id>');
  console.log(outputFolder(findRepoRoot(), args[0]));
}

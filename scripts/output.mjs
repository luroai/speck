// 0352: a document task's folder in the main checkout's outputs/, where its build writes the document. outputs/ isn't
// in git, so a document written in a ticket's worktree would never reach the main checkout: it's written there instead.

import fs from 'node:fs';
import path from 'node:path';
import { TEMPLATES, SpeckError, findRepoRoot, findTicket, padId, ticketTask, ticketOutput, worktreeList } from './core.mjs';
import { outputProblem } from './lint.mjs';

// A document task's folder in the main checkout's outputs/, as an absolute path, without making it. The ticket's
// output must already have passed lint.
function outputPath(repo, t) {
  let main = repo;
  try { main = worktreeList(repo)[0]?.path || repo; } catch { /* not a git checkout: this one */ }
  return path.join(main, 'outputs', path.posix.normalize(ticketOutput(t).trim().replace(/\\/g, '/')));
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
const MAX_FILES = 200;
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
  const more = found.length > MAX_FILES ? [`- and ${found.length - MAX_FILES} more`] : [];
  return [`${where}\n\nFiles in it:\n`, ...found.slice(0, MAX_FILES).map(f => `- \`${f}\``), ...more].join('\n');
}

export function cmdOutput(args) {
  if (args.length !== 1 || args[0].startsWith('--')) throw new SpeckError('Usage: speck output <id>');
  console.log(outputFolder(findRepoRoot(), args[0]));
}

// 0352: a document task's folder in the main checkout's outputs/, where its build writes the document. outputs/ isn't
// in git, so a document written in a ticket's worktree would never reach the main checkout: it's written there instead.

import fs from 'node:fs';
import path from 'node:path';
import { SpeckError, findRepoRoot, findTicket, padId, ticketTask, ticketOutput, worktreeList } from './core.mjs';
import { outputProblem } from './lint.mjs';

// The ticket's folder, as an absolute path, made if it's missing. Refuses, making nothing, for a code ticket or an
// output that fails lint.
export function outputFolder(repo, id) {
  const t = findTicket(repo, id);
  const pad = padId(t.fm.id ?? id);
  if (ticketTask(t) !== 'document') throw new SpeckError(`Ticket ${pad} is a code ticket, not a document task, so it has no output folder.`);
  const problem = outputProblem(ticketOutput(t));
  if (problem) throw new SpeckError(`Ticket ${pad} has no output folder to give: ${problem} Fix it in the ticket, then run this again.`);
  let main = repo;
  try { main = worktreeList(repo)[0]?.path || repo; } catch { /* not a git checkout: this one */ }
  const dir = path.join(main, 'outputs', path.posix.normalize(ticketOutput(t).trim().replace(/\\/g, '/')));
  try { fs.mkdirSync(dir, { recursive: true }); } catch (e) {
    throw new SpeckError(`Couldn't make ticket ${pad}'s output folder ${dir} (${e.code || e.message}). Make sure nothing on that path is a file, then run this again.`);
  }
  if (!fs.statSync(dir).isDirectory()) throw new SpeckError(`Ticket ${pad}'s output folder ${dir} is a file. Move it, then run this again.`);
  return dir.endsWith(path.sep) ? dir : dir + path.sep;
}

export function cmdOutput(args) {
  if (args.length !== 1 || args[0].startsWith('--')) throw new SpeckError('Usage: speck output <id>');
  console.log(outputFolder(findRepoRoot(), args[0]));
}

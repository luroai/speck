import fs from 'node:fs';
import path from 'node:path';
import { ideasDir, doneIdeasDir, ideaStatus } from './core.mjs';

// 0325: how many idea notes are waiting to be shaped, in the inbox and ticketed, as the panel's Ideas and Inbox tabs
// count them. Dropped notes are in none of them. Notes filed in speck/ideas/done/ count as ticketed unless dropped.
export function ideaCounts(repo) {
  const counts = { waiting: 0, inbox: 0, ticketed: 0 };
  const statuses = d => (fs.existsSync(d) ? fs.readdirSync(d).filter(f => f.endsWith('.md')) : []).map(f => ideaStatus(fs.readFileSync(path.join(d, f), 'utf8')));
  for (const s of statuses(ideasDir(repo))) {
    if (s === 'dropped') continue;
    counts[s === 'inbox' ? 'inbox' : s.startsWith('ticketed') ? 'ticketed' : 'waiting']++;
  }
  counts.ticketed += statuses(doneIdeasDir(repo)).filter(s => s !== 'dropped').length;
  return counts;
}

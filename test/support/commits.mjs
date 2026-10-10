// Finds commits by their message rather than by id, so tests keep working when the history is rewritten.
import { spawnSync } from 'node:child_process';
import { ROOT } from './panel.mjs';

// The latest commit on HEAD whose subject is exactly `subject`, or null if there is none
// (for example in a shallow clone).
export function commitBySubject(subject, cwd = ROOT) {
  const r = spawnSync('git', ['log', '--format=%H%x00%s', 'HEAD'], { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) return null;
  const hit = r.stdout.split('\n').map(l => l.split('\0')).find(([, s]) => s === subject);
  return hit ? hit[0] : null;
}

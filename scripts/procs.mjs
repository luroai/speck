// Finding every process a run started (0180, 0202), so a reviewer that takes too long or a test run that stalls can be
// ended with all of them. A run's command is started with a mark of its own in its environment, which every process it
// starts inherits. A process it started is then found either as one descended from it, even in a process group of its
// own, or by that mark, even once its parent has gone. A run started inside another keeps the outer run's mark too, so
// ending the outer run finds the inner one's processes as well.

import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

// A new run's mark, and `env` with it added under `name`: `{ run, env }`. Marks are kept as `outer:inner`; a value
// under `name` that isn't a list of marks is replaced.
export function markRun(name, env = process.env) {
  const run = crypto.randomUUID();
  const outer = /^[0-9a-f-]+(:[0-9a-f-]+)*$/.test(env[name] || '') ? `${env[name]}:` : '';
  return { run, env: { ...env, [name]: `${outer}${run}` } };
}

// Every process descended from `pid`, from ps.
export function descendants(pid) {
  const kids = new Map();
  for (const line of (spawnSync('ps', ['-A', '-o', 'pid=,ppid='], { encoding: 'utf8' }).stdout || '').split('\n')) {
    const [p, parent] = line.trim().split(/\s+/).map(Number);
    if (p && parent) kids.set(parent, [...(kids.get(parent) || []), p]);
  }
  const out = new Set(), todo = [pid];
  while (todo.length) for (const k of kids.get(todo.pop()) || []) if (!out.has(k)) { out.add(k); todo.push(k); }
  return [...out];
}

// Every process, other than this one, whose environment holds the mark `run` under `name`, from ps.
export function marked(name, run) {
  const mark = new RegExp(`\\s${name}=(?:[^\\s:]*:)*${run}(:|\\s|$)`);
  return (spawnSync('ps', ['axeww', '-o', 'pid=,args='], { encoding: 'utf8' }).stdout || '').split('\n')
    .filter(line => mark.test(line)).map(line => Number(line.trim().split(/\s+/)[0])).filter(p => p && p !== process.pid);
}

// Every process the run started as `pid` with the mark `run` under `name` has started: descended from it, or marked.
export const runProcesses = (pid, name, run) => [...new Set([...descendants(pid), ...marked(name, run)])];

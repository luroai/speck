// 0206: the processes still running, read from /proc, so a test can show what a run left behind. Linux only.
import fs from 'node:fs';

const pids = () => fs.readdirSync('/proc').filter(d => /^\d+$/.test(d));
const read = (pid, what) => { try { return fs.readFileSync(`/proc/${pid}/${what}`, 'utf8'); } catch { return ''; } };

// The processes with `mark` (NAME=value) in their environment: everything started by a run given it, and not yet gone.
export const leftBehind = mark => pids().filter(pid => read(pid, 'environ').split('\0').includes(mark));
// The panels the process `parent` started that are still running.
export const panelsOf = parent => pids().filter(pid => read(pid, 'stat').replace(/^.*\) /, '').split(' ')[1] === String(parent)
  && read(pid, 'cmdline').split('\0').includes('panel'));

// Running a speck command inside the process that asks for it, as the tests do (0231), rather than starting a
// process of its own for it.
import { inspect } from 'node:util';
import { SpeckError, collectChildOutput } from './core.mjs';

class Exited { constructor(code) { this.code = code; } }

// Runs fn in this process as if in a process of its own started in `cwd` with `env` (0231): returns { status, stdout,
// stderr }, as spawnSync does, with what it and the child processes it starts printed. A SpeckError it throws is
// printed and ends it with its code, as the CLI does, and any other error with its stack and 1. process.exit ends fn
// rather than this process, and the folder, environment, exitCode and process.exit are as they were afterwards. fn
// must be synchronous. A folder that isn't there gives status null and the error, as spawnSync does.
export function runInProcess(fn, { cwd = process.cwd(), env = process.env } = {}) {
  const out = [], err = [];
  const saved = { cwd: process.cwd(), env: { ...process.env }, exitCode: process.exitCode, exit: process.exit, out: process.stdout.write, err: process.stderr.write };
  const text = chunk => (typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8'));
  const setEnv = to => {
    // A variable given as undefined is left out, as spawnSync leaves it out.
    for (const k of Object.keys(process.env)) if (to[k] === undefined || !Object.hasOwn(to, k)) delete process.env[k];
    for (const [k, v] of Object.entries(to)) if (v !== undefined) process.env[k] = v;
  };
  try { process.chdir(cwd); } catch (error) { return { status: null, signal: null, stdout: '', stderr: '', output: [null, '', ''], error }; }
  setEnv({ ...env });
  process.exitCode = undefined;
  process.exit = code => { throw new Exited(code); };
  process.stdout.write = (chunk, ...rest) => { out.push(text(chunk)); rest.find(a => typeof a === 'function')?.(); return true; };
  process.stderr.write = (chunk, ...rest) => { err.push(text(chunk)); rest.find(a => typeof a === 'function')?.(); return true; };
  collectChildOutput(true);
  let status;
  try {
    fn();
    status = process.exitCode ?? 0;
  } catch (e) {
    if (e instanceof Exited) status = e.code ?? process.exitCode ?? 0;
    else if (e instanceof SpeckError) { if (e.message) console.error(e.message); status = e.code; }
    else { console.error(inspect(e)); status = 1; }
  } finally {
    collectChildOutput(false);
    process.stdout.write = saved.out;
    process.stderr.write = saved.err;
    process.exit = saved.exit;
    process.exitCode = saved.exitCode;
    setEnv(saved.env);
    process.chdir(saved.cwd);
  }
  const stdout = out.join(''), stderr = err.join('');
  return { status: Number(status), signal: null, stdout, stderr, output: [null, stdout, stderr] };
}

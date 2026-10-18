// 0289: Codex builds. With `builder: codex` and build_command blank, speck run starts each build with `codex exec`,
// reads the session id Codex chose from the first thread.started line of its log, and resumes it with
// `codex exec resume`. The run record marks such a build `agent: codex`, so it's resumed as one whatever the config
// says later.
import fs from 'node:fs';
import path from 'node:path';
import { modelOf, codexBuilds } from './build-model.mjs';
export { codexBuilds };

const BYPASS = ['--json', '--dangerously-bypass-approvals-and-sandbox'];
const model = cfg => (m => (m ? ['-m', m] : []))(modelOf(cfg));

// The command the panel and speck's hints show to resume a Codex build by hand. {id} is its ticket.
export const CODEX_RESUME_COMMAND = "codex exec resume {session} --json --dangerously-bypass-approvals-and-sandbox '$speck-build {id}: carry on from where you left off.'";

// The words speck run starts each Codex build with, {id} standing for the ticket.
export const codexStartWords = cfg => ['codex', 'exec', ...BYPASS, ...model(cfg), '$speck-build {id}'];

// The command that carries on a Codex build's own session with `message`, or null when it has no session yet.
export function codexResumeArgv(cfg, session, message) {
  if (typeof session !== 'string' || !session) return null;
  return ['codex', 'exec', 'resume', session, ...BYPASS, ...model(cfg), message];
}

// The thread id on the first thread.started line of a Codex --json log, or null when there's none yet.
export function threadId(text) {
  for (const line of String(text ?? '').split('\n')) {
    if (!line.startsWith('{')) continue;
    let v;
    try { v = JSON.parse(line); } catch { continue; }
    if (v?.type === 'thread.started') return typeof v.thread_id === 'string' && v.thread_id ? v.thread_id : null;
  }
  return null;
}

const readObject = file => { try { const v = JSON.parse(fs.readFileSync(file, 'utf8')); return v && typeof v === 'object' && !Array.isArray(v) ? v : null; } catch { return null; } };

// Keeps a Codex build's session id in its run record, read from its log, once Codex has written it. A pause, stop or
// waiting mark that names the build without a session is given it too, so the mark still matches the build. `save`
// writes a record or mark. Returns the record, with its session if it has one, or null if it has no record.
export function fillSession(runs, id, save) {
  const file = path.join(runs, `${id}.json`);
  const rec = readObject(file);
  if (!rec || rec.agent !== 'codex' || (typeof rec.session === 'string' && rec.session)) return rec;
  let session = null;
  try { session = threadId(fs.readFileSync(path.join(runs, `${id}.log`), 'utf8')); } catch { /* no log yet */ }
  if (!session) return rec;
  const next = { ...rec, session };
  try { save(file, next); } catch { return rec; } // tried again on the next check
  for (const kind of ['paused', 'stopped', 'waiting']) {
    const markFile = path.join(runs, `${id}.${kind}`), mark = readObject(markFile);
    if (mark && mark.pid === rec.pid && (mark.session ?? null) === (rec.session ?? null)) try { save(markFile, { ...mark, session }); } catch { /* left as it was */ }
  }
  return next;
}

// 0276: the models Codex offers, from its own catalogue (`codex debug models`), with the efforts each one supports, so
// the Settings view can offer them and speck accepts an effort Codex lists beyond its own (such as ultra). The command
// is under Codex's `debug`, so it may change without notice: every way it can fail gives one line saying why there's
// no list, and the view falls back to a box to type the model's name in.

import { spawnSync, execFile } from 'node:child_process';
import { EFFORTS } from './core.mjs';

export const CODEX_MODELS_TIMEOUT_MS = 10_000;
const ARGS = ['debug', 'models'];
// An effort speck passes to Codex inside quotes (model_reasoning_effort="…"), so only a plain word.
const WORD = /^[a-z][a-z0-9_-]{0,31}$/;

// What `codex debug models` printed, as { models: [{ slug, efforts }] } with the models it lists (not those it
// hides), or { why } in one line.
export function parseCodexModels(stdout) {
  let json;
  try { json = JSON.parse(stdout); } catch { return { why: 'Codex didn\'t list its models in a form speck reads, so type the model\'s name.' }; }
  const models = [];
  for (const m of Array.isArray(json?.models) ? json.models : []) {
    if (m === null || typeof m !== 'object' || m.visibility !== 'list' || typeof m.slug !== 'string' || !m.slug.trim() || /[\x00-\x1f\x7f]/.test(m.slug)) continue;
    const efforts = (Array.isArray(m.supported_reasoning_levels) ? m.supported_reasoning_levels : [])
      .map(l => l?.effort).filter(e => typeof e === 'string' && WORD.test(e));
    if (!models.some(x => x.slug === m.slug)) models.push({ slug: m.slug, efforts: [...new Set(efforts)] });
  }
  return models.length ? { models } : { why: 'Codex lists no models: check it\'s signed in (codex login), or type the model\'s name.' };
}

// Why the command gave no list, from how it ended.
function failed(error, status, stderr) {
  if (error?.code === 'ENOENT') return { why: 'Codex isn\'t installed here, so it can\'t list its models: type the model\'s name.' };
  if (error?.code === 'ETIMEDOUT' || error?.killed || error?.signal === 'SIGTERM')
    return { why: `Codex took more than ${CODEX_MODELS_TIMEOUT_MS / 1000} seconds to list its models, so type the model's name.` };
  const line = String(stderr || '').trim().split('\n').pop().trim().slice(0, 200);
  return { why: `Codex couldn't list its models${line ? ` (${line})` : status !== null && status !== undefined ? ` (exit ${status})` : ''}: check it's signed in (codex login), or type the model's name.` };
}

// The models, waiting for Codex: for speck's commands, which do one thing and end.
export function codexModels({ timeoutMs = CODEX_MODELS_TIMEOUT_MS } = {}) {
  const r = spawnSync('codex', ARGS, { encoding: 'utf8', timeout: timeoutMs, maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
  if (r.error || r.status !== 0) return failed(r.error, r.status, r.stderr);
  return parseCodexModels(r.stdout);
}

// The same, without holding up the panel's server while Codex answers.
export function codexModelsAsync({ timeoutMs = CODEX_MODELS_TIMEOUT_MS } = {}) {
  return new Promise(resolve => {
    const child = execFile('codex', ARGS, { encoding: 'utf8', timeout: timeoutMs, maxBuffer: 64 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) resolve(failed(error, typeof error.code === 'number' ? error.code : null, stderr));
      else resolve(parseCodexModels(stdout));
    });
    child.stdin?.end();
  });
}

// Whether speck accepts `value` as a reviewer effort: one of its own, or one Codex lists for any of its models. Codex
// is asked only for a value outside speck's own list, and its answer kept for a minute, so linting every ticket with
// such an effort asks it once rather than once a ticket, while a long-running panel still hears of a change.
const MEMO_MS = 60_000;
let memo = null; // { at, path, efforts }
export function knownEffort(value) {
  if (EFFORTS.includes(value)) return true;
  if (!WORD.test(value)) return false;
  if (memo === null || Date.now() - memo.at >= MEMO_MS || memo.path !== process.env.PATH)
    memo = { at: Date.now(), path: process.env.PATH, efforts: new Set((codexModels().models || []).flatMap(m => m.efforts)) };
  return memo.efforts.has(value);
}

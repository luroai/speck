// The reviewer's prompt, and reviewers set up as a command under reviewer_options.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TEMPLATES, SpeckError, sh, git, reviewerSettings, settingsMeta, posix } from './core.mjs';
import { cacheDir, reviewDiff, validateVerdict, saveRound, reviewerPrompt, verdictInProse } from './review.mjs';
import { cursorCli } from './cursor-build.mjs';

const LIMIT_SCRIPT = fileURLToPath(new URL('./limit.mjs', import.meta.url));

// How long a reviewer speck runs may take before it's ended (0180), in ms. SPECK_REVIEW_TIMEOUT_MS sets it directly,
// for speck's own tests, which can't wait minutes.
export function reviewTimeoutMs(cfg) {
  const minutes = cfg.review_timeout_minutes ?? 30;
  if (!Number.isSafeInteger(minutes) || minutes < 1)
    throw new SpeckError(`review_timeout_minutes in speck/config.yml must be a whole number of 1 or more (got ${JSON.stringify(minutes)}). Fix it with \`speck config set review_timeout_minutes 30\`, then run this again.`);
  const ms = Number(process.env.SPECK_REVIEW_TIMEOUT_MS);
  return Number.isSafeInteger(ms) && ms > 0 ? ms : minutes * 60 * 1000;
}

// The message for a reviewer ended for taking too long.
export function tookTooLong(name, ms) {
  const unit = (v, word) => `${v} ${word}${v === 1 ? '' : 's'}`;
  const limit = ms % 60000 === 0 ? unit(ms / 60000, 'minute') : unit(Math.round(ms / 100) / 10, 'second');
  return `The ${name} reviewer took longer than ${limit}, so speck ended it and every process it started. No round was recorded. Run the round again, or raise review_timeout_minutes in speck/config.yml if your reviewer needs longer.`;
}

// Runs a reviewer with the prompt on stdin, ending it and every process it started after `ms`. Returns the process
// result, with `timedOut` set if it was ended for that, or `error` ({ code, message }) if it couldn't start.
export function runLimited(cmd, args, { cwd, input, ms }) {
  const r = sh(process.execPath, [LIMIT_SCRIPT, String(ms), cmd, ...args], { cwd, input, stdio: ['pipe', 'pipe', 'pipe', 'pipe'] });
  const said = r.output[3] || '';
  if (said === 'timeout') return { ...r, timedOut: true };
  const m = said.match(/^error (\S*) ([\s\S]*)$/);
  return m ? { ...r, error: { code: m[1], message: m[2] } } : r;
}

// The round-1 prompt with the verdict schema: what `speck prompt` prints, and what a command reviewer gets on stdin.
export function fullPrompt(repo, ticket, cfg, diff, tests, response = '') {
  return `${reviewerPrompt(repo, ticket, cfg, 1, { diff, tests, response })}\n\nReturn ONLY a JSON object matching this schema:\n${fs.readFileSync(path.join(TEMPLATES, 'review-verdict.schema.json'), 'utf8')}`;
}

// Splits a command into words the way a shell would for plain quoting, so it can run without a shell.
export function splitCommand(cmd) {
  const words = [];
  let word = null, quote = null;
  for (const ch of String(cmd)) {
    if (quote) { if (ch === quote) quote = null; else word += ch; }
    else if (ch === '"' || ch === "'") { quote = ch; word ??= ''; }
    else if (/\s/.test(ch)) { if (word !== null) words.push(word); word = null; }
    else word = (word ?? '') + ch;
  }
  if (quote) throw new SpeckError(`The reviewer command has an unclosed ${quote} quote: ${cmd}`);
  if (word !== null) words.push(word);
  return words;
}

// Fills in {model}, {effort} and {session}. A blank value removes its word, and the flag just before it when the placeholder stands alone.
export function commandArgs(cmd, values) {
  const out = [];
  for (const word of splitCommand(cmd)) {
    const keys = [...word.matchAll(/\{(model|effort|session)\}/g)].map(m => m[1]);
    if (keys.some(k => !values[k])) {
      if (/^\{(model|effort|session)\}$/.test(word) && out.length && out[out.length - 1].startsWith('-')) out.pop();
      continue;
    }
    out.push(word.replace(/\{(model|effort|session)\}/g, (_, k) => values[k]));
  }
  return out;
}

// 0292: reviewers speck can run as a command without one under reviewer_options. Claude Code runs without a person (-p)
// in dontAsk mode, which runs read-only commands and denies anything not pre-approved rather than asking, with its
// file-writing tools taken away. It loads no user, project or local settings, so no allow rule there can pre-approve a
// command that writes. 0314: --strict-mcp-config with no --mcp-config loads no MCP servers or claude.ai connectors.
// A reviewer_options entry with a command of its own is used instead.
const CLAUDE_ARGS = '-p --permission-mode dontAsk --setting-sources= --strict-mcp-config --disallowedTools "Edit Write NotebookEdit" --output-format json --model {model} --effort {effort}';
// 0332: Cursor's CLI (`agent`, or `cursor-agent` when only that is installed) runs without a person in ask mode, which
// is read-only. --trust gets past the Workspace Trust prompt that would otherwise stop it in a folder Cursor hasn't been
// told to trust. Not --sandbox enabled: it won't start where the OS doesn't support Cursor's sandbox.
const CURSOR_ARGS = '-p --mode ask --trust --output-format json --model {model}';
const BUILT_IN = Object.freeze({
  claude: () => ({ command: `claude ${CLAUDE_ARGS}`, resume_command: `claude --resume {session} ${CLAUDE_ARGS}`, session_id_path: 'session_id' }),
  cursor: (cli = cursorCli()) => ({ command: `${cli} ${CURSOR_ARGS}`, resume_command: `${cli} --resume {session} ${CURSOR_ARGS}`, session_id_path: 'session_id' }),
});

// The options a reviewer runs with: its own under reviewer_options when they give a command, or speck's built-in ones.
export function reviewerOptions(cfg, name) {
  const own = cfg.reviewer_options?.[name];
  const mine = own && typeof own === 'object' ? own : {};
  if (typeof mine.command === 'string' && mine.command.trim()) return mine;
  return Object.hasOwn(BUILT_IN, name) ? BUILT_IN[name]() : mine;
}

// A JSON object from text that is JSON, or holds a ```json fenced block, or else the last verdict object among its prose.
function jsonIn(text) {
  const tries = [text.trim(), ...[...String(text).matchAll(/```[a-z]*\r?\n([\s\S]*?)\r?\n```/gi)].map(m => m[1])];
  for (const s of tries) {
    try { const v = JSON.parse(s); if (v && typeof v === 'object' && !Array.isArray(v)) return v; } catch { /* try the next */ }
  }
  return verdictInProse(text);
}

// The verdict in a command reviewer's stdout: the whole output, a fenced block, an object with a `verdict` key among
// prose, or an envelope whose `result` string holds any of them.
export function verdictFromOutput(stdout) {
  const v = jsonIn(stdout);
  if (v && !('verdict' in v) && typeof v.result === 'string') return { verdict: jsonIn(v.result), envelope: v };
  return { verdict: v, envelope: null };
}

// The round-1 prompt exactly as it was sent, saved with the review's working files. If that copy is gone (another
// machine, or a cleared cache), it is rebuilt from the commit round 1 reviewed. Only its test output can't be recovered.
// A copy saved by a speck that still sent speck/product.md is rebuilt the same way, keeping the test output it holds.
export const roundOneFile = (repo, id) => path.join(cacheDir(repo, id), 'round-1.prompt.md');
const LEGACY_SPEC = '## Living spec (speck/product.md)';
function savedTests(text) {
  const head = '## Test output (from the builder)\n\n```\n';
  const from = text.indexOf(head);
  const to = text.lastIndexOf('\n```', text.lastIndexOf('Return ONLY a JSON object'));
  return from >= 0 && to >= from + head.length ? text.slice(from + head.length, to) : '(the round-1 test output was not kept)';
}
function roundOnePrompt(repo, s, id) {
  const file = roundOneFile(repo, id);
  const saved = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  if (saved !== null && !saved.includes(LEGACY_SPEC)) return saved;
  const sha = s.prior[0].meta.reviewed_sha;
  const at = rel => { const r = sh('git', ['show', `${sha}:${rel}`], { cwd: repo }); return r.status === 0 ? r.stdout : null; };
  const ticket = { raw: at(posix(path.relative(repo, s.ticket.file))) ?? s.ticket.raw };
  // Against the base as it was then: the branch may have merged a newer base since.
  const base = git(['merge-base', s.cfg.base_branch, sha], repo).trim();
  return fullPrompt(repo, ticket, s.cfg, reviewDiff(repo, base, sha), saved === null ? '(the round-1 test output was not kept)' : savedTests(saved), s.prior[0].meta.builder_response);
}

// 0388: the session a later round of reviewer `name`, on `settings`' model, can continue: { thread }, the one the last
// round saved, or { why } it starts fresh. A round whose reviewer or model differs from the last round's starts fresh.
export function resumableSession(prior, name, settings) {
  const last = prior[prior.length - 1]?.meta;
  if (!last) return { why: 'no earlier round was recorded' };
  const changed = reviewerChanged(prior, name, settings);
  if (changed) return { why: changed };
  return last.thread_id ? { thread: last.thread_id } : { why: `no session id was saved from round ${last.round}` };
}

// Why the last round's session can't carry on for reviewer `name` on `settings`' model, or null when it ran on both.
export function reviewerChanged(prior, name, settings) {
  const last = prior[prior.length - 1]?.meta;
  if (!last) return null;
  const model = settingsMeta(settings).reviewer_model;
  if (typeof last.reviewer === 'string' && last.reviewer !== name) return `round ${last.round} was reviewed by ${last.reviewer}`;
  if (typeof last.reviewer_model === 'string' && last.reviewer_model !== model) return `round ${last.round} ran on model ${last.reviewer_model}, and this one runs on ${model}`;
  return null;
}

// Later rounds give a reviewer with no memory everything it has seen: the round-1 prompt, every earlier verdict and
// builder response in order, then this round's response, diff and tests.
export function historyPrompt(repo, s, id) {
  const parts = [roundOnePrompt(repo, s, id), '# Earlier review rounds'];
  for (const r of s.prior) {
    if (r.meta.builder_response && r.meta.round > 1) parts.push(`## Builder response before round ${r.meta.round}`, r.meta.builder_response);
    parts.push(`## Your round ${r.meta.round} verdict`, '```json', JSON.stringify(r.verdict, null, 2), '```');
  }
  parts.push(reviewerPrompt(repo, s.ticket, s.cfg, s.round, { diff: s.diff, tests: s.tests, response: s.response, sinceSha: s.sinceSha, merged: s.merged }));
  return parts.join('\n\n');
}

// Runs one reviewer command with the prompt on stdin. Returns the process result, or { error } if it couldn't start.
// One that runs past `ms` fails the round (0180).
function runReviewer(repo, name, command, values, prompt, ms) {
  const [cmd, ...args] = commandArgs(command, values);
  if (!cmd) return { cmd: '', error: 'the command is empty' };
  const r = runLimited(cmd, args, { cwd: repo, input: prompt, ms });
  if (r.timedOut) throw new SpeckError(tookTooLong(name, ms));
  if (r.error) return { cmd, error: r.error.code === 'ENOENT' ? `\`${cmd}\` isn't installed or isn't on your PATH` : `\`${cmd}\` failed (${r.error.message})` };
  return { ...r, cmd };
}

// The value at a dot path such as `session_id` or `meta.session.id`, as a string, or '' if there isn't one.
function atPath(obj, dotted) {
  const v = String(dotted).split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), obj);
  return typeof v === 'string' || typeof v === 'number' ? String(v) : '';
}

// Runs a reviewer set up in config as a command. speck reads the verdict from its output, so the builder never handles it.
// If the reviewer can resume a session (session_id_path and resume_command), later rounds continue it with only the new
// round's prompt. Otherwise, or if resuming fails, a fresh run gets the full history.
export function runCommandReview(repo, id, name, command, s) {
  const options = reviewerOptions(s.cfg, name);
  const settings = reviewerSettings(s.ticket.fm, s.cfg);
  const values = { model: settings.model, effort: settings.effort };
  // Only the latest round's session has seen every round so far. An older one would miss the rounds since.
  const last = s.round > 1 ? resumableSession(s.prior, name, settings) : {};
  const lastThread = last.thread;
  const resume = typeof options.resume_command === 'string' && options.resume_command.includes('{session}') ? options.resume_command : '';
  const ms = reviewTimeoutMs(s.cfg);
  const started = Date.now();
  let r = null, session = 'fresh';
  if (s.round > 1) {
    let why = '';
    if (!resume) why = 'no resume_command with {session} is set for it';
    else if (!lastThread) why = last.why;
    else {
      const tried = runReviewer(repo, name, resume, { ...values, session: lastThread }, reviewerPrompt(repo, s.ticket, s.cfg, s.round, { diff: s.diff, tests: s.tests, response: s.response, sinceSha: s.sinceSha, merged: s.merged }), ms);
      if (tried.error) why = `resuming session ${lastThread} failed: ${tried.error}`;
      else if (tried.status !== 0) why = `resuming session ${lastThread} exited ${tried.status}`;
      else { r = tried; session = 'continued'; }
    }
    if (!r) console.log(`Started a fresh ${name} session with the full history, because ${why}.`);
  }
  if (!r) {
    const prompt = s.round === 1 ? fullPrompt(repo, s.ticket, s.cfg, s.diff, s.tests, s.response) : historyPrompt(repo, s, id);
    if (s.round === 1) fs.writeFileSync(roundOneFile(repo, id), prompt);
    r = runReviewer(repo, name, command, values, prompt, ms);
  }
  if (r.error) throw new SpeckError(`Couldn't run the ${name} reviewer: ${r.error}. Check reviewer_options.${name} in speck/config.yml.`);
  const tail = r.stderr.trim().split('\n').slice(-5).join('\n');
  const stderrNote = tail ? `\nLast lines of its error output:\n${tail}` : '';
  if (r.status !== 0) throw new SpeckError(`The ${name} reviewer (${r.cmd}) exited ${r.status}, so no round was recorded.${stderrNote}`);
  const { verdict, envelope } = verdictFromOutput(r.stdout);
  if (!verdict) throw new SpeckError(`The ${name} reviewer (${r.cmd}) didn't return a verdict: its output wasn't JSON, a \`\`\`json block or a JSON envelope with a "result". No round was recorded.${stderrNote}`);
  // An invalid verdict is the reviewer's failure too, so it gets the same stderr lines.
  try { validateVerdict(structuredClone(verdict)); } catch (e) { if (e instanceof SpeckError) throw new SpeckError(`${e.message} The ${name} reviewer's verdict wasn't recorded.${stderrNote}`); throw e; }
  const usage = envelope?.usage && typeof envelope.usage === 'object' ? { usage: envelope.usage } : {};
  // A resumed run that doesn't report its session id keeps the one it resumed.
  const thread = (options.session_id_path ? atPath(envelope ?? jsonIn(r.stdout), options.session_id_path) : '') || (session === 'continued' ? lastThread : '');
  return saveRound(repo, id, verdict, { reviewer: name, ...settingsMeta(settings), reviewed_sha: s.head, ...(s.merge ? { merge: true } : {}), ...(s.extra ? { extra: true } : {}), session,
    ...(thread ? { thread_id: thread } : {}), ...(s.response ? { builder_response: s.response } : {}),
    seconds: Math.round((Date.now() - started) / 1000), ...usage, ...s.testsSeen });
}

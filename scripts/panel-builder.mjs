// 0669: the panel's Builder picker. Sets a ticket's builder and builder_model together, as `speck set <id> builder
// <agent>` and `speck set <id> builder_model <model>` do, and commits only that ticket, as the Level picker does (0662).
// Both blank is Default, so its level or the settings decide again.
import fs from 'node:fs';
import path from 'node:path';
import { SpeckError, sh, loadConfig, findTicket, commitTicketOnly } from './speck.mjs';
import { checkNotBeingBuilt, writeField, parseTicket } from './core.mjs';
import { lintTicket } from './lint.mjs';
import { knownProviders } from './custom-providers.mjs';
import { boardBuilders } from './build-model.mjs';
import { ticketBuild } from './level-builds.mjs';

const IN_HAND = ['building', 'reviewing', 'blocked', 'approved'];
const AGENTS = ['claude', 'codex', 'cursor'];

// Every refusal comes before the first write. `builder` and `model` are from the URL, so only an agent speck can build
// with, or blank, gets through. Returns { status, body } for the server to send: on success, the ticket's builder
// facts as the board gives them, so the page shows the change before the next board.
export function panelSetBuilder(repo, id, builder, model) {
  const cfg = loadConfig(repo), providers = knownProviders(repo);
  let t;
  try { t = findTicket(repo, id); } catch (e) { return { status: 404, body: { error: e.message } }; }
  const pad = t.fm.id, status = t.fm.status;
  // A ticket being built in its own worktree: `speck set`'s own refusal, word for word.
  try { checkNotBeingBuilt(repo, cfg, t); } catch (e) { if (e instanceof SpeckError) return { status: 409, body: { error: e.message } }; throw e; }
  if (IN_HAND.includes(status)) return { status: 409, body: { error: `Ticket ${pad} is being built (${status}), so its builder can't change until it ships.` } };
  if (status === 'done' || status === 'cancelled') return { status: 409, body: { error: `Ticket ${pad} is ${status}, so its builder can't change.` } };
  builder = String(builder ?? '').trim();
  model = String(model ?? '').trim();
  const names = [...AGENTS, ...providers.map(p => p.name)];
  if (builder && !names.includes(builder)) return { status: 422, body: { error: `"${builder}" isn't an agent speck can build with: pick ${names.join(', ')}, or Default.` } };
  if (!builder && model) return { status: 422, body: { error: 'Pick the agent that runs the model, or Default for both.' } };
  if (/[\x00-\x1f\x7f]/.test(model)) return { status: 422, body: { error: 'A builder\'s model must be on one line, with no tabs or other control characters.' } };
  // The ready check, on the ticket as it would be: a pick that adds an error to it is refused with that error's words.
  const before = new Set(lintTicket(t, cfg).errors);
  const after = lintTicket({ ...t, fm: { ...t.fm, builder, builder_model: model } }, cfg).errors.filter(e => !before.has(e));
  if (after.length) return { status: 422, body: { error: after.join('\n') } };
  const branch = sh('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: repo }).stdout.trim();
  if (branch !== cfg.base_branch)
    return { status: 409, body: { error: `This checkout is on "${branch}", not ${cfg.base_branch}, so the ticket would be committed to the wrong branch. Switch to ${cfg.base_branch}, then try again.` } };
  const shown = fm => ({ ok: true, id: pad, ...boardBuilders(cfg, repo)(fm), build_with: ticketBuild(fm, cfg, providers) });
  const was = ticketBuild(t.fm, cfg, providers).own;
  if (was.builder === builder && was.builder_model === model) return { status: 200, body: shown(t.fm) }; // already that builder
  const rel = path.relative(repo, t.file), original = t.raw;
  writeField(t, 'builder', builder);
  writeField({ ...t, raw: fs.readFileSync(t.file, 'utf8') }, 'builder_model', model);
  const commit = commitTicketOnly(repo, t.file, original, `speck(${pad}): builder ${builder ? `${builder}${model ? ` · ${model}` : ''}` : 'default'}`);
  if (commit.status !== 0)
    return { status: 500, body: { error: `Couldn't commit ${rel}, so its builder is unchanged:\n${(commit.stderr || commit.stdout || '').trim().split('\n').slice(-5).join('\n')}` } };
  return { status: 200, body: shown(parseTicket(fs.readFileSync(t.file, 'utf8')).fm) };
}

// 0647: while the builder's own agent is held by a usage limit, speck run starts each new build on the first agent on
// builder_bench that's ready (installed and signed in) and not held, with that agent's own build command and without
// builder_model or builder_effort, which are in the builder's own format. The ticket's `builder:` records it, committed
// before the build starts, so its review checks the family of the agent that built it. An agent the ready check would
// refuse beside the ticket's reviewer, as the same model family, is skipped. With none free, builds wait for the reset.
import fs from 'node:fs';
import { sh, setField, syncHeader } from './core.mjs';
import { commitTicketOnly } from './close.mjs';
import { benchOf } from './bench.mjs';
import { configBuilder, buildPlan, launchAgent, standInTicket } from './ticket-builder.mjs';
import { ticketSameModelProblem } from './same-model.mjs';
import { buildTicket } from './build-records.mjs';
import { providerNamed } from './provider-review.mjs';
import { knownProviders } from './custom-providers.mjs';
import { onPath } from './install.mjs';

const CLI_NAMES = { claude: 'Claude', codex: 'Codex', cursor: 'Cursor' };
const nameOf = (agent, providers) => providerNamed(agent, providers)?.label ?? (Object.hasOwn(CLI_NAMES, agent) ? CLI_NAMES[agent] : agent);

// The agent on `cfg`'s builder_bench that ticket `fm` (its frontmatter) builds on while `own`, the builder's agent, is
// held: { agent }, or { why } when none can. `ready` lists your ready agents in speck agents' order, `held(agent)` says
// whether a usage limit holds one, and `plan(agent)` is buildPlan for the ticket on that agent.
export function standInFor(cfg, fm, { own, ready, held, plan, providers = [] }) {
  const bench = benchOf(cfg, 'builder_bench', { yours: ready, own, providers });
  const to = bench.find(a => a !== own && ready.includes(a) && !held(a)
    && (cfg?.allow_same_model_review === true || !ticketSameModelProblem(standInTicket(fm, a), cfg)) && !plan(a).why); // 0659: on its own model
  return to ? { agent: to } : { why: 'no agent on builder_bench is ready, free of a usage limit and from another family than the reviewer' };
}

// Sets ticket `id`'s builder to `agent` in the main checkout and commits only the ticket there, on the base branch. null
// when that's done or it already records `agent`, otherwise why it couldn't be.
export function recordBuilder(repo, cfg, id, agent) {
  const { at, t } = buildTicket(repo, cfg, id);
  if (String(t.fm.builder ?? '').trim() === agent) return null;
  const branch = sh('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: at }).stdout.trim();
  if (branch !== cfg.base_branch) return `the checkout at ${at} is on ${branch || 'no branch'}, not ${cfg.base_branch}, so its builder can't be committed`;
  try { fs.writeFileSync(t.file, syncHeader(setField(t.raw, 'builder', agent))); } catch (e) { return `its ticket couldn't be written (${e.message})`; }
  let commit;
  try { commit = commitTicketOnly(at, t.file, t.raw, `speck(${id}): builder ${agent} while the builder is limited`); }
  catch (e) { commit = { status: 1, stderr: e.message }; }
  if (commit.status === 0) return null;
  try { fs.writeFileSync(t.file, t.raw); } catch { /* commitTicketOnly put it back */ }
  return `its ticket couldn't be committed (${(commit.stderr || commit.stdout || '').trim().split('\n').pop()})`;
}

// speck run's side. pick(cfg, command, t, free) is called for a ready ticket about to start: null when its agent isn't
// held, so it starts as usual; `false` when it's held and must wait; or the stand-in agent, recorded on the ticket. With
// no build slot `free`, nothing is chosen or recorded, so a ticket waiting for a slot starts on the builder once it resets. check() says
// once the limit has reset that new builds go back to the builder. The move, and the move back, are each said once per
// limit. `heldAgent`, `readyAgents` and `speak` are speck run's, and `fmOf(id)` reads a ticket's frontmatter.
export function builderStandIn({ repo, heldAgent, readyAgents, speak, fmOf, providers = () => knownProviders(repo), installed = onPath, record = recordBuilder }) {
  let moved = null; // { from, to }: new builds on `to` while `from` is held
  const said = new Map(); // ticket id → the last reason it couldn't move, said once
  const once = (id, why) => { if (said.get(id) !== why) speak(why); said.set(id, why); };

  const pick = (cfg, command, t, free = true) => {
    const own = configBuilder(cfg), agent = launchAgent(cfg, command, t);
    if (!heldAgent(agent)) return null;
    if (agent !== own || !free) return false; // a ticket of its own builder's waits for that agent's reset
    const known = providers();
    let ready = [];
    try { ready = readyAgents(); } catch { /* none can be read: it waits for the limit */ }
    ready = (Array.isArray(ready) ? ready : []).filter(a => typeof a === 'string');
    let fm, choice;
    try {
      fm = fmOf(t.id);
      choice = standInFor(cfg, fm, { own, ready, held: heldAgent, providers: known, plan: a => buildPlan(cfg, standInTicket(t, a), installed, { repo, providers: known }) });
    } catch (e) { once(t.id, `${nameOf(own, known)}'s usage limit is reached, but ${t.id} can't start on builder_bench: ${e.message}`); return false; }
    if (!choice.agent) return false;
    const why = record(repo, cfg, t.id, choice.agent);
    if (why) { once(t.id, `${nameOf(own, known)}'s usage limit is reached, but ${t.id} can't start on ${nameOf(choice.agent, known)}: ${why}. It waits for the limit to reset.`); return false; }
    said.delete(t.id);
    if (moved?.from !== own || moved?.to !== choice.agent) {
      moved = { from: own, to: choice.agent };
      speak(`${nameOf(own, known)}'s usage limit is reached, so new builds start on ${nameOf(choice.agent, known)}, the first agent on builder_bench that's ready and free, until it resets.`);
    }
    return choice.agent;
  };

  const check = () => {
    if (!moved || heldAgent(moved.from)) return;
    const name = nameOf(moved.from, providers());
    moved = null;
    said.clear();
    speak(`${name}'s usage limit has reset, so new builds start on ${name} again.`);
  };

  return { pick, check };
}

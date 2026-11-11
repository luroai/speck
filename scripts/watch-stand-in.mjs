// 0637: while the watch agent's own agent is held by a usage limit, each look runs on the first other agent of yours that's
// ready and not held, in speck agents' order, on that agent's own model and effort. Builds and reviewers stay on theirs.
// 0645: the first in watch_bench's order, which is your agents in that order when it's blank. 0651: a check in the app
// that QA runs takes its stand-in from qa_bench instead, and the lines say QA's checks moved.
import { providerNamed } from './provider-review.mjs';
import { benchOf } from './bench.mjs';

// An agent as speck run's lines about usage limits name it.
const CLI_NAMES = { claude: 'Claude', codex: 'Codex', cursor: 'Cursor' };
const agentName = (agent, providers) => providerNamed(agent, providers)?.label ?? (Object.hasOwn(CLI_NAMES, agent) ? CLI_NAMES[agent] : agent);
// `cfg` with the watch agent on `agent` instead, without watch_model or watch_effort, which are for its own agent.
const standInConfig = (cfg, agent) => ({ ...cfg, watch_agent: agent, watch_model: '', watch_effort: '' });

// The record's `moved`: { from, to } while looks run on `to` because `from` is held by a usage limit, or null.
export const movedOf = m => (m && typeof m === 'object' && typeof m.from === 'string' && typeof m.to === 'string' ? { from: m.from, to: m.to } : null);

// `heldAgent(agent)` says whether a recorded usage limit holds an agent, `readyAgents()` lists your ready agents in speck
// agents' order, `speak` says a line in speck run's log, and `agents` are the agents the watch agent can run on besides
// model providers. The move, and the move back once the limit has reset, are each said once, and kept in the record's
// `moved`, so a later speck run says the move back too.
export function standIn({ heldAgent, readyAgents, speak, agents }) {
  let refused = null; // the last watch_bench speck couldn't use, said once
  // Clears a move whose limit has reset, saying so while `watching` on `own`, the agent it moved from. One from an agent
  // that's no longer its own is cleared without a word. True when it cleared one.
  const movedBack = (s, watching, own, known) => {
    if (!s.moved || (watching && s.moved.from === own && heldAgent(own))) return false;
    if (watching && s.moved.from === own) speak(`${agentName(s.moved.from, known)}'s usage limit has reset, so I'm looking into stops on ${agentName(s.moved.from, known)} again.`);
    s.moved = null;
    return true;
  };
  // The config the next look runs with: `cfg` while `own` isn't held, a stand-in's, or null while none can take it.
  // `qa` when it's QA's check in the app.
  const lookOn = (s, cfg, own, known, qa = false) => {
    if (!heldAgent(own)) return cfg;
    let ready = [];
    try { ready = readyAgents(); } catch { /* none can be read: it waits for the limit */ }
    ready = (Array.isArray(ready) ? ready : []).filter(a => typeof a === 'string');
    let bench;
    const key = qa ? 'qa_bench' : 'watch_bench';
    try { bench = benchOf(cfg, key, { yours: ready, own, providers: known }); refused = null; } catch (e) {
      if (refused !== e.message) speak(`${agentName(own, known)}'s usage limit is reached, but ${qa ? 'QA' : 'I'} can't take a stand-in from ${key}: ${e.message}`);
      refused = e.message;
      return null;
    }
    const to = bench.find(a => ready.includes(a) && a !== own && (agents.includes(a) || providerNamed(a, known)) && !heldAgent(a));
    if (!to) return null;
    if (s.moved?.from !== own || s.moved?.to !== to) {
      s.moved = { from: own, to };
      speak(`${agentName(own, known)}'s usage limit is reached, so ${qa ? 'QA will check in the app' : 'I\'ll look into stops'} on ${agentName(to, known)} until it resets.`);
    }
    return standInConfig(cfg, to);
  };
  return { movedBack, lookOn };
}

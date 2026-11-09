// 0286: the Foreman clearing blocked questions. With watch: fix, each of speck run's checks takes the
// recommendation of every blocked ticket whose question changes nothing you'd notice and has a clear winner (0283), as
// the panel's Go with the recommendation button does (0284), so the same check's goWithQueue resumes its build. It
// does so at most once per ticket: goWith refuses a second time, leaving the question for you.
// 0564: with watch: decide, every recommendation of a low-risk ticket, whatever its facts, up to 3 per ticket.
import { speckSays } from './core.mjs';
import { fixingOf, speckActs, speckTakes } from './foreman.mjs';
import { goWith as goWithDefault } from './go-with.mjs';

// `readConfig()` gives speck/config.yml as it is now, so a change to watch counts from the next check.
// `running` holds the builds speck run has going: one still ending after it blocked is tried on a later check.
// check(tickets) marks each ticket it chose for as building, in `tickets`, for the rest of the check.
export function foremanFixQueue({ repo, readConfig, running = new Set(), goWith = goWithDefault, say = console.log }) {
  const told = new Map(); // ticket id → the last refusal said, so each is said once
  const check = tickets => {
    let cfg;
    try { cfg = readConfig(); } catch { return; } // read again next check
    const watch = fixingOf(cfg);
    if (!speckActs(watch)) return;
    for (const t of tickets) {
      if (!speckTakes(watch, t)) { told.delete(t.id); continue; }
      if (running.has(t.id)) continue;
      let out;
      try { out = goWith(repo, t.id, new Date(), { by: 'foreman' }); } catch (e) { out = { status: 500, body: { error: String(e?.message || e) } }; }
      if (out.status === 200) {
        told.delete(t.id);
        t.status = 'building';
        say(speckSays(`${t.id}: I went with the recommendation: ${t.blocked_recommendation}, as watch is ${watch}, and noted it in the ticket.`)); // 0591
        continue;
      }
      const why = String(out.body?.error || `refused (${out.status})`);
      if (told.get(t.id) !== why) say(speckSays(`${t.id}: I didn't take its recommendation: ${why}`));
      told.set(t.id, why);
    }
  };
  return { check };
}

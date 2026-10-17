import './support/tmp.mjs'; // first: sends every temporary folder into one per-run folder that is cleaned up
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './support/panel.mjs';

// ---------- 0270: room to grow in panel.mjs, run.mjs and core.mjs ----------

const SCRIPTS = path.join(ROOT, 'scripts');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const lines = src => src.split('\n').length - (src.endsWith('\n') ? 1 : 0);
const FULL = ['panel.mjs', 'run.mjs', 'core.mjs'];

test('0270 AC2: no file under scripts/ is over 600 lines', () => {
  const all = fs.readdirSync(SCRIPTS, { recursive: true }).filter(f => fs.statSync(path.join(SCRIPTS, f)).isFile());
  for (const f of all) assert.ok(lines(read(`scripts/${f}`)) <= 600, `scripts/${f} has ${lines(read(`scripts/${f}`))} lines`);
});

// Every name some file imports from one of the three, by a static import or re-export: [file, module, name].
function importedNames() {
  const files = ['scripts', 'test'].flatMap(d => fs.readdirSync(path.join(ROOT, d), { recursive: true }).map(f => path.join(d, f)))
    .filter(f => f.endsWith('.mjs'));
  const out = [];
  for (const f of files) {
    for (const m of read(f).matchAll(/(?:import|export)\s*\{([^}]*)\}\s*from\s*'([^']+)'/g)) {
      const target = path.resolve(ROOT, path.dirname(f), m[2]);
      if (path.dirname(target) !== SCRIPTS || !FULL.includes(path.basename(target)) || target === path.resolve(ROOT, f)) continue;
      for (const n of m[1].split(',').map(s => s.trim().split(/\s+as\s+/)[0]).filter(Boolean)) out.push([f, path.basename(target), n]);
    }
  }
  return out;
}

// The names each of the three exported before this ticket: what they export now must include all of them.
const BEFORE = {
  'core.mjs': ['EFFORTS', 'LOCKFILES', 'RISKY', 'ROOT', 'ROUNDS_HEADING', 'STATUSES', 'STATUS_LINE', 'SpeckError', 'TEMPLATES', 'TYPES', 'addPaused',
    'addWaited', 'blank', 'branchChangedLines', 'builderSpend', 'builderSpent', 'byPriority', 'changedLines', 'checkNotBeingBuilt', 'collectChildOutput',
    'contentLines', 'doneIdeasDir', 'findRepoRoot', 'findTicket', 'forkPoint', 'git', 'ideaStatus', 'ideasDir', 'isAncestor', 'lintTicket', 'listTickets',
    'loadConfig', 'modelFamily', 'nextId', 'padId', 'parseTicket', 'parseYaml', 'pausedSince', 'placeTicket', 'posix', 'repoPath', 'reviewerSettings',
    'setField', 'settingsMeta', 'sh', 'slugify', 'splitRounds', 'stripComment', 'syncHeader', 'ticketBranches', 'ticketDirs', 'ticketHeader',
    'ticketPriority', 'ticketRounds', 'ticketType', 'ticketsDir', 'ticketsElsewhere', 'waitFields', 'worktreeList', 'worktreePath', 'writeField'],
  'run.mjs': ['DEFAULT_RESUME_COMMAND', 'buildKilled', 'buildProcesses', 'buildTicket', 'cmdPause', 'cmdPlay', 'cmdRun', 'cmdStop', 'pauseBuild',
    'pidAlive', 'playBuild', 'processRows', 'refusalFile', 'resumeHint', 'runState', 'runWorker', 'runningPids', 'runsDir', 'sessionInUse', 'stopBuild',
    'takeRefusal'],
  'panel.mjs': ['cmdPanel', 'panelRunOn', 'panelServer'],
};

test('0270 AC3: every name another file imports from the three, and every name they exported before, can still be imported from them', async () => {
  const mods = Object.fromEntries(await Promise.all(FULL.map(async f => [f, await import(`../scripts/${f}`)])));
  const used = importedNames();
  assert.ok(used.length > 50, `found the imports (${used.length})`);
  for (const [f, mod, name] of used) assert.notEqual(mods[mod][name], undefined, `${f} imports ${name} from ${mod}`);
  for (const [mod, names] of Object.entries(BEFORE)) for (const name of names) assert.ok(Object.hasOwn(mods[mod], name), `${mod} exports ${name}`);
  // speck run's process check imports run.mjs by its URL and calls these.
  assert.equal(typeof mods['run.mjs'].buildProcesses, 'function');
  assert.equal(typeof mods['run.mjs'].runningPids, 'function');
});

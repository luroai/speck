// speck init and doctor: install speck in a repo, tidy up after older versions, and check what speck needs.

import fs from 'node:fs';
import path from 'node:path';
import { ROOT, TEMPLATES, SpeckError, sh, findRepoRoot, loadConfig, parseTicket, setField, syncHeader, ticketsDir, ticketDirs, ideasDir, doneIdeasDir, repoPath, findTicket, placeTicket, ticketRounds, ideaStatus } from './core.mjs';
import { appendRounds, cacheDir } from './review.mjs';
import { splitCommand } from './reviewers.mjs';

// ---------- install and doctor ----------

const SKILLS = path.join(ROOT, 'skills');
const RETIRED_SKILLS = ['speck-integrate']; // installed by an earlier version, removed on re-install (0116)
export const SKILL_DIRS = ['.claude/skills', '.agents/skills']; // Claude Code reads the first; Codex, cptr and others read the second
const VERSION = (() => {
  // From the source package, or from the VERSION file written next to an installed copy.
  try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version; } catch {}
  try { return fs.readFileSync(path.join(ROOT, 'VERSION'), 'utf8').trim(); } catch {}
  return 'unknown';
})();

function copyDir(from, to) {
  fs.rmSync(to, { recursive: true, force: true });
  fs.cpSync(from, to, { recursive: true });
}

function linkDir(target, at) {
  fs.rmSync(at, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(at), { recursive: true });
  fs.symlinkSync(path.relative(path.dirname(at), target), at, 'dir');
}

// Puts the CLI in .speck/ and the skills where agents look for them. Safe to re-run: it refreshes both.
// Inside speck's own source repo it links instead of copying, so edits show up straight away.
export function installTooling(repo) {
  if (!fs.existsSync(SKILLS)) throw new SpeckError('This copy of speck can\'t install itself. Run `npx github:luroai/speck init` instead.');
  const dev = fs.realpathSync(repo) === fs.realpathSync(ROOT);
  const place = dev ? linkDir : copyDir;
  const skills = fs.readdirSync(SKILLS).filter(n => n.startsWith('speck-') && fs.existsSync(path.join(SKILLS, n, 'SKILL.md')));
  for (const d of ['scripts', 'templates']) place(path.join(ROOT, d), path.join(repo, '.speck', d));
  fs.writeFileSync(path.join(repo, '.speck', 'VERSION'), VERSION + '\n');
  for (const dir of SKILL_DIRS) {
    fs.mkdirSync(path.join(repo, dir), { recursive: true });
    for (const s of skills) place(path.join(SKILLS, s), path.join(repo, dir, s));
    for (const s of RETIRED_SKILLS) fs.rmSync(path.join(repo, dir, s), { recursive: true, force: true });
  }
  return skills;
}

// The speck section init writes into a project's AGENTS.md (0123).
const AGENTS_SECTION = '## speck\n\nThis repo uses speck. Work only from a `ready` ticket in `speck/tickets/` (use `/speck-build <id>`). Never approve your own work, and never merge or ship unless the user runs `/speck-ship` or clicks the Ship button in an approved ticket\'s review pack in the panel, except for the `speck ship <id> --auto` step in `/speck-build`, which ships only when `auto_ship` in `speck/config.yml` allows it.\n';

// Adds the speck section to AGENTS.md text, or brings an existing `## speck` section up to date.
// The section runs from its heading up to the next level-one or level-two heading (`#`, `##`, or a line underlined with `=` or `-`), or the end of the file; nothing outside it changes.
// Headings may be indented by up to three spaces, and lines inside fenced code blocks aren't headings.
// Returns the new text and what it did: added, replaced, current (already up to date) or unheaded (speck is mentioned without the heading, so it's left alone).
export function syncAgentsSection(text) {
  let start = -1, end = text.length, fence = null, para = null; // para: where the paragraph that an underline would make a heading starts
  for (let at = 0; at < text.length;) {
    const eol = text.indexOf('\n', at);
    const lineEnd = eol === -1 ? text.length : eol + 1;
    const line = text.slice(at, lineEnd).replace(/\r?\n$/, '');
    const marker = /^ {0,3}(`{3,}|~{3,})/.exec(line);
    if (fence) { if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length && !line.slice(marker[0].length).trim()) fence = null; }
    else if (marker) { fence = marker[1]; para = null; }
    else if (start === -1 && /^ {0,3}## speck[ \t]*$/.test(line)) { start = at; para = null; }
    else if (start !== -1 && /^ {0,3}#{1,2}(?:[ \t]|$)/.test(line)) { end = at; break; }
    else if (start !== -1 && para !== null && /^ {0,3}(=+|-+)[ \t]*$/.test(line)) { end = para; break; }
    // Blank lines, other headings, quotes, list items and rules end a paragraph; any other line starts one or carries it on.
    else if (!/\S/.test(line) || /^ {0,3}(#|>|[-*+](\s|$)|\d{1,9}[.)](\s|$)|([-*_])([ \t]*\4){2,}[ \t]*$)/.test(line)) para = null;
    else if (para === null && !/^( {4}|\t)/.test(line)) para = at;
    at = lineEnd;
  }
  if (start === -1) {
    if (text.includes('This repo uses speck')) return { text, action: 'unheaded' };
    return { text: text + '\n' + AGENTS_SECTION, action: 'added' };
  }
  const section = text.slice(start, end);
  const body = section.trimEnd();
  if (body.replace(/\r\n/g, '\n') === AGENTS_SECTION.trimEnd()) return { text, action: 'current' };
  return { text: text.slice(0, start) + AGENTS_SECTION.trimEnd() + section.slice(body.length) + text.slice(end), action: 'replaced' };
}

function check(name, ok, fix) { return { name, ok, fix }; }

function runs(cmd, args) {
  try { return sh(cmd, args).status === 0; } catch { return false; }
}

// The builders doctor knows how to check: the name shown, the command on the PATH, and how to install it.
// Cursor's installer also provides `agent`, but `cursor-agent` is the name that can't clash with other tools.
const BUILDERS = {
  claude: ['Claude Code', 'claude', 'Install Claude Code: https://claude.com/claude-code'],
  cursor: ['Cursor CLI', 'cursor-agent', 'Install the Cursor CLI: https://cursor.com/docs/cli/installation'],
  codex: ['Codex CLI', 'codex', 'Install it with `npm install -g @openai/codex`: https://github.com/openai/codex'],
  gemini: ['Gemini CLI', 'gemini', 'Install it with `npm install -g @google/gemini-cli`: https://github.com/google-gemini/gemini-cli'],
};

// True if `cmd` is an executable file: a path as given, or a name found on the PATH. Nothing is run.
export function onPath(cmd) {
  const ok = f => { try { fs.accessSync(f, fs.constants.X_OK); return fs.statSync(f).isFile(); } catch { return false; } };
  if (cmd.includes('/') || cmd.includes(path.sep)) return ok(cmd);
  const exts = process.platform === 'win32' ? ['', ...(process.env.PATHEXT || '.EXE;.CMD;.BAT').split(';')] : [''];
  return (process.env.PATH || '').split(path.delimiter).filter(Boolean).some(d => exts.some(e => ok(path.join(d, cmd + e))));
}

// `platform` is process.platform unless given, so tests can check what Windows sees.
export function doctorChecks(repo, cfg = {}, platform = process.platform) {
  const reviewer = cfg.reviewer || 'codex';
  const builder = cfg.builder || 'claude';
  const checks = [];
  // Parts of speck, such as pausing and stopping builds, rely on macOS or Linux.
  if (platform === 'win32') checks.push(check('Windows isn\'t supported yet: speck supports macOS and Linux for now', false,
    'Use WSL (Windows Subsystem for Linux) and run speck there: https://learn.microsoft.com/windows/wsl/install'));
  checks.push(
    check('Node.js 20 or newer', Number(process.versions.node.split('.')[0]) >= 20,
      'Install the latest Node.js LTS from https://nodejs.org, then open a new terminal.'),
    check('git', runs('git', ['--version']),
      'Install git from https://git-scm.com/downloads.'),
    check('This folder is a git repository', runs('git', ['-C', repo, 'rev-parse', '--git-dir']),
      'Run `git init` here, or run speck from inside your project folder.'),
  );
  // Only the configured builder is checked. speck can't check one it doesn't know, and that isn't a failure.
  // hasOwn, so a name like `constructor` or `toString` is an unknown builder, not a built-in object property.
  if (Object.hasOwn(BUILDERS, builder)) {
    const [label, cmd, fix] = BUILDERS[builder];
    checks.push(check(`${label} (builds tickets)`, onPath(cmd), fix));
  } else checks.push({ name: `speck can't check builder "${builder}": it only knows ${Object.keys(BUILDERS).join(', ')}. Make sure it reads skills from .agents/skills/ or .claude/skills/.`, ok: true, info: true });
  // speck ships locally with git, so the GitHub CLI is only a convenience.
  const ghInstalled = runs('gh', ['--version']);
  checks.push({ ...check('GitHub CLI (optional)', ghInstalled,
    'Not needed to build or ship. Install it from https://cli.github.com if you want to work with GitHub from the terminal.'), optional: true });
  const command = cfg.reviewer_options?.[reviewer]?.command;
  if (typeof command === 'string' && command.trim()) {
    let first = '';
    try { first = splitCommand(command)[0] || ''; } catch { /* an unclosed quote: reported as not found */ }
    checks.push(check(`Reviewer command for "${reviewer}" (${first || 'empty'})`, Boolean(first) && onPath(first),
      `Install ${first || 'the reviewer'} so it's on your PATH, or fix reviewer_options.${reviewer}.command in speck/config.yml.`));
  } else if (reviewer === 'codex') {
    const codexInstalled = runs('codex', ['--version']);
    checks.push(check('Codex CLI (reviews tickets)', codexInstalled,
      'Install it with `npm install -g @openai/codex`, or set `reviewer: claude-subagent` and `allow_same_model_review: true` in speck/config.yml.'));
    if (codexInstalled) checks.push(check('Signed in to Codex', runs('codex', ['login', 'status']),
      'Run `codex login` and follow the prompts.'));
  }
  return checks;
}

function printChecks(checks) {
  for (const c of checks) console.log(c.info ? `  ℹ ${c.name}` : `  ${c.ok ? '✓' : c.optional ? '–' : '✗'} ${c.name}${c.ok ? '' : `\n      ${c.optional ? 'Note' : 'Fix'}: ${c.fix}`}`);
  return checks.every(c => c.ok || c.optional);
}

export function cmdDoctor(args, platform = process.platform) {
  let repo = process.cwd(), cfg = {};
  try { repo = findRepoRoot(); cfg = loadConfig(repo); } catch {}
  console.log('Checking what speck needs:');
  const ok = printChecks(doctorChecks(repo, cfg, platform));
  console.log(ok ? '\nAll set.' : '\nFix the ✗ items above, then run this again.');
  if (!ok) throw new SpeckError('', 1);
}

// Moves review rounds from an older speck's speck/reviews/<id>/round-N.json files into their tickets.
// Anything it can't place is left where it is with the reason, and the rest are still moved.
function migrateReviews(repo) {
  const root = path.join(repo, 'speck', 'reviews');
  if (!fs.existsSync(root)) return;
  let moved = 0;
  for (const id of fs.readdirSync(root).filter(n => /^\d{4}$/.test(n)).sort()) {
    const dir = path.join(root, id);
    try {
      let t;
      try { t = findTicket(repo, id); }
      catch (e) { throw new Error(/not found/.test(e.message) ? `there's no ticket ${id}.` : e.message); }
      const files = fs.readdirSync(dir).filter(f => /^round-\d+\.json$/.test(f));
      const recs = files.map(f => {
        try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); }
        catch (e) { throw new Error(`${f} isn't valid JSON (${e.message}).`); }
      }).sort((a, b) => (a?.meta?.round ?? 0) - (b?.meta?.round ?? 0));
      const existing = ticketRounds(t.raw);
      if (recs.length && (existing.rounds.length || existing.errors.length))
        throw new Error(`${path.relative(repo, t.file)} already has review rounds.`);
      if (recs.length) {
        const next = appendRounds(t.raw, recs);
        const problems = ticketRounds(next).errors;
        if (problems.length) throw new Error(problems[0]);
        fs.writeFileSync(t.file, next);
        moved++;
      }
      for (const f of files) fs.rmSync(path.join(dir, f));
      fs.rmSync(path.join(dir, 'codex-thread'), { force: true }); // each round records its thread id
      const settings = path.join(dir, 'reviewer-settings.json');
      if (fs.existsSync(settings)) fs.renameSync(settings, path.join(cacheDir(repo, id), 'reviewer-settings.json'));
      const left = fs.readdirSync(dir);
      if (left.length) console.log(`kept    speck/reviews/${id}/: it still has ${left.join(', ')}. Move or delete them yourself.`);
      else fs.rmdirSync(dir);
    } catch (e) {
      console.log(`skipped speck/reviews/${id}/: ${e.message} Its files are left where they are.`);
    }
  }
  if (moved) console.log(`moved   review rounds for ${moved} ticket${moved === 1 ? '' : 's'} into the ticket files`);
  if (fs.readdirSync(root).every(n => n === '.gitkeep')) fs.rmSync(root, { recursive: true, force: true });
}

// File each ticketed note in speck/ideas/ in speck/ideas/done/, for a repo from before notes were filed when ticketed.
// Then point every ticket whose source is a filed note's old path at its new one.
function fileTicketedIdeas(repo) {
  const from = ideasDir(repo), to = doneIdeasDir(repo);
  const notes = fs.readdirSync(from).filter(f => f.endsWith('.md') && fs.statSync(path.join(from, f)).isFile());
  let moved = 0;
  for (const f of notes) {
    if (!ideaStatus(fs.readFileSync(path.join(from, f), 'utf8')).startsWith('ticketed')) continue;
    if (fs.existsSync(path.join(to, f))) { console.log(`kept    speck/ideas/${f}: speck/ideas/done/${f} already exists. Rename one, then run init again to file it.`); continue; }
    fs.mkdirSync(to, { recursive: true });
    fs.renameSync(path.join(from, f), path.join(to, f));
    moved++;
  }
  if (moved) console.log(`moved   ${moved} ticketed idea note${moved === 1 ? '' : 's'} into speck/ideas/done/`);
  for (const dir of ticketDirs(repo).filter(d => fs.existsSync(d))) {
    for (const f of fs.readdirSync(dir).filter(n => /^\d{4}-.*\.md$/.test(n))) {
      const file = path.join(dir, f);
      const text = fs.readFileSync(file, 'utf8');
      let source;
      try { source = parseTicket(text).fm.source; } catch { continue; }
      if (typeof source !== 'string' || !source) continue;
      const at = path.resolve(repo, source);
      const filed = path.join(to, path.basename(at));
      if (path.dirname(at) !== from || fs.existsSync(at) || !fs.existsSync(filed)) continue;
      fs.writeFileSync(file, setField(text, 'source', JSON.stringify(repoPath(repo, filed))));
    }
  }
}

export function cmdInit(args, platform = process.platform) {
  const repo = process.cwd();
  const force = args.includes('--force');
  console.log(`speck ${VERSION}: setting up ${repo}\n`);
  const dirs = ['speck/ideas', 'speck/tickets', 'speck/tickets/done'];
  for (const d of dirs) fs.mkdirSync(path.join(repo, d), { recursive: true });
  const copies = [['config.yml', 'speck/config.yml']];
  for (const [from, to] of copies) {
    const dest = path.join(repo, to);
    if (fs.existsSync(dest) && !force) { console.log(`kept    ${to}`); continue; }
    fs.copyFileSync(path.join(TEMPLATES, from), dest);
    console.log(`created ${to}`);
  }
  // Tidy up after a version of speck that kept done tickets in speck/tickets/, so the layout above holds.
  // A ticket file speck can't read is left where it is with a warning, so it can't stop an update.
  const strays = fs.readdirSync(ticketsDir(repo)).filter(f => /^\d{4}-.*\.md$/.test(f)).flatMap(f => {
    const file = path.join(ticketsDir(repo), f);
    try { return [{ file, ...parseTicket(fs.readFileSync(file, 'utf8')) }]; }
    catch (e) { console.log(`skipped speck/tickets/${f}: ${e.message} Fix it, then run init again to file it if it's done.`); return []; }
  }).filter(t => t.fm.status === 'done');
  for (const t of strays) placeTicket(repo, t, 'done');
  if (strays.length) console.log(`moved   ${strays.length} done ticket${strays.length === 1 ? '' : 's'} into speck/tickets/done/`);
  migrateReviews(repo);
  fileTicketedIdeas(repo);
  // Give every ticket the readable header, or bring it up to date. Unreadable files were reported above (or are in done/) and are left alone.
  let synced = 0;
  for (const dir of ticketDirs(repo).filter(d => fs.existsSync(d))) {
    for (const f of fs.readdirSync(dir).filter(n => /^\d{4}-.*\.md$/.test(n))) {
      const file = path.join(dir, f);
      const text = fs.readFileSync(file, 'utf8');
      let next;
      try { next = syncHeader(text); } catch { continue; }
      if (next !== text) { fs.writeFileSync(file, next); synced++; }
    }
  }
  if (synced) console.log(`updated ${synced} ticket header${synced === 1 ? '' : 's'} (title and status)`);
  for (const d of dirs) {
    const keep = path.join(repo, d, '.gitkeep');
    if (!fs.readdirSync(path.join(repo, d)).length) fs.writeFileSync(keep, '');
  }
  const skills = installTooling(repo);
  console.log(`updated .speck/ (the speck command)`);
  console.log(`updated ${SKILL_DIRS.join(' and ')} (${skills.length} skills)`);
  const agents = path.join(repo, 'AGENTS.md');
  const agentsText = fs.existsSync(agents) ? fs.readFileSync(agents, 'utf8') : '# Agent guide\n';
  const section = syncAgentsSection(agentsText);
  if (section.text !== agentsText) fs.writeFileSync(agents, section.text);
  if (section.action === 'added') console.log('updated AGENTS.md');
  if (section.action === 'replaced') console.log('updated AGENTS.md (its speck section was out of date)');
  if (section.action === 'unheaded') console.log(`kept    AGENTS.md: it mentions speck but has no "## speck" section, so speck can't tell which part to update.
        The speck instructions in it may be out of date. Compare them with the current ones:

${AGENTS_SECTION.trimEnd().split('\n').map(l => l && `        ${l}`).join('\n')}
`);
  const claude = path.join(repo, 'CLAUDE.md');
  const claudeText = fs.existsSync(claude) ? fs.readFileSync(claude, 'utf8') : '';
  if (!claudeText.includes('@AGENTS.md') && !claudeText.includes('This repo uses speck')) {
    fs.writeFileSync(claude, claudeText + (claudeText ? '\n' : '') + '@AGENTS.md\n');
    console.log('updated CLAUDE.md (imports AGENTS.md)');
  }
  const cfg = loadConfig(repo);
  let ready = true;
  if (!args.includes('--skip-checks')) {
    console.log('\nChecking what speck needs:');
    ready = printChecks(doctorChecks(repo, cfg, platform));
  }
  console.log(`
${ready ? 'speck is installed.' : 'speck is installed, but fix the ✗ items above before building a ticket. Run `node .speck/scripts/speck.mjs doctor` to check again.'}

Next:
  1. Commit the new files so everyone working on this repo gets speck.
  2. Set commands.test in speck/config.yml (the command that runs your tests).
  3. Open your coding agent in this folder and type /speck-ticket to shape an idea into small tickets.
  4. Read each draft ticket, then set it ready, in the panel or with \`node .speck/scripts/speck.mjs set <id> status ready\`.
  5. Start \`node .speck/scripts/speck.mjs run\`. It builds your ready tickets one at a time, each reviewed on its own branch.
  6. Follow along in \`node .speck/scripts/speck.mjs panel\`.

An approved ticket waits for you: read it with \`node .speck/scripts/speck.mjs pack <id>\`, then type /speck-ship <id> to merge it into ${cfg.base_branch}.
With auto_ship on in speck/config.yml, a ticket whose risk is in auto_ship_risk ships by itself once the reviewer approves it.

To update speck later, run the same install command again.`);
}

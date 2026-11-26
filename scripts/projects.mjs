// 0755: `speck projects`, a list of your speck projects on this machine that lasts whether their panels are running
// or not, for the service that runs every project. It's kept in your home folder's ~/.config/speck/projects.json,
// beside your other home settings and never in a repo, as it holds your folders' paths. Each project is its main
// checkout, by its real path, and its name is its folder's name, as the panel's project menu shows it.
// 0762: `speck projects off` keeps a project on the list but marks it off ({ folder, off: true }), so speck serve
// neither runs nor shows it, and `speck projects on` turns it back on.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { SpeckError, worktreeList } from './core.mjs';
import { homeSettingsDir } from './home-settings.mjs';
import { panelsDir } from './panel-projects.mjs';
import { pidAlive, runState } from './run-switch.mjs';
import { BUILD_ENV } from './build-env.mjs';

const USAGE = 'speck projects                        list your speck projects on this machine\n  speck projects add [<folder>]         add the project at that folder, or the current one\n  speck projects remove <name or folder>  take a project off the list\n  speck projects off <name or folder>   keep it on the list, but leave it out of speck serve\n  speck projects on <name or folder>    put it back in speck serve';

export function projectsFile(env = process.env) {
  const dir = homeSettingsDir(env);
  return dir ? path.join(dir, 'projects.json') : '';
}
// The file as messages name it, ~/.config/speck/projects.json unless the tests moved it.
const shown = (env = process.env) => (env.SPECK_HOME_SETTINGS_DIR ? projectsFile(env) : '~/.config/speck/projects.json');

// The listed folders, in the order they were added: [] when there's no file.
export const listedProjects = (env = process.env) => projectEntries(env).map(p => p.folder);
// 0762: the listed folders that aren't turned off, which speck serve runs and shows.
export const onProjects = (env = process.env) => projectEntries(env).filter(p => !p.off).map(p => p.folder);

// Each listed project as { folder, off }, in the order they were added: [] when there's no file.
export function projectEntries(env = process.env) {
  const file = projectsFile(env);
  if (!file) return [];
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch (e) {
    if (e.code === 'ENOENT') return [];
    throw new SpeckError(`Can't read ${shown(env)} (${e.code || e.message}). Make it a file you can read, or delete it and add your projects again with \`speck projects add\`.`);
  }
  let read = null;
  try { read = JSON.parse(text); } catch { /* not JSON: below */ }
  if (!read || typeof read !== 'object' || !Array.isArray(read.projects))
    throw new SpeckError(`Can't read ${shown(env)}: it isn't a list of projects. Delete it, then add your projects again with \`speck projects add\`.`);
  const out = [];
  for (const p of read.projects)
    if (p && typeof p.folder === 'string' && path.isAbsolute(p.folder) && !out.some(q => q.folder === p.folder)) out.push({ folder: p.folder, off: p.off === true });
  return out;
}

// Writes the list, each as { folder, off }, so only its owner can read it, as a whole file at once.
function writeProjects(entries, env = process.env) {
  const file = projectsFile(env);
  if (!file) throw new SpeckError('There\'s no home folder to keep the list of projects in, so nothing was changed.');
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  const tmp = `${file}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(tmp, `${JSON.stringify({ projects: entries.map(({ folder, off }) => (off ? { folder, off: true } : { folder })) }, null, 2)}\n`, { mode: 0o600 });
    fs.chmodSync(tmp, 0o600);
    fs.renameSync(tmp, file);
  } catch (e) {
    fs.rmSync(tmp, { force: true });
    throw new SpeckError(`Can't write ${shown(env)} (${e.code || e.message}), so nothing was changed.`);
  }
}

const nameOf = folder => path.basename(folder);

// The main checkout of the speck project at `given`, by its real path, or a SpeckError saying why it isn't one.
function projectAt(given) {
  const abs = path.resolve(given);
  let real;
  try { real = fs.realpathSync(abs); } catch { throw new SpeckError(`There's no folder at ${abs}. Nothing was added.`); }
  if (!fs.statSync(real).isDirectory()) throw new SpeckError(`${real} isn't a folder. Nothing was added.`);
  const top = spawnSync('git', ['rev-parse', '--show-toplevel'], { cwd: real, encoding: 'utf8' });
  if (top.error) throw new SpeckError(`Can't run git (${top.error.code || top.error.message}), so speck can't check ${real} is a speck project. Install git, then add it again. Nothing was added.`);
  if (top.status !== 0 || !top.stdout.trim())
    throw new SpeckError(`${real} isn't a git repository, so it can't be a speck project. Nothing was added.`);
  let main = fs.realpathSync(top.stdout.trim());
  try { main = worktreeList(main)[0]?.path || main; } catch { /* git can't list its worktrees: this checkout */ }
  const missing = [];
  if (!fs.existsSync(path.join(main, 'speck', 'config.yml'))) missing.push('speck/config.yml');
  if (!fs.statSync(path.join(main, '.speck'), { throwIfNoEntry: false })?.isDirectory()) missing.push('.speck/');
  if (missing.length)
    throw new SpeckError(`${main} doesn't have speck set up: it has no ${missing.join(' or ')}. Set speck up there first, then add it again. Nothing was added.`);
  return main;
}

function addProject(given, env) {
  const folder = projectAt(given), name = nameOf(folder);
  const entries = projectEntries(env);
  if (entries.some(p => p.folder === folder)) { console.log(`${name} (${folder}) is already on your list of projects. Nothing was changed.`); return; }
  writeProjects([...entries, { folder, off: false }], env);
  console.log(`Added ${name} (${folder}) to your projects on this machine, kept in ${shown(env)}.`);
}

// The listed folder `given` names, by its folder or its name, or a SpeckError saying why there isn't one. `verb` is the
// projects command asking, for its messages.
function findProject(given, folders, verb, nothing) {
  const abs = path.resolve(given);
  let real = abs;
  try { real = fs.realpathSync(abs); } catch { /* gone: its path as given */ }
  let hits = folders.filter(f => f === real || f === abs);
  if (!hits.length) hits = folders.filter(f => nameOf(f) === given);
  if (!hits.length)
    throw new SpeckError(`${given} isn't on your list of projects. ${folders.length ? `Listed: ${folders.map(nameOf).join(', ')}.` : 'The list is empty.'} \`speck projects\` shows them with their folders.`);
  if (hits.length > 1)
    throw new SpeckError(`More than one project on your list is called ${given}:\n${hits.map(f => `  ${f}`).join('\n')}\nSay which by its folder: speck projects ${verb} <folder>. ${nothing}`);
  return hits[0];
}

function removeProject(given, env) {
  if (!given) throw new SpeckError(`Say which project to take off the list:\n  speck projects remove <name or folder>`);
  const entries = projectEntries(env);
  const folder = findProject(given, entries.map(p => p.folder), 'remove', 'Nothing was removed.');
  writeProjects(entries.filter(p => p.folder !== folder), env);
  console.log(`Removed ${nameOf(folder)} (${folder}) from your list of projects. Nothing in the project was changed.`);
}

// 0762: turns a listed project off, so speck serve neither runs nor shows it, or back on. Nothing in it is changed.
function turnProject(given, off, env) {
  const verb = off ? 'off' : 'on';
  if (!given) throw new SpeckError(`Say which project to turn ${verb}:\n  speck projects ${verb} <name or folder>`);
  const entries = projectEntries(env);
  const folder = findProject(given, entries.map(p => p.folder), verb, 'Nothing was changed.'), name = nameOf(folder);
  if (entries.find(p => p.folder === folder).off === off) { console.log(`${name} (${folder}) is already ${verb}. Nothing was changed.`); return; }
  writeProjects(entries.map(p => (p.folder === folder ? { folder, off } : p)), env);
  console.log(off
    ? `Turned ${name} (${folder}) off: it stays on your list, but speck serve stops the panel it started for it, and neither runs nor shows it until \`speck projects on ${name}\`. Nothing in the project was changed.`
    : `Turned ${name} (${folder}) on: speck serve starts its panel, and its speck run if Auto-build was on, and shows it again. Nothing in the project was changed.`);
}

// The ports of the panels running for `folder`, from their records in the home folder, read without changing them.
// 0756: speck serve leaves a project with one as it is.
export function panelPorts(folder, env) {
  const dir = panelsDir({ ...env, [BUILD_ENV]: undefined }); // your panels, even when a build asks
  let names = [];
  try { names = fs.readdirSync(dir).filter(n => /^\d{1,5}\.json$/.test(n)); } catch { return []; }
  const ports = [];
  for (const n of names) {
    let r = null;
    try { r = JSON.parse(fs.readFileSync(path.join(dir, n), 'utf8')); } catch { continue; }
    if (!r || !Number.isInteger(r.pid) || r.pid <= 0 || !Number.isInteger(r.port) || typeof r.repo !== 'string') continue;
    let repo = r.repo;
    try { repo = fs.realpathSync(repo); } catch { /* gone */ }
    if (repo === folder && pidAlive(r.pid)) ports.push(r.port);
  }
  return ports.sort((a, b) => a - b);
}

function versionOf(folder) {
  try { return fs.readFileSync(path.join(folder, '.speck', 'VERSION'), 'utf8').trim() || null; } catch { return null; }
}

// Each listed project as { name, folder, off, missing, version, panel_ports, run }.
export function projectsState(env = process.env) {
  return projectEntries(env).map(({ folder, off }) => {
    const name = nameOf(folder);
    if (!fs.statSync(folder, { throwIfNoEntry: false })?.isDirectory()) return { name, folder, off, missing: true };
    return { name, folder, off, missing: false, version: versionOf(folder), panel_ports: panelPorts(folder, env), run: runState(path.join(folder, 'speck', '.cache', 'runs')).on };
  });
}

function listProjects(env) {
  const all = projectsState(env);
  if (!all.length) { console.log('No projects on your list yet. Add one with `speck projects add [<folder>]`.'); return; }
  console.log(`Your speck projects on this machine (${all.length}):`);
  for (const p of all) {
    const off = p.off ? ` · off: speck serve leaves it out (\`speck projects on ${p.name}\` turns it back on)` : ''; // 0762
    if (p.missing) { console.log(`  ${p.name}  ${p.folder}  missing: the folder isn't there any more (\`speck projects remove ${p.folder}\` takes it off the list)${off}`); continue; }
    const panel = p.panel_ports.length ? `panel running on port ${p.panel_ports.join(', ')}` : 'panel off';
    console.log(`  ${p.name}  ${p.folder}  speck ${p.version ? p.version : 'version unknown'} · ${panel} · speck run ${p.run ? 'running' : 'off'}${off}`);
  }
}

export function cmdProjects(args = []) {
  const [sub, ...rest] = args;
  const env = process.env;
  if (sub === undefined || sub === 'list') return listProjects(env);
  if (sub === 'add') return addProject(rest[0] ?? process.cwd(), env);
  if (sub === 'remove') return removeProject(rest[0], env);
  if (sub === 'off' || sub === 'on') return turnProject(rest[0], sub === 'off', env); // 0762
  throw new SpeckError(`Unknown projects command "${sub}". Use one of:\n  ${USAGE}`);
}

// 0538: the panel's star on a note in Capture. The one thing Capture may write: a `Starred: yes` line straight after
// the note's `Captured:` line, added to star it and taken out to unstar it, with no commit.
import fs from 'node:fs';
import path from 'node:path';
import { ideasDir, ideaStatus } from './core.mjs';

// A note's header: its lines before its first `## ` section, where its `Captured:` and `Starred:` lines are.
const headerEnd = lines => { const i = lines.findIndex(l => /^## /.test(l)); return i === -1 ? lines.length : i; };
const STARRED = /^Starred:/;

// Whether a note's text marks it starred: a `Starred: yes` line in its header, and no other value. As the panel's
// model reads it (templates/panel-model.js).
export function isStarred(text) {
  const lines = (typeof text === 'string' ? text : '').split('\n');
  return lines.slice(0, headerEnd(lines)).some(l => /^Starred:[ \t]*yes[ \t]*\r?$/.test(l));
}

// The note's text starred (`on`) or not: every `Starred:` line in its header taken out, then, to star it,
// `Starred: yes` put straight after its `Captured:` line, or after its title when it has none. Every other line stays
// as it was, so a note already as asked comes back unchanged.
export function starredText(text, on) {
  const lines = text.split('\n'), end = headerEnd(lines);
  const kept = [...lines.slice(0, end).filter(l => !STARRED.test(l)), ...lines.slice(end)];
  if (!on) return kept.join('\n');
  const head = kept.slice(0, headerEnd(kept));
  let after = head.findIndex(l => /^Captured:/.test(l));
  if (after === -1) after = head.findIndex(l => /^# /.test(l));
  const cr = after !== -1 && kept[after].endsWith('\r') ? '\r' : '';
  kept.splice(after + 1, 0, `Starred: yes${cr}`);
  return kept.join('\n');
}

// Stars (`on`) or unstars the note `name` in speck/ideas/, and returns { status, body } for the server to send. Refuses,
// changing nothing, a name that isn't a note's file there, a note that's gone, and one whose status isn't idea or inbox.
export function panelStarNote(repo, name, on) {
  const what = on ? 'starred' : 'unstarred';
  if (typeof name !== 'string' || !/^[^/\\]+\.md$/.test(name) || name.startsWith('.'))
    return { status: 400, body: { error: `"${name}" isn't a note's file name in speck/ideas/, so nothing was ${what}.` } };
  const rel = `speck/ideas/${name}`, file = path.join(ideasDir(repo), name);
  let text;
  try {
    if (!fs.lstatSync(file).isFile()) throw new Error('not a file');
    text = fs.readFileSync(file, 'utf8');
  } catch {
    return { status: 404, body: { error: `${rel} is gone, so it can't be ${what}. It may have been ticketed, dropped or renamed in chat.` } };
  }
  const status = ideaStatus(text);
  if (status !== 'idea' && status !== 'inbox')
    return { status: 409, body: { error: `${rel} is "${status || 'no status'}" now, not an idea or inbox note, so it can't be ${what} from here.` } };
  const next = starredText(text, on);
  if (next !== text) {
    try { fs.writeFileSync(file, next); } catch (e) { return { status: 500, body: { error: `Couldn't write ${rel}, so it wasn't ${what}: ${e.message}` } }; }
  }
  return { status: 200, body: { ok: true, path: rel, starred: on } };
}

// A ticket's lint: the errors that stop it being set ready, and the warnings worth a look.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { STATUSES, EFFORTS, TYPES, blank, contentLines, ticketType, ticketPriority, validPriority, modelFamily, ticketHeader, splitHeader, fmEnd, ticketRounds } from './core.mjs';

export function lintTicket(ticket, cfg) {
  const errors = [], warnings = [];
  const { fm, sections } = ticket;
  const L = cfg.limits;
  if (!fm.title) errors.push('Title is empty.');
  else if (/\band\b|&|\+/i.test(fm.title)) warnings.push(`Title "${fm.title}" may join two outcomes. Split it unless it's genuinely one outcome.`);
  if (!['S', 'M', 'L'].includes(fm.size)) errors.push(`size must be S or M (got "${fm.size}").`);
  if (fm.size === 'L') errors.push('size L can never be ready: split it into sibling tickets.');
  if (!['low', 'high'].includes(fm.risk)) errors.push(`risk must be low or high (got "${fm.risk}").`);
  if (ticketType(ticket) !== null && !TYPES.includes(fm.type)) errors.push(`type must be blank, bug or fix (got "${fm.type}").`);
  if (!validPriority(ticketPriority(ticket), fm.type))
    errors.push(fm.priority === 0
      ? 'priority must be blank or a whole number from 1 to 5 (got 0): priority 0 is only for a fix ticket.'
      : `priority must be blank or a whole number from 1 to 5, or 0 on a fix ticket (got ${JSON.stringify(fm.priority)}).`);
  if (!STATUSES.includes(fm.status)) errors.push(`status must be one of ${STATUSES.join(', ')}.`);
  if (fm.builder && modelFamily(fm.builder) === modelFamily(fm.reviewer) && !cfg.allow_same_model_review)
    errors.push(fm.builder === fm.reviewer
      ? `builder and reviewer are both "${fm.builder}". Use a different reviewer or set allow_same_model_review: true.`
      : `builder "${fm.builder}" and reviewer "${fm.reviewer}" are the same model. Use a different reviewer or set allow_same_model_review: true.`);
  const top = splitHeader(ticket.raw.slice(fmEnd(ticket.raw)));
  const [wantHeading, , wantStatus] = ticketHeader(fm).split('\n');
  if (!top.heading) warnings.push(`No \`${wantHeading}\` heading at the top. Run \`speck init\` again to add it.`);
  else if (top.heading !== wantHeading) warnings.push(`The heading "${top.heading}" doesn't match the frontmatter title. Run \`speck init\` again to fix it.`);
  if (!top.status) warnings.push(`No \`${wantStatus}\` status line under the heading. Run \`speck init\` again to add it.`);
  else if (top.status !== wantStatus) warnings.push(`The status line "${top.status}" doesn't match the frontmatter status. Run \`speck init\` again to fix it.`);
  for (const [where, v] of [['ticket', fm.reviewer_effort], ['config', cfg.reviewer_effort]])
    if (!blank(v) && !EFFORTS.includes(String(v).trim())) errors.push(`reviewer_effort "${v}" in ${where} must be blank or one of ${EFFORTS.join(', ')}.`);
  errors.push(...ticketRounds(ticket.raw).errors);
  for (const s of ['problem', 'outcome']) if (!contentLines(sections[s]).length) errors.push(`"${s}" section is empty.`);
  const ac = contentLines(sections['acceptance criteria']).filter(l => /^\d+\.\s+\S/.test(l));
  if (ac.length === 0) errors.push('No numbered acceptance criteria.');
  if (ac.length > L.max_acceptance_criteria) errors.push(`${ac.length} acceptance criteria (max ${L.max_acceptance_criteria}). Split the ticket.`);
  wholeCriteria(sections['acceptance criteria']).forEach((c, i) => { if (asksWholeSuite(c)) warnings.push(`Criterion ${i + 1} asks for the whole test suite to pass ("${c}"). That can't be met when the base branch is already broken. Write "no test that passed before this change fails" instead.`); });
  if (!contentLines(sections['out of scope']).filter(l => l !== '-').length) warnings.push('"Out of scope" is empty. Say what this ticket will not do.');
  const body = ['problem', 'outcome', 'acceptance criteria', 'out of scope', 'notes']
    .reduce((n, s) => n + contentLines(sections[s]).length, 0);
  if (body > L.max_ticket_body_lines) errors.push(`Ticket body is ${body} lines (max ${L.max_ticket_body_lines}). It's too big for one agent: split it.`);
  warnings.push(...homePathWarnings(ticket.raw));
  const priv = privateWordProblems(ticket.raw);
  errors.push(...priv.errors);
  warnings.push(...priv.warnings);
  return { errors, warnings, acceptanceCriteria: ac };
}

// Each numbered acceptance criterion with the lines it wraps onto, without its number.
function wholeCriteria(lines) {
  const out = [];
  for (const l of contentLines(lines)) {
    const m = l.match(/^\d+\.\s+(\S.*)$/);
    if (m) out.push(m[1]);
    else if (out.length) out[out.length - 1] += ' ' + l;
  }
  return out;
}

// A criterion asks for the whole suite to pass when it names the full, whole or entire (test) suite, or all tests,
// and says they pass. Quoted text only talks about such wording, so it doesn't count.
const WILL_PASS = String.raw`\s+(?:(?:still|must|should|will|shall|do|does|can|also|now|then|continues?\s+to|keeps?|are|is)\s+)*(?:pass|passes|passed|passing|green)\b`;
const WHOLE_SUITE = new RegExp(String.raw`\b(?:full|whole|entire)\s+(?:test\s+)?suite` + WILL_PASS, 'i');
const ALL_TESTS = new RegExp(String.raw`\ball\s+(?:of\s+)?(?:the\s+)?(?:existing\s+)?tests` + WILL_PASS, 'i');
function asksWholeSuite(criterion) {
  criterion = criterion.replace(/"[^"]*"|“[^”]*”|`[^`]*`/g, '');
  return WHOLE_SUITE.test(criterion) || ALL_TESTS.test(criterion);
}

// Tickets are committed and often published, so warn about each line holding the user's home folder path, which
// usually contains their username. The path must stand on its own: not inside a longer path (/mnt/home/ann) or a
// longer name (/home/ann2). A home folder that can't be found, isn't absolute or is the root checks nothing.
function homePathWarnings(text) {
  let home = '';
  try { home = os.homedir(); } catch { /* no home folder */ }
  home = (home || '').replace(/[\\/]+$/, '');
  if (!home || !path.isAbsolute(home)) return [];
  const esc = home.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const name = '[\\p{L}\\p{N}\\p{M}_-]'; // a character that could continue a folder name, in any script
  const re = new RegExp(`(?<!${name}|\\.)${esc}(?!${name}|\\.${name})`, 'u');
  return text.split('\n').flatMap((l, i) => re.test(l)
    ? [`Line ${i + 1} contains your home folder's path (${home}). Write it as a \`~/\` path instead, so it doesn't publish your username.`]
    : []);
}

// Words the user keeps out of the repo, such as their real name, one per line in ~/.config/speck/private-words
// (blank lines and # lines skipped). Each line of the ticket holding one, in any case and matched literally, is an
// error that names the line but not the word. A missing file checks nothing; one that can't be read is a warning.
function privateWordProblems(text) {
  let home = '';
  try { home = os.homedir(); } catch { /* no home folder */ }
  if (!home) return { errors: [], warnings: [] };
  let list;
  try { list = fs.readFileSync(path.join(home, '.config', 'speck', 'private-words'), 'utf8'); }
  catch (e) {
    if (e.code === 'ENOENT' || e.code === 'ENOTDIR') return { errors: [], warnings: [] };
    return { errors: [], warnings: [`Can't read ~/.config/speck/private-words (${e.code || e.message}), so this ticket wasn't checked for your private words. Make it a readable file, or remove it to skip the check.`] };
  }
  const words = list.split('\n').map(l => l.trim().toLowerCase()).filter(l => l && !l.startsWith('#'));
  if (!words.length) return { errors: [], warnings: [] };
  const errors = text.split('\n').flatMap((l, i) => words.some(w => l.toLowerCase().includes(w))
    ? [`Line ${i + 1} contains one of your private words (from ~/.config/speck/private-words). Take it out before setting the ticket ready.`]
    : []);
  return { errors, warnings: [] };
}

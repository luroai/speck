// 0636: speck checking a build's question in the running app. A build that wants something checked in the app blocks
// with a `Check in the app: <what to look at>` line among its question's facts (question-facts.mjs). With watch fix or
// decide and commands.start set, speck run starts its watch agent for each low-risk ticket blocked on one, once per
// question, with a brief to start the app, sign in when it needs to, keep a screenshot of each thing it checks, stop the
// app and then go with the recommendation or ask you. Such a question is never taken unchecked: otherwise it waits for you.
// 0638: with commands.start blank too, with a brief to first work out how to start the app and try it with speck app --start.
import crypto from 'node:crypto';
import { fixingOf, speckActs, checksInApp } from './foreman.mjs';
import { contentLines } from './core.mjs';
import { questionFacts } from './question-facts.mjs';

const CLI = 'node .speck/scripts/speck.mjs';
// What a check run may do: go with the build's recommendation, or ask you.
export const CHECK_ACTIONS = Object.freeze(['decide', 'ask']);

export const appStartSet = cfg => String(cfg?.commands?.start ?? '').trim() !== '';
// Whether speck run checks this board ticket's question in the app with settings `cfg`.
export const appCheckable = (cfg, t) => !!cfg && speckActs(fixingOf(cfg)) && checksInApp(t) && t.status === 'blocked' && t.risk === 'low';
// The question as checked, so each is checked once: its text, what to check and the recommendation.
export const checkKey = t => crypto.createHash('sha256').update(JSON.stringify([t.blocked_question ?? '', t.blocked_check_in_app ?? '', t.blocked_recommendation ?? ''])).digest('hex').slice(0, 16);
// The agent's queue entry for it, with what its brief needs.
export const checkItem = (t, log) => ({ id: String(t.id), key: checkKey(t), what: `its build is blocked on a question to check in the app: ${t.blocked_check_in_app}`, log,
  check: { question: t.blocked_question ?? '', line: t.blocked_check_in_app, recommendation: t.blocked_recommendation ?? '' } });
// The check a running agent's record holds, or null when it isn't checking in the app.
export const checkOf = running => (running && running.check && typeof running.check === 'object' && typeof running.check.line === 'string' ? running.check : null);

// Why a check run's action can't stand for parsed ticket `t` now, or '' when it can: the ticket must still be blocked on
// the very question the agent was started to check, so what it saw is never taken for a question asked since.
export function checkStale(t, running) {
  if (t.fm.status !== 'blocked') return `Ticket ${t.fm.id} is ${t.fm.status} now, no longer blocked on the question you checked`;
  const f = questionFacts(contentLines(t.sections['blocked question']));
  const now = checkKey({ blocked_question: f.question || null, blocked_check_in_app: f.checkInApp ?? null, blocked_recommendation: f.recommendation });
  return now === running.key ? '' : `Ticket ${t.fm.id}'s question has changed since you were started to check it`;
}

// How to work out how to start the app, as the brief's first steps, when commands.start is blank (0638).
const workOutStart = id => [
  `1. speck doesn't know how to start this app yet: commands.start in speck/config.yml is blank. First work out from the project (its README, its package or build files and its scripts) how to start its app on a given port, and try it with \`${CLI} app ${id} --start "<command>"\`, writing {port} where the port goes, adding \`--url "<address>"\` when it answers at an address other than app_url's (http://127.0.0.1:{port}/ unless it's set). It prints the address to open once the app answers, and speck saves that command as how to start the app. When one fails, it prints the last lines the app wrote: try the next likeliest command.`,
  `   When nothing you try answers, don't check anything: ask with \`${CLI} watch ask ${id} "<how do I start the app?>" --saw="..." --why="..."\`, naming in the question each command you tried and the last lines it wrote.`,
];

// The brief for checking ticket `id`'s question in the app, with `watch` fix or decide. `skill` is the skill's path.
// 0638: `startSet` false when commands.start is blank.
export function checkBrief({ id, check, skill, watch, startSet = true }) {
  const rec = String(check.recommendation || '').trim(), dec = `- ${CLI} watch decide ${id} "${rec}" --saw="..." --why="..."`;
  return [
    `You are speck, watching the pipeline. Ticket ${id}'s build is blocked on a question it wants checked in the running app, and speck run asked you to check it yourself, as watch is ${watch}.`,
    `The question: ${check.question || '(no question text)'}`,
    `Check in the app: ${check.line}`,
    `The build recommends: ${rec || '(nothing)'}`,
    '',
    `Follow the speck-watch skill (${skill}), and what it says about checking in the app:`,
    ...(startSet ? [`1. Start the app with \`${CLI} app ${id}\`, which prints the address to open.`] : workOutStart(id)),
    `2. Open it in a real browser, such as headless Chromium or a browser tool your session has. When it needs you to sign in, \`${CLI} logins\` lists the saved logins and \`${CLI} logins show <name>\` prints one's username and password: type them only into the app, never anywhere else.`,
    `3. Keep a screenshot of each thing you checked with \`${CLI} picture ${id} <file> "<what it shows>"\`, which shows it in the ticket's review pack. Save screenshots under /tmp, never in the repo.`,
    `4. Stop the app with \`${CLI} app ${id} --stop\`.`,
    '5. Then do exactly one of these, with --saw saying what you checked and saw, and --why why, each in a sentence:',
    ...(!rec ? [] : watch === 'decide' ? [`${dec}   when what you saw agrees with the recommendation: speck goes with it and resumes the build`]
      : [`${dec}   only when the check clearly passes: speck goes with the recommendation and resumes the build`]),
    `- ${CLI} watch ask ${id} "<one question for the user>" --saw="..." --why="..."   ${rec ? 'otherwise' : 'as the build recommends nothing'}, saying what you saw`,
    'Never set a ticket ready, approve work, ship anything yourself, merge, push or change any code or file in the repo by hand.',
  ].join('\n');
}

// What a check run's line in the Notes adds: what it checked and what it saw.
export const checkedSays = (line, saw) => ` Checked in the app: ${String(line).replace(/\.$/, '')}. Saw: ${String(saw).replace(/\.$/, '')}.`;

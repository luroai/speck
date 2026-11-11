// 0636: speck checking a build's question in the running app. A build that wants something checked in the app blocks
// with a `Check in the app: <what to look at>` line among its question's facts (question-facts.mjs). With watch fix or
// decide and commands.start set, speck run starts its watch agent for each low-risk ticket blocked on one, once per
// question, with a brief to start the app, sign in when it needs to, keep a screenshot of each thing it checks, stop the
// app and then go with the recommendation or ask you. Such a question is never taken unchecked: otherwise it waits for you.
import crypto from 'node:crypto';
import { fixingOf, speckActs, checksInApp } from './foreman.mjs';

const CLI = 'node .speck/scripts/speck.mjs';
// What a check run may do: go with the build's recommendation, or ask you.
export const CHECK_ACTIONS = Object.freeze(['decide', 'ask']);

export const appStartSet = cfg => String(cfg?.commands?.start ?? '').trim() !== '';
// Whether speck run checks this board ticket's question in the app with settings `cfg`.
export const appCheckable = (cfg, t) => !!cfg && speckActs(fixingOf(cfg)) && appStartSet(cfg) && checksInApp(t) && t.status === 'blocked' && t.risk === 'low';
// The question as checked, so each is checked once: its text, what to check and the recommendation.
export const checkKey = t => crypto.createHash('sha256').update(JSON.stringify([t.blocked_question ?? '', t.blocked_check_in_app ?? '', t.blocked_recommendation ?? ''])).digest('hex').slice(0, 16);
// The agent's queue entry for it, with what its brief needs.
export const checkItem = (t, log) => ({ id: String(t.id), key: checkKey(t), what: `its build is blocked on a question to check in the app: ${t.blocked_check_in_app}`, log,
  check: { question: t.blocked_question ?? '', line: t.blocked_check_in_app, recommendation: t.blocked_recommendation ?? '' } });
// The check a running agent's record holds, or null when it isn't checking in the app.
export const checkOf = running => (running && running.check && typeof running.check === 'object' && typeof running.check.line === 'string' ? running.check : null);

// The brief for checking ticket `id`'s question in the app, with `watch` fix or decide. `skill` is the skill's path.
export function checkBrief({ id, check, skill, watch }) {
  const rec = String(check.recommendation || '').trim(), dec = `- ${CLI} watch decide ${id} "${rec}" --saw="..." --why="..."`;
  return [
    `You are speck, watching the pipeline. Ticket ${id}'s build is blocked on a question it wants checked in the running app, and speck run asked you to check it yourself, as watch is ${watch}.`,
    `The question: ${check.question || '(no question text)'}`,
    `Check in the app: ${check.line}`,
    `The build recommends: ${rec || '(nothing)'}`,
    '',
    `Follow the speck-watch skill (${skill}), and what it says about checking in the app:`,
    `1. Start the app with \`${CLI} app ${id}\`, which prints the address to open.`,
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

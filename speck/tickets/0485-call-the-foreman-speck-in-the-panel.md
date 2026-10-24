---
id: "0485"
title: "Call the Foreman speck in the panel"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0484"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-24T19:09:01.422Z"

---
# 0485 · Call the Foreman speck in the panel

**Status:** 🔨 building

## Problem
The panel talks about "the Foreman" as if it were a second character, while the one thing watching the pipeline is speck, on its screen. Two names for one watcher make the panel harder to follow.

## Outcome
The panel calls the watcher speck everywhere, and the word "Foreman" never shows.

## Acceptance criteria
1. With a board that has every state that names the Foreman today (a blocked ticket it will take the recommendation for, a question it asks you, a recommendation it went with, a ticket it's looking into), no text, tooltip, accessible name or confirm dialog anywhere in the panel (header, Plan, Build, Shipped, an open ticket, the Pipeline log pop-up's own labels, Settings and Your agents) contains "Foreman", in any case. Excepted: lines from `speck run`'s log (0486), and the setting names `foreman_fixing`, `foreman`, `foreman_model` and `foreman_effort` (0487).
2. The wording is: `speck will answer` (a closed card), `Blocked · speck will take its recommendation`, `speck will take its recommendation: <option>`, `speck asks you: <question>`, `Your answer to speck`, `Dismiss speck's question?`, and `speck went with the recommendation: <option> · <time>`.
3. The screen's accessible name is `speck's screen`, and its tooltip starts `speck: ` before the status word where it said `The Foreman: `.
4. In Settings, the group with the `speck run` switch is titled `Watching`, and the role beside Builder and Reviewer is called `speck`, in its list, its rows and Your agents' roles. Everything works as before, and no test that passed before this change fails.

## Out of scope
- `speck run`'s messages and log lines, and the commands (0486).
- The setting names and their explanations (0487).
- Names inside the code, such as `#foreman`, `renderForeman` and the board's `by: 'foreman'`, which no one sees.

## Notes
- Asked for by the user on 2026-10-24: "we need to remove the concept of a foreman now, as we have a single speck watching." The user agreed to call it speck, the settings `watch`, `watch_agent`, `watch_model` and `watch_effort`, and the Settings group Watching.
- Today: `templates/panel.html` (`aria-label="The Foreman"`), `templates/panel-header.js` (`The Foreman: ${word}`), `templates/panel-model.js` (the `SHORT` words), `templates/panel.js` (the blocked question, answer and dismiss texts, and the role's name), `templates/panel-settings.js` (the group's title and `ROLES`), and `rolesUsing` in `scripts/your-agents.mjs`, which names the role for Your agents.
- Failing before this build: none
- Waits for 0484, which changes the closed Build card's status line, where `Foreman will answer` shows.
- Self-check: "choose the speck's model again" read badly once the role is named speck, so that line now says "choose speck's model again".
- Pictures: Settings' Watching group in both looks. The Build cards' new wording needs a blocked ticket speck will answer, which the real board doesn't have now, so 0485's tests check it on the fake page.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

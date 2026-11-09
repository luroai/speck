---
id: "0576"
title: "Call speck by the name you chose wherever it speaks"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0575"]                # ticket ids that must be done first
created: 2026-11-09
started: "2026-11-09T18:03:21.956Z"
approved: "2026-11-09T18:23:26.753Z"

---
# 0576 · Call speck by the name you chose wherever it speaks

**Status:** 👍 approved

## Problem
Once you've named your engineering manager (0575), speck should call it by that name wherever it speaks or acts, or the name means nothing. Today `speck status`, the panel and `speck run`'s log all say "speck asked you…", "speck will take its recommendation…" and "speck will look into it…".

## Outcome
Wherever the engineering manager speaks or acts, speck uses the name you gave it; everywhere speck means the tool, it still says speck.

## Acceptance criteria
1. With `speck_name` set to `Virgil`, `speck status` says `Virgil` where it says `speck` today for the engineering manager's questions, what it's looking into, its actions and the recommendations it took, will take or took in the last 7 days; with `speck_name` unset, it says `speck` as today.
2. The panel does the same wherever the engineering manager speaks or acts: a blocked ticket's card when it will take the recommendation, its questions with their Answer and Dismiss buttons, the line saying who went with a recommendation, the Decided for you list, and the status words for a ticket it's looking into.
3. `speck run`'s log uses the name in its lines about the engineering manager, such as `0412: Virgil will look into it, as watch is decide: …`.
4. Where speck means the tool, it still says speck: its commands, `speck run`, the panel's title and the Notes lines speck writes into tickets, which keep `(chosen by speck, …)` so earlier and later tickets are read the same way.
5. No test that passed before this change fails.

## Out of scope
- The setting itself and the role's description (0575).
- Renaming speck the tool or its commands.

## Notes
- Asked for 2026-11-09: speck is the character, your engineering manager, and you can call it whatever you like, as you can name your agents in other tools (the user's is Virgil). Its role goes in the Settings view's explanation and the docs. Builders and reviewers stay swappable underneath; your own agent (Claude, Cursor or another) stays the one you talk to.
- Today the engineering manager speaks as speck in, among others: `scripts/foreman-agent.mjs` ("speck will look into it"), `scripts/foreman-took.mjs` ("speck will take its recommendation" and the 7-day list), `scripts/split-off.mjs`, `templates/panel-model.js` ("Blocked · speck will take its recommendation", "speck will answer") and `templates/panel.js`. The Notes lines are parsed by `wentWithLines` and `choseOnce`, which is why they keep `speck`.
- Waits for 0575, which adds `speck_name`.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: no changes

## In plain words
Once you've named your engineering manager in Settings, speck uses that name wherever the manager speaks or acts: on a blocked ticket's card, in its questions to you, in the Decided for you line, in `speck status` and in `speck run`'s log. Everything that means the tool itself, such as its commands and the panel's title, still says speck, and so do the notes speck writes into tickets.

To see it, set a name in Settings, then look at a blocked ticket that the manager will answer: its card says, for example, "Virgil will answer".

On a phone-width card, the short status can be cut off, as "Virgil will a…". Hold or hover over it for the whole sentence.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.
Round 2 (codex, merge round): approve.

## Delivery log
- Review rounds: 2, 1 of them a merge round
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 444,808
- Elapsed since build started: 20 min
- Changed lines: 158 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

Follow-ups (known limits, none needing its own ticket):
- The status word still says speck: `SPECK: Idle` at the top of `speck status` and the `speck: Idle` tooltip on the panel's screen. The criteria don't list them.
- The briefs and resume messages sent to agents still say speck, as nobody reads them as the manager speaking.
- The Now cell on a phone-width card cuts off "<name> will answer", with the full sentence as its tooltip.

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · approve</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "0457c673b7da7e7c3b98fa09fb973e677a34de35",
    "session": "fresh",
    "thread_id": "01a1c186-f962-75b3-9cbc-ee36f5f391d8",
    "builder_response": "- Tests run: `speck test --related test/speck-name-0576.test.mjs` (the ticket's own file, every existing test file that names a changed file, and commands.checks): 1626 tests, 1623 pass, 0 fail, 3 skipped.\n- Scope notes for the reviewer: briefs and resume messages sent to agents (\"You are speck...\", \"speck looked into why...\") are unchanged, as they aren't what the user reads. The status word `SPECK: Idle` and the panel header's `speck: Idle` tooltip are unchanged: AC1 and AC2 don't list them. Notes lines in tickets keep speck (AC4).\n- Pictures of the named panel are kept with `speck picture`.\n",
    "seconds": 38,
    "usage": {
      "input_tokens": 270350,
      "cached_input_tokens": 207104,
      "cache_write_input_tokens": 0,
      "output_tokens": 1009,
      "reasoning_output_tokens": 93
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 63246,
      "cached": 207104,
      "write": 0,
      "output": 1009
    },
    "cost_usd": 0.1572924,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-09T18:17:28.915Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/speck.mjs cmdStatus passes speckNameOf(cfg) into the status renderers. foremanLines, foremanTicketLines and agentView use it for questions, actions and recommendations. AC1 tests, including a real CLI invocation and unset-name fallback, passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "panel.mjs supplies foreman.name; panel.js, panel-model.js and panel-popups.js use speckCalled() for cards, questions, recommendation attribution and the seven-day list. Passing AC2 tests exercise rendering, dismiss confirmation, renaming an existing card and the real panel API."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "foremanAgentQueue, foremanFixQueue and goWithQueue use the configured name in their log messages. Passing AC3 tests exercise queueing, launching, actions, fallback naming, recommendations and resumption."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Commands and the panel title retain speck. Ticket note generation retains its established speck attribution. Both AC4 tests passed, including parsing a named manager's choice back as a foreman decision."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0576-tests.txt: 1626 tests, 1623 passed, zero failed and three skipped. Existing tests were not weakened or modified."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The chosen name now appears in the manager’s status messages, panel questions, recommendations and run logs. Commands, the panel title and ticket records retain speck. The tests exercise the changed behaviour and report no failures; no blocking concerns found."
  }
}
```

</details>

<details><summary>Round 2 · codex · approve · merge round</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "edccbf4c36db9795d46fff7cacf183b25e337bd0",
    "merge": true,
    "session": "continued",
    "thread_id": "01a1c186-f962-75b3-9cbc-ee36f5f391d8",
    "builder_response": "- Merge of main into the ticket branch. Resolved files:\n  - scripts/panel.mjs (class: logic, 1 conflict): main (0595) changed the `boards = boardVersions()` line to also declare `SUMMARY`; this ticket added `nameNow` to the line above it. Kept both: this ticket's `fixingNow`/`baseNow`/`nameNow` line and main's `const SUMMARY = Symbol('summary'), boards = boardVersions(), stateOf = out => {`. Nothing else changed.\n- Checked main's new code (scripts/panel-summary.mjs and the rest of its diff under scripts/ and templates/) for new places where the engineering manager speaks: none.\n- Tests run: test/speck-name-0576.test.mjs, with the commands.checks files that `speck test --files` adds.\n",
    "seconds": 18,
    "usage": {
      "input_tokens": 443393,
      "cached_input_tokens": 355072,
      "cache_write_input_tokens": 0,
      "output_tokens": 1415,
      "reasoning_output_tokens": 93
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 25075,
      "cached": 147968,
      "write": 0,
      "output": 406
    },
    "cost_usd": 0.0690068,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-09T18:23:22.411Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "cmdStatus still passes speckNameOf(cfg) to foremanView, agentView and foremanTicketLines. All AC1 tests passed, including the real CLI and unset-name fallback."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The merged panel.mjs retains nameNow and passes the name to both view functions. Panel renderers retain named cards, questions and recommendation messages. All AC2 tests passed, including the real panel API and redraw after renaming."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "foremanAgentQueue, foremanFixQueue and goWithQueue retain configured names in manager log messages. All AC3 tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Commands, panel title and persistent ticket attribution retain speck. Both AC4 tests passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified fresh test output: 130 tests, 127 passed, zero failed, three skipped. The panel conflict resolution preserves main's SUMMARY declaration, summary callback and response handling alongside the naming changes."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The merge preserves both the chosen manager name and main’s new project summary handling. All ticket tests pass, with no new concerns. Approved."
  }
}
```

</details>

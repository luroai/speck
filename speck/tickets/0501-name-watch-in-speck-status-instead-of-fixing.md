---
id: "0501"
title: "Name watch in speck status instead of Fixing"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-24-name-watch-in-speck-status-s-fixing-line.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-25
started: "2026-10-25T12:40:34.799Z"
approved: "2026-10-25T12:42:50.559Z"

---
# 0501 · Name watch in speck status instead of Fixing

**Status:** 👍 approved

## Problem
`speck status` still prints `· Fixing on` after the Foreman's word and a `Fixing: fix. …` line when `watch` is `fix`. Since 0487 the setting is called `watch`, and nothing else calls it Fixing, so someone reading `speck status` can't tell which setting the line is about. It's the last of the old names in what speck prints.

## Outcome
`speck status` names the `watch` setting where it said Fixing.

## Acceptance criteria
1. With `watch: fix`, `speck status`'s first line is `SPECK: <word> · watch: fix`, and the line under it is `  watch: fix. ` followed by what `fix` does, as it says today.
2. With `watch: tell` or `watch: off`, the first line is `SPECK: <word>` with nothing after it, as today.
3. `speck status` prints `Fixing` nowhere. The panel's `Fixing` stage word for a build fixing review findings doesn't change. No test that passed before this change fails.

## Out of scope
- `speck status --json`, and what each value of `watch` does.

## Notes
- From the inbox note, raised while building 0487.
- Today: the lines in `scripts/foreman.mjs` (`FIXING_SAYS`, and the status lines near its 0317 comment). Tests that match `Fixing` in status output: `test/foreman-0317.test.mjs`, `test/pipeline-0458.test.mjs`.
- Asked for by the user on 2026-10-25, before releasing 0.15.0.
- Failing before this build: not checked
- Self-check: no changes (an unknown watch value is read as tell, so it shows the word alone; old release notes and the changelog keep Fixing as history).
- Pictures: none, because nothing in the panel changes; only the `speck status` text does.

## In plain words
When the watch setting is on fix, speck's status now says "watch: fix" on its first line and starts the line under it with "watch:", instead of the old name, Fixing. To see it, set watch to fix and run speck status. Nothing else changes: with watch on tell or off the first line is just the status word, and the panel still says Fixing for a build that's fixing review findings.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 119,762
- Elapsed since build started: 2 min
- Changed lines: 5 (limit 5000)
Follow-ups: none. Old release notes and the changelog still say Fixing, as history.

<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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
    "reviewed_sha": "1d8de501e4000bb78d51b2d20652e771dc379c4a",
    "session": "fresh",
    "thread_id": "01a17315-31c7-7b71-b3b0-2b62d25b9b24",
    "builder_response": "- Tests run: `speck test --related test/status-0501.test.mjs test/foreman-0317.test.mjs` (the ticket's own file, the changed 0317 file, and every test file naming scripts/foreman.mjs, with the repo checks).\n- Changed `foremanLines` in scripts/foreman.mjs to print `· watch: fix` and `  watch: <FIXING_SAYS.fix>`; updated the two 0317 assertions that matched the old \"Fixing on\" wording, since the ticket changes that output.\n- Old release notes and the changelog still say \"Fixing\" as history; left alone.\n",
    "seconds": 33,
    "usage": {
      "input_tokens": 119117,
      "cached_input_tokens": 84224,
      "cache_write_input_tokens": 0,
      "output_tokens": 645,
      "reasoning_output_tokens": 11
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-25T12:42:44.192Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/foreman.mjs: foremanLines prints the requested first two lines and retains FIXING_SAYS.fix unchanged. Passing test ‘0501 AC1’ checks both lines."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "foremanLines adds the suffix only for fix. Passing test ‘0501 AC2’ checks tell and off both display ‘SPECK: Idle’ alone."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing test ‘0501 AC3’ checks generated lines and actual status output for the absence of Fixing. templates/panel-model.js retains its Fixing stage unchanged. The recorded related run reports 298 passed, 3 skipped and no failures; the production change only alters the two status labels."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Status now names watch: fix and keeps the existing explanation. Tell and off retain their current display, and the panel’s Fixing stage is unchanged. The relevant tests pass. No blocking concerns found."
  }
}
```

</details>

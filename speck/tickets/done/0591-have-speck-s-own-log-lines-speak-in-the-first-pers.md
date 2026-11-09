---
id: "0591"
title: "Have speck's own log lines speak in the first person"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0576"]                # ticket ids that must be done first
created: 2026-11-09
started: "2026-11-09T18:30:56.036Z"
approved: "2026-11-09T18:37:31.862Z"
finished: "2026-11-09T18:42:16.735Z"

---
# 0591 · Have speck's own log lines speak in the first person

**Status:** ✅ done

## Problem
In the redesign, speck speaks in the first person wherever its face appears, the Pipeline log included. Today `speck run`'s log speaks about speck in the third person, and the panel can't tell speck's own lines from the tool's.

## Outcome
`speck run`'s log gives the engineering manager's own lines in the first person, marked so the panel can tell them apart.

## Acceptance criteria
1. `speck run` writes the engineering manager's own lines in the first person, for example "0412: I'll look into it, as watch is decide: …" and "0561: I went with the recommendation: …".
2. Its lines about the tool's own work stay as they are, such as "Started 0554: speck build 0554" and "Shipped 0550.".
3. The panel can tell each line in the log that is the engineering manager's from the rest.
4. `speck status` still names the engineering manager by its chosen name (0576).
5. No test that passed before this change fails.

## Out of scope
- How the log looks (0592).

## Notes
- The design is the mock agreed with the user on 2026-11-08 and 9 (a private claude.ai design canvas, "speck panel, grown up": Lanes, Decided for you, a ticket waiting at Ship, Pipeline log, each light and dark, the bridge, and the Character page). The user picked the Premium screen for speck and asked for these tickets for 1.0.0 on 2026-11-09.
- Lines today: `scripts/foreman-agent.mjs` ("speck will look into it"), `scripts/go-with.mjs`, `scripts/foreman-fix.mjs`, `scripts/split-off.mjs`; the panel reads them with `runLogLine` in `templates/panel-model.js`. Waits for 0576, which changes the same lines.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: a tool line can't be taken for the manager's, as only the mark counts and a test feeds first-person words without it; a `runLogLine` result gains `speck` only on a marked line, so what it returns for the tool's lines is unchanged.
- Pictures: none, because the look of the log doesn't change here (0592 does that); only the words of the manager's lines do.

## In plain words
When speck run's log reports something your engineering manager did, it now says it in the first person: "I'll look into it", "I went with the recommendation". Lines about the tool's own work, such as a build starting or a ticket shipping, read as before. To see it, open the Pipeline log after the manager has looked into a ticket. The panel now knows which lines are the manager's, though they look the same until the Pipeline log is redesigned. In a terminal those lines start with a small » mark. Lines written before this change stay as they were.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 198,014
- Elapsed since build started: 7 min
- Changed lines: 68 (limit 5000)
- Existing tests changed to the new wording, as AC1 requires, at the same strictness: speck-name-0576, foreman-fix-0286, long-build-0569, foreman-provider-0392, watch-0486, foreman-once-0566.
- Known limit: a refusal goWith gives keeps the manager's name in its reason, so a log line can read "I didn't take its recommendation: Virgil has already gone with a recommendation…". The same text also serves the panel's errors, so it was left.
- Follow-ups: none for the inbox.

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
    "reviewed_sha": "a11bb156637081b5d077b72230e7eaefaad59b41",
    "session": "fresh",
    "thread_id": "01a1c199-487f-7a72-8fe6-4643bc11c312",
    "builder_response": "- Tests run: test/first-person-0591.test.mjs test/speck-name-0576.test.mjs test/foreman-fix-0286.test.mjs test/long-build-0569.test.mjs test/foreman-provider-0392.test.mjs test/watch-0486.test.mjs test/foreman-once-0566.test.mjs test/watch-decide-0567.test.mjs test/pipeline-0459.test.mjs, with --related (it also ran every test file naming a changed file).\n- AC5 and existing tests: AC1 changes the words of lines that six existing test files pinned. Those tests now expect the new lines, at the same strictness (exact strings stay exact, and foreman-once-0566's \"doesn't say it will\" check was moved to the new words so it can't pass vacuously). No assertion was removed. Files: speck-name-0576, foreman-fix-0286, long-build-0569, foreman-provider-0392, watch-0486, foreman-once-0566. I read AC5 as covering tests after that rewording, since AC1 can't hold otherwise; please say if you read it differently.\n- The mark: a manager's line starts with `» ` (speckSays in scripts/core.mjs), which runLogLine in templates/panel-model.js recognises, sets `speck: true` for and takes off the text. Only the mark counts, so first-person words on an unmarked line aren't the manager's.\n- A build running long under watch: tell stays an unmarked line: it names no one and isn't the manager acting.\n- split-off.mjs needs no change: its 0576 use of the name is a refusal message, not a log line.\n",
    "seconds": 29,
    "usage": {
      "input_tokens": 197307,
      "cached_input_tokens": 141184,
      "cache_write_input_tokens": 0,
      "output_tokens": 707,
      "reasoning_output_tokens": 56
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 56123,
      "cached": 141184,
      "write": 0,
      "output": 707
    },
    "cost_usd": 0.1334344,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-09T18:37:19.633Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "foremanAgentQueue, foremanFixQueue and goWithQueue emit marked first-person manager messages. Passing 0591 AC1 tests exercise investigation, actions, failures and recommendation resumption."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Tool log producers remain unchanged. Passing 0591 AC2 tests cover unmarked user choices and watch:tell notices; AC2/AC3 checks existing tool summaries."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "templates/panel-model.js runLogLine recognises and removes the explicit marker, adding speck:true only for marked messages. Passing AC3 tests cover timed, untimed, empty and unmarked first-person input."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Status rendering is unchanged. Passing 0591 AC4 test exercises foremanView and foremanLines with the chosen name Virgil."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Recorded related-test output reports 879 passed, zero failed and three skipped. Existing assertions were updated for the required wording without removing their behavioural checks."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The manager now speaks in the first person, and the panel can distinguish its messages using an explicit marker. Tool messages and the chosen name in status remain intact. The relevant tests pass; no blocking concerns found."
  }
}
```

</details>

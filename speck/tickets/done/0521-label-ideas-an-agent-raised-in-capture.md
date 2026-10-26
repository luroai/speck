---
id: "0521"
title: "Label ideas an agent raised in Capture"                # one outcome, no "and"
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
after: ["0520"]                # ticket ids that must be done first
created: 2026-10-26
started: "2026-10-26T22:41:59.431Z"
approved: "2026-10-26T22:54:22.652Z"
finished: "2026-10-26T22:59:30.303Z"

---
# 0521 · Label ideas an agent raised in Capture

**Status:** ✅ done

## Problem
Both the user and agents put ideas in speck: the user by asking for one to be captured, and agents by raising follow-ups from builds on their own. In Capture (0520) they sit in one list, and the user can't tell at a glance which ideas are theirs and which an agent suggested.

## Outcome
Every idea an agent raised is labelled as an agent's in Capture.

## Acceptance criteria
1. Every new idea note says who raised it on a line of its own after its `Captured:` line: `Raised by: you` when the user asked for it to be captured, or `Raised by: agent` when an agent raised it itself, such as a build's follow-up. `/speck-capture` and `/speck-build` write it, and an agent capturing what the user asked for writes `you`.
2. In Capture, a note raised by an agent shows an `agent` tag on its closed card, in the style of a ticket's bug or task tag, with an explanation on hover or tap. A note raised by the user shows no tag.
3. A note with no `Raised by:` line counts as raised by an agent when it has a `From ticket:` line, and by the user otherwise, so notes captured before this change are labelled too.
4. The agent tag changes nothing else: Capture stays read-only (0520's criterion 3), and the notes stay newest first.
5. No test that passed before this change fails.

## Out of scope
- Naming which agent raised it (builder, reviewer or the watcher).
- Labels anywhere but Capture, such as on tickets made from an agent's idea.

## Notes
- Asked for 2026-10-26: "agents and myself are allowed to capture ideas. Agent ideas need a visual agent label."
- The label means the agent raised the idea, not that an agent wrote the file: the user's own ideas are written by an agent too, on their say-so.
- Today: build follow-ups have `Status: inbox` and a `From ticket:` line (`skills/speck-build/SKILL.md`, section 5 step 1); `/speck-capture` writes `Captured: <date> · Status: idea` (`skills/speck-capture/SKILL.md`). The panel reads notes through `scripts/idea-counts.mjs` and shows them with `noteItem` in `templates/panel.js`.
- After 0520, which makes the Capture lane this labels.
- Failing before this build: none
- Self-check: no changes
## In plain words
In the panel's Capture lane, an idea an agent came up with by itself, such as a follow-up from a build, now has a small blue "agent" label on its card. Your own ideas have no label. Hover over or tap the label to see what it means. Ideas saved before this change are labelled too: the ones that came from a build count as an agent's, and the rest count as yours. To see it, open Capture and look at the cards that say "From" a ticket. From now on, each new idea note says who raised it. When you ask an agent to capture something, the note says it's yours.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.
Round 2 (codex, merge round): approve.

## Delivery log
- Review rounds: 2, 1 of them a merge round
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 272,927
- Elapsed since build started: 12 min
- Changed lines: 22 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none.
- Note: in /speck-build's follow-up template, `Raised by: agent` sits after `From ticket:` so 0036's test (From ticket straight after the status line) keeps passing.

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
    "reviewed_sha": "a03450ee6beb1452fe5ad52f5cd9de94b5465035",
    "session": "fresh",
    "thread_id": "01a17a65-4407-74f0-bbcc-b4583af0cce8",
    "builder_response": "- Tests run: test/panel-0521.test.mjs test/followups-0036.test.mjs test/review-wait-0384.test.mjs, plus every test file `--related` brought in (550 tests, 0 failed).\n- AC1: in /speck-build's follow-up template, `Raised by: agent` goes after `From ticket:`, not straight after `Captured:`, so 0036's test (From ticket straight after the status line) still passes (AC5). It is still a line of its own after the Captured line.\n- 0384 AC3 failed once in the first --related run and passed on rerun with nothing changed: timing, unrelated to this change.\n- Pictures: four in the review pack, Capture in light and dark, with agent and user notes.\n",
    "seconds": 21,
    "usage": {
      "input_tokens": 93392,
      "cached_input_tokens": 56064,
      "cache_write_input_tokens": 0,
      "output_tokens": 700,
      "reasoning_output_tokens": 10
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-26T22:47:20.354Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "skills/speck-capture/SKILL.md specifies Raised by: you and explains when agent applies; skills/speck-build/SKILL.md adds Raised by: agent to follow-ups. Both AC1 tests passed and check the required note format."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel.js noteItem renders agentTag on closed agent cards. agentTag uses the existing explained helper for hover, tap and accessibility. The three AC2 tests passed, covering tagging, tap behaviour and shared tag styling."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "templates/panel-model.js raisedByAgent honours explicit agent/you values and otherwise falls back to fromTicket. Both AC3 tests passed, including legacy notes and explicit user attribution overriding From ticket."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The capture model retains its existing date sort; noteItem adds only an explanatory tag. The AC4 test passed, checking newest-first order, opening and closing cards, absence of editing controls and absence of write requests."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Reported related-test run: 550 tests, 547 passed, 3 skipped, 0 failed. Existing follow-up tests remain unchanged, and the reviewed diff shows no unrelated regression fix."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Capture now labels ideas raised by agents and explains the label on hover or tap. User ideas remain unlabelled, older notes are classified sensibly, and Capture remains read-only and newest first. The tests cover the change and pass. No blocking concerns found."
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
    "reviewed_sha": "383488de57269a23f810a47a894dbfae948be027",
    "merge": true,
    "session": "continued",
    "thread_id": "01a17a65-4407-74f0-bbcc-b4583af0cce8",
    "builder_response": "- Tests run: test/panel-0521.test.mjs test/panel-0161.test.mjs test/panel-0214.test.mjs test/panel-0435.test.mjs test/panel-0520.test.mjs (153 tests, 0 failed).\n- Handed back by speck ship: tests failed on the branch as it would land. main had nothing new to merge (`git merge main`: already up to date), so the failures came from this ticket's change.\n- 0161 AC1 (static and in a real browser): the agent tag used --inbox (#4c7f8c), 4.01:1 on --bg in the light look, under 0161's 7:1 for a tag rule without its own size. Fixed: `.tag.agent` now uses --run (#285372 light, #97b2cc dark), which passes both 0161 tests in light and dark.\n- 0214 AC4, 0435 AC2 and AC3: these read the card's whole second row (`.checks`) as text and expected only its date line, so the agent tag's word \"agent\" was appended to it (\"From 0139 · captured 9 Octagent\"). The tag stays in `.checks` because 0161 requires a tag on show to sit in `.checks` (as a ticket card's tags do) and 0435 AC5 requires the closed card to be two rows; I tried moving it out of `.checks` and both of those failed. So I narrowed the two older tests to leave out `.tag` children when reading the row: they still check the date line's exact text and that it is the row's only non-tag part. They predate this ticket's tag (AC2 adds a tag to that row by design), so I think the tests, not the code, needed the change. Please reject this if you disagree.\n",
    "seconds": 19,
    "usage": {
      "input_tokens": 177560,
      "cached_input_tokens": 133632,
      "cache_write_input_tokens": 0,
      "output_tokens": 1275,
      "reasoning_output_tokens": 10
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-26T22:54:18.991Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "The capture skill specifies Raised by: you for user requests and agent for independently raised ideas. The build skill includes Raised by: agent in follow-up notes. Both AC1 format tests passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "panel.js noteItem adds agentTag to closed agent cards using the existing explained helper for hover and tap. panel-base.css now uses --run for contrast. AC2 tests and the reported 0161 contrast checks passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "panel-model.js raisedByAgent honours explicit attribution and falls back to From ticket for older notes. Both AC3 tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Capture retains its date sorting and read-only behaviour. AC4 passed. Changes to panel-0214 and panel-0435 exclude tags from date-text assertions while retaining their expected text and card interaction checks."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The reported run covered all five relevant test files: 153 tests, 150 passed, 3 skipped, no failures. The contrast regression is fixed; older text assertions were appropriately adapted to the required new tag."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The agent labels work as requested, and their colour now passes the contrast checks. The adjusted older tests still check the date information while allowing the new label beside it. No blocking concerns remain."
  }
}
```

</details>

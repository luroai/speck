---
id: "0767"
title: "Show Virgil on the factory floor"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0765","0766"]                # ticket ids that must be done first
created: 2026-11-26
built_on: "0766"
started: "2026-11-26T20:32:22.248Z"
approved: "2026-11-26T20:48:43.414Z"
finished: "2026-11-26T20:58:01.898Z"

---
# 0767 · Show Virgil on the factory floor

**Status:** ✅ done

## Problem
The factory floor needs one place that says what needs you across every project. Virgil, the engineering manager, is the panel's character for that.

## Outcome
The factory floor has Virgil's dial: the manager drawn large in the pipeline's mood, how many things need you across all projects, and what each one is.

## Acceptance criteria
1. Beside the line, the floor shows Virgil drawn with `SpeckFace` as the manager, at 120 px or more, in the busiest mood among all projects, the same way All projects works it out, inside a dial of rings.
2. Under it, a large count of everything that needs you across all projects, and one line for each (its project, id and a few words on why), each opening that ticket in its project's panel at the same address.
3. With nothing needing you, the count is 0 and a line says nothing needs you.
4. No test that passed before this change fails.

## Out of scope
- Answering or shipping from the floor.

## Notes
- Design: mockup D, "Stations, instrument panel", on the user's private design canvas (2026-11-25/26): near-black ground with faint grid lines, one signal orange (#FF6A1F) for anything moving or needing you, green for shipped, small spaced-out monospace capitals for labels, big thin numbers, panels with corner-bracket marks. Use the fonts the panel already ships and no fonts from the network.
- Virgil's look is the panel's own drawing (`templates/speck-face.js`): the half-shine glass, the red visor, its moods; the floor uses it rather than a copy.
- Failing before this build: not checked
- Self-check: a line's focus key now includes why it needs you, so two needs on one ticket keep focus apart; dial errors clear on the next press.
- Pictures: the floor is dark only, so there's no light look to picture.

## In plain words
The factory floor now has Virgil, the engineering manager, beside the line: drawn large inside a ring dial, in the busiest mood of all your projects (asking when anything needs you, focused while work is moving). Under Virgil is a big count of everything waiting on you across every project, with one line each saying which project, which ticket and why. Pressing a line opens that ticket in its project's panel at the same address. When nothing needs you, the count shows 0 and says so.

To see it, open speck serve's address and go to Factory floor. In a narrower window the dial moves under the line. Worth watching: another floor ticket (0769, opening tickets from the floor) is being built at the same time on the same page, so the two may need joining up when they ship.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 270,021
- Elapsed since build started: 16 min
- Changed lines: 138 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups:
  - Inbox: speck/ideas/2026-11-26-keep-related-tests-from-following-a-template-through-panel-support.md (`speck test --related` chose 533 files because test/support/panel.mjs reads floor.html, and ran past the shell's limit).
  - The dial's mood ranking and the needs' reasons copy All projects' (panel-header.js): they could share one place.
  - 0769 changes floor.js too and isn't chained after this ticket: expect a merge at ship.

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
    "reviewed_sha": "06b339f0daa905bf37cba1ba060a0bfa2b1f0361",
    "session": "fresh",
    "thread_id": "01a2199d-028a-7c53-93a3-294312052145",
    "builder_response": "- Tests run: test/floor-dial-0767.test.mjs test/floor-0765.test.mjs test/floor-line-0766.test.mjs test/floor-browser-0765.test.mjs test/floor-line-browser-0766.test.mjs test/brief-0225.test.mjs (and the config's checks). `speck test --related` chose 533 files, nearly the whole suite, because test/support/panel.mjs reads floor.html, and it ran past the shell's 10-minute limit, so I ran the floor's own tests (including both real-browser floor tests, which check the page still doesn't scroll sideways at 600 and 800 px with the dial added) and the brief's.\n- AC4 is checked by the full suite at ship.\n- Pictures: three in the review pack (wide with needs, 900 px with the dial under the line, wide with nothing needing you). The floor is dark only.\n",
    "seconds": 27,
    "usage": {
      "input_tokens": 269300,
      "cached_input_tokens": 202240,
      "cache_write_input_tokens": 0,
      "output_tokens": 721,
      "reasoning_output_tokens": 40
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 67060,
      "cached": 202240,
      "write": 0,
      "output": 721
    },
    "cost_usd": 0.161554,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-26T20:47:56.526Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/floor.js drawDial draws SpeckFace with role manager at 128 px inside three rings; dialModel uses the same mood ranking as templates/panel-header.js bridgeModel. templates/floor.css places the dial beside the line. The three AC1 tests passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/floor.js dialModel aggregates answering projects' needs; needLine shows project, ticket id and reason. openNeed selects the project's panel and stores the ticket using the existing panel-header.js openAskedTicket protocol. Four AC2 tests passed, covering counts, navigation, needs without tickets and refused navigation."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "drawDial displays 0 and 'Nothing needs you.' for an empty needs list. Both AC3 tests passed, including the initial loading state."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The supplied targeted run reports 185 passed, 0 failed and 3 skipped, including existing floor and browser coverage. The changes reveal no additional regression; the whole-suite check remains enforced at ship."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Virgil now appears in a large ringed dial, reflecting the busiest project's mood. The dial counts what needs your attention and opens each item in its project's panel. The tests exercise the requested behaviour and report no failures. No blocking concerns found."
  }
}
```

</details>

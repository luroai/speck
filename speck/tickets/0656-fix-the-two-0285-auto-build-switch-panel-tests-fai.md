---
id: "0656"
title: Make the full suite pass on main again                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 0              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: fix                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-11
started: "2026-11-11T17:32:20.318Z"

---
# 0656 · Make the full suite pass on main again

**Status:** 🔍 reviewing

## Problem
The full suite (`commands.test_full`) fails on `main` at `a95b3c3`, so the panel has shown Needs you since 16:11 on 2026-11-11. Four tests fail: two 0285 AC3 tests of the Auto-build switch in `test/foreman-0285.test.mjs`, since 0646 added a usage request that the fake page answers out of turn; 0161 AC1, as `#settings .sub .win .fill` (0646's usage bar) fills with `--muted` and sets no text colour; and 0427 AC1, as `#full-suite .full-suite-fact .label` (0655) is set at 13 px.

## Outcome
The full suite passes on `main` again, so Needs you clears.

## Acceptance criteria
1. Both 0285 AC3 tests (the Auto-build switch turns speck run on and off; a refused switch shows speck run's own message) pass with Settings asking for usage as 0646 made it, without changing what the switch does.
2. Every coloured background in the subscriptions' usage bars either holds no text or sets its own text colour, so 0161 AC1 passes.
3. The full-suite view's fact labels use a text size the panel allows, so 0427 AC1 passes.
4. `npm test` passes on this change, and no test that passed before it fails.

## Out of scope
- Running these rule tests before ships: 0657.

## Notes
- Raised by speck while looking into 0652's long build; completed 2026-11-11 with the other two failures from the full run at `a95b3c3`.
- Checked 2026-11-11: each fails alone with `node --test` (0161: "#settings .sub .win .fill fills with --muted and sets no text colour"; 0427: "#full-suite .full-suite-fact .label: font-size 13px").
- Failing before this build: the four this ticket fixes, from the full suite's recorded result at a95b3c3 (its kept output is cut short and shows only 0161 AC1): the two 0285 AC3 tests in `test/foreman-0285.test.mjs`, 0161 AC1 and 0427 AC1. No others are known. The full-suite view, opened in this build's panel, confirms it names exactly these four.
- Tests: no new test file. Each criterion is that an existing test passes again (both 0285 AC3 tests, 0161 AC1, 0427 AC1), so those tests are this ticket's checks; a new one would only repeat them. AC4's `npm test` runs at ship, as the build never runs the whole suite.
- 0285 AC3's first test also failed for a second reason the run hid: since 0652 the server's "Your engineering manager" group is drawn as Your team's first card, and a group with no settings left isn't drawn at all. The test now checks Your team comes first and Auto-build sits above the server's groups; its switch checks are unchanged.
- 0427 AC1 found three 13 px rules in the full-suite view (its fact labels, their values and the failing tests' list), not only the labels: all three are now 12 px.
- Self-check: no changes

## In plain words
The full set of speck's own checks should pass on main again, so the panel's Needs you warning about the full suite clears once speck run's next full run passes. Nothing about how the Auto-build switch or the subscriptions' usage bars work has changed. The one thing you can see: in the "Full suite fails" view, the commit, time, log and failing test names are a touch smaller (12 px, not 13 px), as the panel only uses 13 px for small details in rows. To check, watch the Needs you count after this ships and the next full run finishes.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
Follow-ups: none. The 0285 test had gone stale twice over (0646's usage request and 0652's Your team layout) without anyone noticing, as only the full suite runs it; 0657 covers running such checks before ships.

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
    "reviewed_sha": "e8518197103b9a0cac09db7e414ab065d9ef4def",
    "session": "fresh",
    "thread_id": "01a1cbae-8d04-7813-b453-f62bd44dcc32",
    "builder_response": "- Tests run: test/foreman-0285.test.mjs test/panel-0161.test.mjs test/panel-0427.test.mjs, plus test/panel-0472.test.mjs that --related brought in for templates/panel-popups.css. All pass (150 pass, 3 skipped, 0 fail).\n- No new test file: each criterion is that an existing test passes again (both 0285 AC3 tests, 0161 AC1, 0427 AC1), so those tests are the checks. AC4's `npm test` runs at ship; the build never runs the whole suite.\n- AC1: the two 0285 AC3 tests' fake pages now answer GET /api/usage (sent on opening Settings since 0646) with `{ agents: [] }` in turn. The first also failed for a reason the run hid: since 0652 the server's \"Your engineering manager\" group is Your team's first card, and a group with no settings left isn't drawn. It now gives that group a `watch` setting, checks Your team comes first and Auto-build sits above the server's groups. The switch's checks (Off/On, titles, POST /api/run/on and /off, the refused message) are unchanged; no page code changed.\n- AC2: the usage bars' fills are empty spans (windowRow in templates/panel-settings.js), so both fill rules join 0161's NO_TEXT list, as other text-free fills (.live, the lane dots) are.\n- AC3: the full-suite view had three 13 px rules (fact labels, their values, the failing tests' list); all are now 12 px. Pictures in the pack, light and dark.\n",
    "seconds": 34,
    "usage": {
      "input_tokens": 182816,
      "cached_input_tokens": 136448,
      "cache_write_input_tokens": 0,
      "output_tokens": 833,
      "reasoning_output_tokens": 78
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 46368,
      "cached": 136448,
      "write": 0,
      "output": 833
    },
    "cost_usd": 0.1147108,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-11T17:36:50.943Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "Both 0285 AC3 tests pass in /tmp/speck-0656-tests.txt. Updated fixtures answer the usage request; switch state, endpoint and refusal-message assertions remain intact. No switch implementation changed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "templates/panel-settings.js windowRow() creates empty fill spans, with figures alongside them. Adding the two fill selectors to NO_TEXT accurately reflects this. The 0161 AC1 background test passes."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "templates/panel-popups.css sets full-suite labels, values and failing-test entries to 12px. The unchanged 0427 AC1 font-size rule test passes."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Verified recorded output: 150 passed, 3 skipped, 0 failed, covering the affected tests, related panel-0472 tests and repository checks. The narrow changes show no apparent regression; whole-suite verification remains deferred to shipping under the review protocol."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The four targeted failures are fixed. Switch tests now accommodate the current Settings requests and layout without weakening their behaviour checks. Usage-bar exceptions correctly describe empty elements, and the full-suite text uses an allowed size. All recorded checks pass; the whole suite remains for shipping verification."
  }
}
```

</details>

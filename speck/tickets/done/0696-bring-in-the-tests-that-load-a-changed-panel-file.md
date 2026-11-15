---
id: "0696"
title: "Bring in the tests that load a changed panel file"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-24-bring-in-page-tests-for-a-panel-script-change.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-15
started: "2026-11-15T21:08:47.961Z"
approved: "2026-11-15T21:22:43.736Z"
finished: "2026-11-15T21:48:16.127Z"

---
# 0696 · Bring in the tests that load a changed panel file

**Status:** ✅ done

## Problem
`speck test --related` brings in a test file when its text names a changed file, or when it imports a support module that names one. `test/support/panel.mjs` loads the panel's page with paths built from parts, such as `path.join(ROOT, 'templates', 'panel.js')`, so a change to the panel's script or styles brings in almost none of the about 160 tests that load it. 0468's change broke 61 of them unseen, and 0495, 0502 and 0583 hit the same gap, each handed back at ship or running every panel test by hand.

## Outcome
A change to a file the panel's page loads brings in the tests that load the page.

## Acceptance criteria
1. A branch that changes `templates/panel.js`, `templates/panel.css` or any other file `test/support/panel.mjs` loads into the page brings in, with `speck test --related`, every test file that imports `test/support/panel.mjs`.
2. A support module that names a file by joining its parts, such as `path.join(ROOT, 'templates', 'panel.js')` or `new URL('../../templates/panel.js', import.meta.url)`, counts as naming it, as a module that writes the path whole does today.
3. A branch that changes only files no support module loads brings in the same test files as today: for example, a change to `scripts/ship-queue.mjs` alone doesn't bring in the panel's tests.
4. No test that passed before this change fails.

## Out of scope
- Other ways a test can depend on a file without naming it, such as reading a whole folder.

## Notes
- From the inbox note. `scripts/related.mjs` (0437, 0447); 0447 kept it from picking too many by counting only modules few support files name, so keep that rule.
- Failing before this build: none
- The namer already counted `path.join(ROOT, 'templates', 'panel.js')` as naming `templates/panel.js` (by its file name): the gap was 0447's quarter rule, as nearly every support module imports `test/support/panel.mjs`. The new rule counts only the modules that name a file in their own text (one in twenty at most) and brings in the tests that import those modules directly. The CLI, named by 9 of 72 in their own text, stays out, as does 0447's four-module fixture.
- Self-check: no changes

## In plain words
When a build changes the panel's script, styles or page, its pre-review test run now includes the hundreds of tests that load the panel, instead of a handful. Breakages like the ones several earlier panel tickets only found at ship now show up before review. To see it, change one of the panel's files on a branch and run `speck test --related`: the list it prints names the panel tests. Worth watching: such a run is now much longer, since about 400 test files load the panel.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 134,856
- Elapsed since build started: 14 min
- Changed lines: 9 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups (known limits, no inbox note):
- A test that loads the page only through another support module that imports `test/support/panel.mjs` (such as `stream.mjs` or `lanes.mjs`) still isn't brought in; nearly all such tests import `panel.mjs` themselves too.
- The one-in-twenty threshold sits between the page's files (1–2 of 72 support modules) and the CLI (9 of 72); if support modules grow past about 180 without more naming the CLI, it would start bringing tests in. 0447's real-repo CLI test would catch that.

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
    "reviewed_sha": "0e96424898cfd0ebf9dd1304e02c84cacc04b507",
    "session": "fresh",
    "thread_id": "01a1e116-d6f3-7332-ba97-09950f1de031",
    "builder_response": "- Tests run: `speck test --related test/related-0696.test.mjs` (135 related test files, chosen through docs/brief.md and scripts/related.mjs, plus commands.checks): 1523 pass, 0 fail.\n- Finding while building: the namer already counted `path.join(ROOT, 'templates', 'panel.js')` as naming templates/panel.js by its file name, so AC2 held for naming; the gap was 0447's quarter rule, since nearly every support module imports test/support/panel.mjs and so names the page's files through it. The new rule counts the modules that name a file in their own text: at most one in twenty of them (panel.mjs alone for the page's scripts, 2 of 72 for panel-base.css) brings in the tests that import such a module directly. The CLI is named by 9 of 72 in their own text, so it stays out, and so does 0447's fixture (1 of 4).\n- 0482's rule-off test still finds `!c.skill && ` and `<= modules.length / 4` once each; the new line guards SKILL.md separately.\n",
    "seconds": 21,
    "usage": {
      "input_tokens": 134350,
      "cached_input_tokens": 83456,
      "cache_write_input_tokens": 0,
      "output_tokens": 506,
      "reasoning_output_tokens": 49
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 50894,
      "cached": 83456,
      "write": 0,
      "output": 506
    },
    "cost_usd": 0.1151936,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-15T21:22:33.406Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/related.mjs relatedTests adds direct importers of support modules that rarely name a changed file in their own text. Both AC1 selection tests passed, including coverage of every current page asset and all tests importing panel.mjs."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The AC2 test exercises joined paths, new URL paths and whole paths through relatedTests; all three cases passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Both AC3 tests passed: the isolated ship-queue change selects only its naming test, and measured repository checks keep panel tests out for ship-queue and support-derived selections out for the CLI. Existing quarter-rule tests remain unchanged."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The recorded related run completed with 1523 passing tests, zero failures and three skips. The change preserves the existing selection route and adds a narrowly filtered route; no existing tests were weakened."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Changes to the panel’s page files now select the tests that load them, closing the missed-test gap. Tests cover the current page assets, joined paths and unrelated changes. The related test run passed, and I found no blocking concerns."
  }
}
```

</details>

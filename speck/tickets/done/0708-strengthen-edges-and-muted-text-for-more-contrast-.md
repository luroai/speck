---
id: "0708"
title: "Meet 0161's contrast limits when more contrast is asked for"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: "quick"                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-09-check-the-redesign-for-low-vision-readers.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T12:49:08.363Z"
approved: "2026-11-24T13:26:50.534Z"
finished: "2026-11-24T13:47:29.708Z"

---
# 0708 · Meet 0161's contrast limits when more contrast is asked for

**Status:** ✅ done

## Problem
0161 made the panel readable for low vision, with edges at 3:1 and small muted text at 7:1. The redesign's chosen look relaxes both, to about 1.25:1 and 5.8:1, so someone who needs more contrast may find cards and controls harder to see.

## Outcome
With the system's more-contrast setting on, the panel's edges and muted text meet 0161's limits, and the chosen look is unchanged for everyone else.

## Acceptance criteria
1. With `prefers-contrast: more`, in both the light and dark looks, the lines and borders around cards and controls reach at least 3:1 against the panel background and the raised background.
2. With `prefers-contrast: more`, small muted text reaches at least 7:1 against the panel background and the raised background, in both looks.
3. Without `prefers-contrast: more`, every colour is as it is today.
4. No test that passed before this change fails.

## Out of scope
- Changing the default look, which the user chose.

## Notes
- Tokens are in `templates/panel-base.css` (`--line`, `--line-soft`, `--border`, `--muted`, `--faint`, `--raise`, `--panel`), light and dark. No `prefers-contrast` rule exists yet.
- Decision: keep the look as designed and serve low-vision readers through the system setting, rather than adding stronger edges for everyone.

- Failing before this build: none
- Pictures: none, because the change only applies with the system's more-contrast setting, which the panel's look settings can't switch on.
- Self-check: no changes

## In plain words
When your device's more-contrast setting is on, the panel's borders and its small grey text are now much darker (or lighter in the dark look), so cards, controls and captions are easier to see. With the setting off, nothing looks different. To see it, turn on increased contrast in your system's accessibility settings and reload the panel. The setting can't be switched from the panel itself.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 204,113
- Elapsed since build started: 38 min
- Changed lines: 7 (limit 5000)
- Follow-ups: none. The checks' browser tests hung past 10 minutes here, so the related-test run was done directly on the affected colour tests.
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
    "reviewed_sha": "afec25b1ebeceb35376d65960f57e2d8fb60fe69",
    "session": "fresh",
    "thread_id": "01a20dbc-62b0-7ea2-83e3-47e0e50e0c83",
    "builder_response": "- Tests run: test/contrast-0708.test.mjs test/panel-0161.test.mjs test/panel-0134.test.mjs test/panel-0136.test.mjs test/panel-0147.test.mjs test/panel-0426.test.mjs test/panel-0577.test.mjs (run directly with `node --test`: `speck test --files` also runs the commands.checks files, whose browser tests hung past 10 minutes in this environment; earlier runs showed 0182 and 0206 failures about Chromium closing, unrelated to CSS).\n- Change: a `prefers-contrast: more` block in templates/panel-base.css sets --border, --line, --line-soft (3.4:1 light / 4.2:1 dark on --raise) and --muted, --muted-large, --faint (8:1 light / 8.6:1 dark) in both looks.\n- Existing colour tests read the default look, so `styles()` and `looks()` in test support now leave that block out; the new test reads it from the file.\n",
    "seconds": 26,
    "usage": {
      "input_tokens": 203379,
      "cached_input_tokens": 148864,
      "cache_write_input_tokens": 0,
      "output_tokens": 734,
      "reasoning_output_tokens": 47
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 54515,
      "cached": 148864,
      "write": 0,
      "output": 734
    },
    "cost_usd": 0.1312564,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-24T13:26:45.459Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel-base.css:132–135 overrides all three edge tokens within prefers-contrast: more, for both themes. The two AC1 tests in test/contrast-0708.test.mjs verify each token reaches 3:1 against both backgrounds; both passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The same media query overrides --muted, --muted-large and --faint. The two AC2 tests calculate contrast against --panel and --raise in both themes and passed at the required 7:1."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The production CSS diff adds only the conditional media query; existing colour declarations remain unchanged. The AC3 test checks the existing light and dark line and muted values and passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "/tmp/speck-0708-tests.txt records 61 passing tests with no failures, including the existing contrast and palette tests. Test helper changes isolate the default palette from the conditional overrides without lowering existing thresholds."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The system’s more-contrast setting now strengthens borders and muted text to the required levels in both light and dark looks. The default colours remain unchanged. All 61 reported tests passed, and no blocking issues were found."
  }
}
```

</details>

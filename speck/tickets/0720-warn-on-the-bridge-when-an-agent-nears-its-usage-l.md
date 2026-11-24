---
id: "0720"
title: "Warn on the bridge when an agent nears its usage limit"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: cursor              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-11-10-show-each-agent-s-usage-in-the-panel.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-11-24
started: "2026-11-24T14:33:58.528Z"
waited_seconds: 10
approved: "2026-11-24T15:07:59.257Z"

---
# 0720 · Warn on the bridge when an agent nears its usage limit

**Status:** 👍 approved

## Problem
Settings shows each subscription's usage since 1.2 (0646), but you only see it if you open Settings. Usage limits decide whether work moves, so a limit coming should be visible where you look first.

## Outcome
The bridge shows a line for each agent at 90% or more of a usage window, or limited.

## Acceptance criteria
1. When speck's latest reading for an agent shows any usage window at 90% or more, or the agent limited, the bridge shows a line naming the agent, the window (such as five hours or the week) and when it resets.
2. Each agent at or over 90% is named; an agent under 90% in every window, or with no reading, isn't.
3. The line goes once the agent's newest reading is under 90% in every window and not limited.
4. No test that passed before this change fails.

## Out of scope
- Readings themselves, and Settings' Your subscriptions (0642, 0643, 0646).

## Notes
- Readings come from `GET /api/usage` (`scripts/subscriptions.mjs`), which only `templates/panel-settings.js` reads today. 90% is where Settings' bars turn orange.
- Failing before this build: none
- Builder: Cursor took over this build from Claude at 2026-11-24 14:41 UTC, because Claude's usage limit was reached until 2026-11-24 16:10 UTC, more than an hour away.
- Self-check: no changes
- Related run (before review): 10 failures, none from this change — chromium-0723 (Chromium start timing), panel-0469 (Plan chain-facts mouse vs touch), related-0676 and tmp-cleanup (Node reporter no longer prints `# fail 2`), usage-limit-0622 (`--session-id` vs `--resume`). All 0720 tests passed.

## In plain words
When an agent is at 90% or more of a usage window, or has hit its limit, All projects on the bridge shows a line naming that agent, which window, how much is used (or that it's limited) and when it resets. The line goes again once speck's newest reading for that agent is comfortably under the limit. Open All projects from the project menu (with two panels running) to see it; Settings still has the full bars.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 An explicit Codex limit can produce no bridge warning.
Round 2 (codex): changes requested: F2 The fallback applies to every limit_reached reading with no remaining warning, including recognised limits that have already reset.
Round 3 (codex): approve.

## Delivery log
- Review rounds: 3
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 1,856,910
- Elapsed since build started: 34 min
- Changed lines: 55 (limit 5000)
### Follow-ups
- Inbox: accept Node's spec reporter in TAP checks (`speck/ideas/2026-11-24-accept-node-s-spec-reporter-in-tap-checks.md`) — tmp-cleanup and related-0676 expect `# fail 2`.
- Known limits: bridge warning lines reuse Settings' `resetWords` (loaded later on the page); Codex limit-type naming is duplicated for the bridge fallback rather than shared with Settings' readingShown.
- Skipped: usage-limit-0622 `--session-id` vs `--resume` — already covered by tickets around 0622/0654/0648 (machine-dependent / Cursor stand-in). Chromium-0723 and panel-0469 timing under load — no new ticket.

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "5883aed0385398850cb28f34efb2c98b953ffde6",
    "session": "fresh",
    "thread_id": "01a20e10-e66e-7601-93b2-9a05a3f420b6",
    "builder_response": "- Tests run: `speck test --related test/bridge-usage-0720.test.mjs` before review (4220 passed, 10 failed, 3 skipped). It brought in every test file naming the changed product files (through test/support/panel.mjs for the header). All ten 0720 tests passed. The 10 failures are none from this change: chromium-0723 (Chromium start timing), panel-0469 (Plan chain-facts mouse vs touch), related-0676 and tmp-cleanup (Node reporter no longer prints `# fail 2`), usage-limit-0622 (`--session-id` vs `--resume`). They fail the same way when those files are run alone. Left unchanged.\n- Cursor took over this build from Claude after Claude's usage limit; the tests and implementation were already written, uncommitted. Self-check found nothing to change. Pictures of the bridge with a Claude Code warning, light and dark, are in the review pack.\n",
    "seconds": 45,
    "usage": {
      "input_tokens": 982334,
      "cached_input_tokens": 779648,
      "cache_write_input_tokens": 0,
      "output_tokens": 1131,
      "reasoning_output_tokens": 130
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 202686,
      "cached": 779648,
      "write": 0,
      "output": 1131
    },
    "cost_usd": 0.4946468,
    "saved_at": "2026-11-24T14:59:22.761Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "scripts/subscriptions.mjs usageWarnings relies on readingShown/codexRefused, which can discard an explicit limit_reached reading when limit_type does not identify a window and percentages are below 100. A read-only reproduction returned []. The passing AC1 tests cover only named limits."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "test/bridge-usage-0720.test.mjs AC2 tests passed, exercising multiple agents, exactly 90%, 89.9%, absent readings and bridge rendering."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing AC3 tests exercise replacement of a saved high reading with a newer low reading and removal of the displayed line on the next summary."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Reported run: 4220 passed, 10 failed, 3 skipped. The failures concern unrelated browser layout, process timing, reporter output and build resume behaviour; the branch changes do not affect those paths."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/subscriptions.mjs",
        "issue": "An explicit Codex limit can produce no bridge warning. codexRefused recognises selected window names; for any other limit_type it requires a window at 100%. However, codexUsageInSession records any non-empty rate_limit_reached_type as limit_reached. Thus a valid saved limited reading with an unrecognised type and percentages below 90% disappears entirely, contrary to AC1.",
        "suggested_fix": "Handle an explicit limit whose window cannot be identified in the bridge warning logic, without changing Settings or the reading parser. Add a test using an unrecognised limit type and low or unknown window percentages, verifying that the bridge still names the limited agent and communicates the available reset information.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The bridge shows usage warnings and removes them after a newer low reading. The supplied tests pass for those behaviours, but a recorded Codex limit can be silently omitted when its window is not recognised. Fix that gap before merge."
  }
}
```

</details>

<details><summary>Round 2 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "1cc50e67377bbc6ef3e94e96ee98868ccd590d88",
    "session": "continued",
    "thread_id": "01a20e10-e66e-7601-93b2-9a05a3f420b6",
    "builder_response": "- Tests run: test/bridge-usage-0720.test.mjs (and commands.checks). All eleven 0720 tests passed. The one failure in that run is tmp-cleanup's AC1 AC2 (expects TAP `# fail 2`; this Node prints `ℹ fail 2`), unchanged by this ticket and failing the same way alone.\n- F1: fixed. `usageWarnings` in scripts/subscriptions.mjs: when a reading has `limit_reached` but readingShown marks no window high (unrecognised Codex limit_type with windows under 100%), the bridge still warns with each still-open window marked limited and its reset times. Settings and the reading parser are unchanged. New test covers an unrecognised type with low/null percentages, and that already-reset windows stay out.\n",
    "seconds": 33,
    "usage": {
      "input_tokens": 1408783,
      "cached_input_tokens": 1194880,
      "cache_write_input_tokens": 0,
      "output_tokens": 1812,
      "reasoning_output_tokens": 152
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 11217,
      "cached": 415232,
      "write": 0,
      "output": 681
    },
    "cost_usd": 0.0707672,
    "saved_at": "2026-11-24T15:02:36.429Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "The eleven passing 0720 tests cover threshold warnings, named limits and the new unknown-type fallback. However, scripts/subscriptions.mjs usageWarnings now wrongly labels another window limited after a known limited window resets; see F2."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "A read-only reproduction with an expired primary limit and weekly usage at 20% returned a Codex warning saying Week limited. The agent has no remaining high or limited window."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The passing AC3 tests exercise saving a newer reading below 90% and removing the displayed warning on the next summary. The fallback does not apply when the newer reading is not limited."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The supplied run reports 153 passed, 1 failed and 3 skipped. The unchanged tmp-cleanup failure concerns Node reporter formatting and is unrelated to this change."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/subscriptions.mjs",
        "issue": "An explicit Codex limit with an unrecognised window type could previously produce no bridge warning. The new fallback handles the reported case, and the added passing test exercises low and unknown percentages.",
        "suggested_fix": "No further change needed for the original omission.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/subscriptions.mjs",
        "issue": "The fallback applies to every limit_reached reading with no remaining warning, including recognised limits that have already reset. For example, an expired primary window at 100% and an unexpired weekly window at 20% produces 'Week limited', incorrectly extending the warning until the weekly reset.",
        "suggested_fix": "Restrict the fallback to limits whose window cannot be identified. Preserve expiry handling for recognised limits. Add a regression test with an expired primary limit and an unexpired weekly window below 90%, asserting no warning.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The original missing-warning case is fixed, but the fallback introduces a false warning: after a known limit resets, it can label another low-usage window limited. Correct that before merge."
  }
}
```

</details>

<details><summary>Round 3 · codex · approve</summary>

```json
{
  "meta": {
    "round": 3,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "3caed7152b781d11bfc7f1a8bfd4d2669368836b",
    "session": "continued",
    "thread_id": "01a20e10-e66e-7601-93b2-9a05a3f420b6",
    "builder_response": "- Tests run: test/bridge-usage-0720.test.mjs (and commands.checks). All twelve 0720 tests passed. The checks run still fails only on tmp-cleanup's AC1 AC2 (TAP `# fail 2` vs this Node's `ℹ fail 2`), not from this change.\n- F2: fixed. The bridge fallback for `limit_reached` now runs only when `limit_type` names no window (`codexLimitWindow` returns null), matching readingShown/codexRefused's naming. A recognised type whose window has already reset no longer marks another low window limited. New regression test: expired primary at 100% with week at 20% → no warning.\n",
    "seconds": 22,
    "usage": {
      "input_tokens": 1854611,
      "cached_input_tokens": 1629696,
      "cache_write_input_tokens": 0,
      "output_tokens": 2299,
      "reasoning_output_tokens": 152
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 11012,
      "cached": 434816,
      "write": 0,
      "output": 487
    },
    "cost_usd": 0.0703756,
    "saved_at": "2026-11-24T15:07:09.712Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/subscriptions.mjs usageWarnings selects high or limited windows, including unrecognised limit types. Passing AC1 tests cover warning data, summary delivery and bridge rendering with agent, window and reset information."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "Passing AC2 tests cover multiple agents, exactly 90%, below 90%, missing readings and malformed entries. The new regression test confirms an expired recognised limit does not warn about another low window."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Passing AC3 tests exercise replacement by a newer low reading and removal of the displayed line on the next summary."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "All twelve 0720 tests passed. The supplied run reports 154 passed, one unrelated tmp-cleanup reporter-format failure and three skipped; no regression attributable to this change was found."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/subscriptions.mjs",
        "issue": "Unrecognised Codex limit types previously produced no warning with low or unknown percentages. The fallback and its passing regression test address this.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/subscriptions.mjs",
        "issue": "The fallback previously labelled another low window limited after a recognised limit reset. It now applies only when the limit type names no window; the new passing regression test covers the reported case.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The bridge now names agents nearing or reaching their usage limits, shows reset information and removes warnings when readings recover. Both previous issues are fixed. All twelve ticket tests pass; the remaining check failure is unrelated."
  }
}
```

</details>

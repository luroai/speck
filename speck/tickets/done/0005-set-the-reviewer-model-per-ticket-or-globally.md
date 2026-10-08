---
id: "0005"
title: "Set the reviewer model per ticket or globally"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | done
priority: 3              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
builder: claude
reviewer: codex
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-08
started: "2026-10-08T15:41:27.570Z"
finished: "2026-10-08T15:46:12.280Z"

---
# 0005 · Set the reviewer model per ticket or globally

**Status:** ✅ done

## Problem
speck is used by other people with their own builders and reviewers, but nobody can choose which model or effort level does the review. The reviewer silently runs on whatever its CLI or session defaults to, and the review pack doesn't say which model approved the change.

## Outcome
Teams can set the reviewer model and effort level for a whole repo in `speck/config.yml` and override them on any ticket. With nothing set, speck forces no model: a `claude-subagent` reviewer runs on the builder's model in a fresh session, and Codex uses its own default.

## Acceptance criteria
1. `speck/config.yml` and the ticket template have optional `reviewer_model` and `reviewer_effort` fields, blank by default. `speck new` copies the config values into the new ticket. A value on the ticket overrides config, and a blank ticket value falls back to config.
2. When neither the ticket nor config sets a model or effort, speck passes no model or effort to the reviewer. No model name is hard-coded anywhere in speck's code, templates or skills.
3. When a model or effort is set, the reviewer runs with it: `speck review` passes it to Codex in round 1 and in resumed rounds, and the review skill starts the `claude-subagent` reviewer with it.
4. `speck lint` rejects a `reviewer_effort` that isn't blank or one of `low`, `medium`, `high`, `xhigh` or `max`. Model names are passed through as written and not checked.
5. Every saved review round and the review pack show the reviewer model and effort used, or "default" when none was set.

## Out of scope
- Changing which reviewer *agent* is the default (`reviewer: codex`) or the `allow_same_model_review` rule.
- Choosing the builder's model.
- Checking that a model name exists or that the reviewer supports the chosen effort level.

## Notes
- Model names are free text in the reviewer's own format, e.g. `claude-opus-5-5`. Effort is a separate field so speck can pass it on reliably.
- Templates and docs must not suggest a specific model; examples are fine in comments only.
- Update `docs/brief.md`, the review skill and `templates/config.yml` to describe the fields.
- **Manual smoke test for the `claude-subagent` path (AC3), 8 October 2026.** A Node test can't start Claude Code's Agent tool, so the builder followed the review skill by hand. To repeat it: in a temporary repo, run `speck init --skip-checks`, then `speck new Configured`, `speck set 1 reviewer_model haiku`, `speck set 1 reviewer_effort low`, then `speck new Unset`.
  - Ticket 0001: `speck reviewer-settings 1` printed `model: haiku` and `effort: low`. As skill step 3 says, the Agent tool was called with `model: "haiku"` and `effort: "low"`. The subagent started, and when asked its model it replied `claude-haiku-5-5`.
  - Ticket 0002: `speck reviewer-settings 2` printed `model: default` and `effort: default`. The Agent tool was called with neither parameter. The subagent started on the builder's model and replied `claude-opus-5-5`, so a fresh session on the builder's model, as the Outcome says.
  - Claude Code accepted the effort, but a subagent can't report its own effort level, so the smoke test shows only that the effort value is accepted.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->
- Round 1 (codex, model default, effort default): changes requested. F1: the claude-subagent path isn't exercised. F2: `speck record` used the current ticket settings, not the ones a resumed subagent started with.
- Round 2: changes requested. F2 resolved (settings saved by `reviewer-settings`). F1 dispute rejected: a manual smoke test is needed.
- Round 3: approved. F1 resolved by a documented smoke test with a real subagent, configured and default.

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost, PR link. -->
- Attempts: 1. Review rounds: 3 (of 3). Reviewer tokens: 351,873. Elapsed: about 5 min of build and review time, plus the review rounds.
- Changed lines: about 70 (limit 300), excluding tests.
- Follow-up ideas: Codex sandbox still fails to start here, so the reviewer worked from the diff only (known limit). `speck set` can't clear a field back to blank (an empty value is rejected), so blanking `reviewer_model` means editing the file.

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "default",
    "reviewer_effort": "default",
    "reviewed_sha": "8aca4c6fc39c9d2fc27c7a7d73aca727f3ff8fe1",
    "thread_id": "01a11c2e-f3e5-79c0-a997-e5f890061318",
    "seconds": 32,
    "usage": {
      "input_tokens": 57618,
      "cached_input_tokens": 28544,
      "cache_write_input_tokens": 0,
      "output_tokens": 816,
      "reasoning_output_tokens": 95
    },
    "saved_at": "2026-10-08T15:43:53.207Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "The supplied diff adds blank fields to both config files and the ticket template. Tests exercise cmdNew copying config values and reviewerSettings applying overrides and fallback."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "runCodexReview conditionally adds model and effort arguments. Tests inspect captured Codex arguments when settings are blank and scan code, templates and skills for model names."
      },
      {
        "id": 3,
        "status": "unclear",
        "evidence": "The Codex test exercises argument construction for initial and resumed rounds. The claude-subagent test only searches skill text for parameter names and runs reviewer-settings; it never starts a reviewer or verifies that the Agent tool accepts and applies those parameters."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "lintTicket validates ticket and config efforts against EFFORTS. Tests cover every allowed value, several invalid values and an unrestricted model name."
      },
      {
        "id": 5,
        "status": "fail",
        "evidence": "cmdRecord records settings resolved from the current ticket/config, while the skill explicitly retains the original claude-subagent across rounds. If settings change between rounds, metadata reports new settings although the reviewer still uses its original settings. Existing tests cover only unchanged settings."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/speck.test.mjs",
        "issue": "The claude-subagent AC3 test does not exercise reviewer creation. Matching the words `model` and `effort` in documentation cannot establish that configured settings reach a running reviewer.",
        "suggested_fix": "Verify the actual supported Agent tool invocation and add coverage that exercises the invocation with configured and blank settings, including evidence that the chosen parameters are applied.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "cmdRecord derives metadata from current configuration rather than the settings used to start the retained claude-subagent. Editing model or effort between rounds therefore creates an inaccurate review history and pack.",
        "suggested_fix": "Persist the settings used when starting the subagent and reuse them when recording resumed rounds, or restart the reviewer when settings change. Add a regression test that changes settings between rounds.",
        "state": "open"
      }
    ],
    "product_md": {
      "accurate": false,
      "note": "The claim that every saved round records the settings used is inaccurate for a retained claude-subagent after configuration changes. Configured subagent execution also lacks behavioural verification."
    },
    "escalation_question": "",
    "summary": "The Codex settings path has useful tests, but the Claude reviewer path is not demonstrated and can report settings different from those actually used. Fix those gaps before merge. Repository reads and independent test execution were blocked by the sandbox failing to start; this review relies on the supplied diff and test output."
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
    "reviewer_model": "default",
    "reviewer_effort": "default",
    "reviewed_sha": "4155461ed1cfc02d0842ebb69027ab401f2ef921",
    "thread_id": "01a11c2e-f3e5-79c0-a997-e5f890061318",
    "seconds": 37,
    "usage": {
      "input_tokens": 125999,
      "cached_input_tokens": 91264,
      "cache_write_input_tokens": 0,
      "output_tokens": 1688,
      "reasoning_output_tokens": 164
    },
    "saved_at": "2026-10-08T15:45:05.291Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "Config and ticket templates contain blank fields. AC1 tests exercise copying config into new tickets and reviewerSettings override/fallback behaviour."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "runCodexReview omits unset arguments. AC2 tests inspect captured arguments and scan code, templates and skills for hard-coded model names."
      },
      {
        "id": 3,
        "status": "unclear",
        "evidence": "The Codex test exercises initial and resumed argument construction. The Claude test checks documentation keywords and reviewer-settings output, but does not exercise reviewer creation. The builder's description of available tool parameters establishes plausibility, not a behavioural test."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "lintTicket validates ticket and config effort values. AC4 tests cover allowed and invalid efforts and unrestricted model names."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "cmdReviewerSettings now persists starting settings and cmdRecord reuses them. The new AC5 regression changes ticket settings between recorded rounds and verifies both retain their original metadata. Existing tests cover default metadata and pack output."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/speck.test.mjs",
        "issue": "The dispute correctly explains why a Node unit test cannot directly invoke Claude's Agent tool, but the claimed Claude behaviour still has no test exercising it. The existing test's title overstates what its documentation checks establish.",
        "suggested_fix": "Provide a reproducible integration or manual smoke test that follows the skill to start a Claude reviewer with supported configured model and effort values, and with both unset. Record the actual invocation and successful result. This need not be a Node unit test or validate arbitrary model names.",
        "state": "dispute_rejected"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "Recorded resumed-subagent rounds previously used current ticket settings rather than the reviewer's starting settings. The persisted settings and regression test address this.",
        "suggested_fix": "No further change required for the reported scenario.",
        "state": "resolved"
      }
    ],
    "product_md": {
      "accurate": true,
      "note": "The saved-settings fix supports the review-history description, and the new alias limitation clarifies the Claude input format. Claude execution remains unverified, consistent with the existing end-to-end testing limitation."
    },
    "escalation_question": "",
    "summary": "The review-history bug is fixed and covered by a regression test. Codex settings have useful coverage. One gap remains: demonstrate that the Claude reviewer can actually be started using the skill's configured and default settings. Sandbox startup still prevents independent repository reads or test execution; this assessment uses the supplied diffs and test output."
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
    "reviewer_model": "default",
    "reviewer_effort": "default",
    "reviewed_sha": "b0918a0a1e378bb45b7df93a702df3998f94243a",
    "thread_id": "01a11c2e-f3e5-79c0-a997-e5f890061318",
    "seconds": 23,
    "usage": {
      "input_tokens": 163438,
      "cached_input_tokens": 125312,
      "cache_write_input_tokens": 0,
      "output_tokens": 2314,
      "reasoning_output_tokens": 164
    },
    "saved_at": "2026-10-08T15:45:57.802Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "Blank fields exist in config and ticket templates. AC1 tests exercise config copying in cmdNew and ticket override/config fallback in reviewerSettings."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "runCodexReview conditionally omits unset arguments. AC2 tests inspect captured arguments and scan code, templates and skills for model names. The documented Claude smoke test omits both parameters when unset."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The Codex AC3 test exercises configured arguments in initial and resumed rounds. Ticket 0005 Notes document a manual Claude smoke test with configured model/effort and with neither parameter supplied. Effort evidence establishes parameter acceptance, not independent measurement of internal reasoning."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "lintTicket validates ticket and config efforts. AC4 tests cover all allowed values, invalid values and unrestricted model names."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "AC5 tests cover configured/default round metadata and pack output. cmdReviewerSettings persists starting settings; the resumed-subagent regression verifies cmdRecord retains them after ticket settings change."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/speck.test.mjs",
        "issue": "The missing Claude execution coverage is addressed by a documented, reproducible manual smoke test. The automated test title now accurately describes its narrower checks.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/speck.mjs",
        "issue": "Persisted starting settings and the regression test address inaccurate metadata after ticket settings change during a retained subagent session.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      }
    ],
    "product_md": {
      "accurate": true,
      "note": "The specification describes settings resolution, forwarding, validation and recorded metadata consistently with the supplied implementation, including the Claude alias limitation."
    },
    "escalation_question": "",
    "summary": "The change is ready for the owner's merge review. Both earlier findings are resolved: resumed reviews retain accurate settings, and the Claude path has a documented smoke test. The supplied output reports all 21 automated tests passing. Independent repository access and test execution remain unavailable because the sandbox failed to start; approval relies on the supplied code diffs and test evidence."
  }
}
```

</details>

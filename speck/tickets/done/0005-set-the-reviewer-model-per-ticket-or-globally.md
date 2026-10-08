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

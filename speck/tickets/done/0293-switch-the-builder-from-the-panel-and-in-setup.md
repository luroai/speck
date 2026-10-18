---
id: "0293"
title: "Switch the builder from the panel and in setup"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 1              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0292", "0290"]               # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-18T12:14:23.327Z"
approved: "2026-10-18T12:23:04.621Z"
finished: "2026-10-18T12:25:15.651Z"

---
# 0293 · Switch the builder from the panel and in setup

**Status:** ✅ done

## Problem
`builder` is read-only in the panel, because changing it needs a `build_command` that starts that agent, and setup asks the user to write one. Someone with Codex or Cursor can't switch to it without editing `speck/config.yml` by hand.

## Outcome
You can switch the builder in the Settings view and in setup, and speck sets everything that goes with it.

## Acceptance criteria
1. The Settings view's `builder` offers the builders that are installed and signed in (0288), and saving a change sets `build_command` blank so speck run uses that builder's own command (0289, 0290), in the same commit.
2. Saving a builder in the same family as the reviewer, without `allow_same_model_review`, is refused with a message suggesting a reviewer from another family, such as `claude` (0292) for a Codex or Cursor builder.
3. When `build_command` was set by hand to something other than the old builder's own command, the view says it will be replaced and asks you to confirm.
4. Setup offers each installed and signed-in builder, recommends Claude Code, and sets the builder this way. (checked by review)
5. A ticket keeps the builder it was made with: switching changes who builds tickets made from then on, and the view says so.

## Out of scope
- A different builder per ticket.

## Notes
- From `speck/ideas/2026-10-17-build-with-any-agent.md`. `builderMismatch` in `scripts/install.mjs` checks today that `build_command` matches `builder`.
- Failing before this build: none
- AC1, switching to Claude Code: a blank build_command doesn't start Claude Code builds (speck run refuses, and 0088's test keeps that as the way to build by hand), so switching to claude sets build_command to Claude Code's default, its own command. Codex and Cursor get blank.
- AC2 keeps 0280's rule: a builder of the reviewer's family is allowed when builder_model and reviewer_model are both set and differ (only possible for a Claude builder), as for a reviewer change.
- AC5: switching never rewrites a ticket's `builder:`, and the view says so. speck run still starts every build with the builder in speck/config.yml, whatever a ticket says: building each ticket with its own builder is "a different builder per ticket", out of scope here. Left as a follow-up.
- Setup sets the builder with `speck config set builder <name> [--replace]`, which does what the panel does: it refuses to replace a hand-set build_command without --replace, and notes a same-family reviewer rather than refusing, since setup chooses the reviewer next.
- Self-check: a build_command that YAML reads as a number or list is shown and confirmed as text, so it can still be replaced; README claims narrowed to claude, codex and cursor, with a test for the command it names.

## In plain words
You can now change which agent builds your tickets (Claude Code, Codex or Cursor) from the panel's Settings view, and setup does the same. speck sets up how builds start for that agent, so there's nothing to edit by hand. The list only offers agents that are installed and signed in on this machine.

To see it, open Settings, pick a different builder and save. The view says that tickets already made keep the builder written in them. If the reviewer would be the same kind of model as the new builder, saving is refused and a different reviewer is suggested. If you'd written your own build command, speck asks before replacing it.

Worth keeping an eye on: after a switch, automatic builds use the new builder for every ready ticket, including older ones. The builder's model setting also stays as it was, so check it still suits the new builder.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 205,703
- Elapsed since build started: 9 min
- Changed lines: 171 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- `speck run` builds every ready ticket with the configured builder, not the one a ticket records: `speck/ideas/2026-10-18-build-older-tickets-with-the-builder-they-were-made-with.md`.
- Switching the builder keeps `builder_model`, which may name another builder's model: `speck/ideas/2026-10-18-clear-builder-model-when-the-builder-is-switched.md`.
- Not done again: setup's blank-build_command advice for a Codex builder with its own command is already in the inbox (`speck/ideas/2026-10-18-setup-s-blank-build-command-advice-for-codex.md`).

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
    "reviewed_sha": "4165fbda14cb249a83fcb19ec31abd58d5414f91",
    "thread_id": "01a14ef6-4472-7f90-a37d-e92d2284e915",
    "seconds": 35,
    "usage": {
      "input_tokens": 204568,
      "cached_input_tokens": 145152,
      "cache_write_input_tokens": 0,
      "output_tokens": 1135,
      "reasoning_output_tokens": 327
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-18T12:22:39.336Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/settings.mjs filters builder choices through readyReviewers and saves builder with its matching build_command in one commit. The three AC1 tests passed, including command changes for all three builders. Claude uses its default command as clarified in the ticket."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "panelSaveSettings checks the proposed settings with sameModelProblem and suggests another-family reviewer on refusal. The AC2 test passed, covering refusal without changes, changing reviewer together, and allow_same_model_review."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "templates/panel.html replacesCommand asks before replacement; panelSaveSettings verifies confirmation against the current command. Both AC3 tests passed, covering cancellation, incorrect confirmation, successful replacement and numeric YAML values."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "skills/speck-setup/SKILL.md section 5 explicitly offers installed, signed-in agents, recommends Claude Code and uses config set builder with consent before --replace. Section 6 explains the resulting commands. The CLI behaviour test passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The two AC5 tests passed: existing ticket builder metadata remains unchanged, newly created tickets inherit the new builder, and builderSwitchLine explains this in Settings. This meets the interpretation explicitly recorded in the ticket's Notes."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Builder switching works in Settings and setup, updates the build command, protects custom commands with confirmation, and checks reviewer compatibility. The recorded run passed 140 tests with three skipped. Existing tickets retain their recorded builder, although automatic builds still use the current global builder—a limitation explicitly deferred by this ticket."
  }
}
```

</details>

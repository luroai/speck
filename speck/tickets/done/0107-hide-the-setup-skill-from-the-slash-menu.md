---
id: "0107"
title: "Hide the setup skill from the slash menu"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-10
started: "2026-10-10T22:40:08.804Z"
finished: "2026-10-10T22:54:34.868Z"

---
# 0107 · Hide the setup skill from the slash menu

**Status:** ✅ done

## Problem
The `speck-setup` skill (0088) appears in Claude Code's `/` menu beside Capture, Ticket, Build and Ship. People only need it once, when the pasted setup prompt starts it, and every extra entry in the menu is one more thing to learn.

## Outcome
The setup skill is agent-only: it's hidden from the `/` menu, and the setup prompt still starts it.

## Acceptance criteria
1. The `speck-setup` skill's frontmatter has `user-invocable: false`, in the source and in both skill folders `speck init` installs.
2. Its description says it's started by the setup prompt in the README, not typed as a command.
3. The README's setup prompt still names the skill, and no test that passed before this change fails.

## Out of scope
- Other agents' menus, which speck can't control; the description covers them.

## Notes
- Decided 2026-10-10: new skills are agent-only; only Capture, Ticket, Build and Ship (plus the existing review and status) are for people.
- Checked 2026-10-10: `user-invocable: false` hides a skill from the `/` menu while Claude can still load it (Claude Code skills docs).
- Failing before this build: none
- Self-check: the description first had "starts it: it isn't", which isn't valid in a plain YAML scalar; reworded it and added a test that the frontmatter values have no ": ".
- Also noted the menu change in the `/speck-setup` rows of the README and the brief, so they don't suggest typing it.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 386,458
- Elapsed since build started: 9 min
- Changed lines: 7 (limit 5000)
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
    "reviewed_sha": "4f1d419577477e54007c97a8f903be0a7aa9e127",
    "thread_id": "01a12801-7fad-77c1-a049-5bd4384b7b0f",
    "seconds": 22,
    "usage": {
      "input_tokens": 385816,
      "cached_input_tokens": 283264,
      "cache_write_input_tokens": 0,
      "output_tokens": 642,
      "reasoning_output_tokens": 18
    },
    "saved_at": "2026-10-10T22:49:31.304Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "skills/speck-setup/SKILL.md contains user-invocable: false. Both repository skill folders link to this source. scripts/install.mjs installTooling copies it into both installed folders. test/setup-0107.test.mjs exercises the real init command and checks both outputs; both AC1 tests passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The source description explicitly says the README setup prompt starts the skill and it isn't typed as a command. The AC2 description test checks this text and passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md's Get started prompt still names speck-setup; its AC3 test passed. The saved /tmp/speck-0107-tests.txt confirms 893 passing tests, zero failures and three skips. No existing tests were changed."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The setup skill now has the setting that hides it from Claude Code's slash menu, including in both installed skill folders. Its description and documentation explain how the README prompt starts it. Tests cover the installation and wording, and the full suite reports no failures. No blocking concerns found."
  }
}
```

</details>

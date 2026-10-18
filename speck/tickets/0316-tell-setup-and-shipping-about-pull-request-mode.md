---
id: "0316"
title: "Tell setup and shipping about pull request mode"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0315"]  # ticket ids that must be done first
created: 2026-10-18
started: "2026-10-18T22:47:16.757Z"

---
# 0316 · Tell setup and shipping about pull request mode

**Status:** 🔍 reviewing

## Problem
Pull request mode has shipped (0295, 0296), but the skills don't know about it: setup still warns that speck can't work with a base branch that requires pull requests, and `/speck-ship` describes only merging locally.

## Outcome
Setup offers pull request mode where it fits, and the shipping skill describes how shipping works in it.

## Acceptance criteria
1. When setup finds that the base branch requires pull requests, or the user says their team works through pull requests, it explains pull request mode and offers to turn it on with `speck config set ship_mode pr`, instead of warning that speck can't work there. (checked by review)
2. Setup asks whether to use pull request mode, recommending `local` for someone working alone. (checked by review)
3. `/speck-ship` says that with `ship_mode: pr`, shipping merges the ticket's pull request on GitHub, and what to do when GitHub can't merge it. (checked by review)
4. The brief describes `ship_mode` with the other settings. (checked by review)

## Out of scope
- How pull request mode works: 0295, 0296 and 0315.

## Notes
- From `speck/ideas/2026-10-18-tell-the-skills-about-pull-request-mode.md` (inbox, from 0296). Skills are in `skills/speck-setup/` and `skills/speck-ship/`.
- Failing before this build: none
- Every criterion is checked by review: no new tests. Three existing tests asserted the wording this ticket replaces (the ship skill never mentioning pull requests, and setup's old pull-request clash sentence), so they now check the new facts instead: `ship_mode: local` as the default in setup and the template, and `ship_mode: pr` in the ship skill.
- Self-check: setup no longer says `speck run`'s ship queue ships every ticket in pull request mode, only those `auto_ship` covers; the ship skill's conflict advice says `speck run` hands it back only when its queue started the ship.

## In plain words
Setting speck up no longer says it can't work with a team that ships through pull requests. When the project's main branch only takes pull requests, or the user says their team works that way, setup explains pull request mode and offers to turn it on. Everyone else is asked whether they want it, and someone working alone is advised to keep shipping locally. The ship instructions now explain that in pull request mode shipping merges the ticket's pull request on GitHub, and what to do when GitHub won't merge it yet. To see it, read the setup and ship instructions, or the product brief, where the setting now sits with the others. Worth a look: when GitHub itself reports a clash with the main branch, the ticket waits rather than being sent back to its build. That's saved to the inbox as a follow-up.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- Review F1 (minor): the ship skill's conflict advice promises a hand-back from `speck run`, but a conflict GitHub reports is refused before the exit-13 landing check, so it isn't handed back. Saved as `speck/ideas/2026-10-18-hand-back-a-pull-request-github-says-conflicts.md`; the skill's wording can be narrowed with it.
- Setup's "Shipping without the user" paragraph still says an auto-shipped ticket is merged and pushed to the base branch, which in pull request mode means merging its pull request on GitHub (wording only).

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
    "reviewed_sha": "94f25f7acb247c9faafc83143a776e16f2dd1278",
    "thread_id": "01a15136-8e0a-7203-82af-e8e9a7917442",
    "seconds": 21,
    "usage": {
      "input_tokens": 145499,
      "cached_input_tokens": 72960,
      "cache_write_input_tokens": 0,
      "output_tokens": 789,
      "reasoning_output_tokens": 62
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-18T22:51:52.936Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "skills/speck-setup/SKILL.md section 3, step 3 explains pull request mode for protected branches and teams using pull requests, and offers `speck config set ship_mode pr` with user agreement."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "skills/speck-setup/SKILL.md section 7 explicitly asks whether to use pull request mode and recommends local for someone working alone."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "skills/speck-ship/SKILL.md describes merging the pull request on GitHub in pr mode and gives next steps for checks, required reviews, drafts, conflicts, missing prerequisites and queued merges."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/brief.md principle 4 explains both ship_mode values and the default; the config set command entry lists local and pr as accepted values."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "minor",
        "file": "skills/speck-ship/SKILL.md",
        "issue": "The new conflict guidance implies GitHub-reported conflicts always exit with 13 and trigger an automatic hand-back. In scripts/pr-ship.mjs, whyNotMergeable can reject a GitHub-reported conflict with the default error code before testLanding reaches its exit-13 conflict check.",
        "suggested_fix": "Distinguish a GitHub mergeability refusal from an exit-13 landing conflict, and promise automatic hand-back only for the latter.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Setup now offers pull request mode, recommends local shipping for solo users, and explains GitHub shipping and recovery steps. All four criteria pass. The reported tests passed, and the changes stay within scope. One minor detail overstates when conflicts are automatically returned to the builder."
  }
}
```

</details>

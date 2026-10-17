---
id: "0269"
title: "Go through the main settings while setting speck up"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0258"]               # ticket ids that must be done first
created: 2026-10-17
started: "2026-10-17T09:22:09.236Z"

---
# 0269 · Go through the main settings while setting speck up

**Status:** 🔍 reviewing

## Problem
`speck init` writes speck's generic defaults into a new project's `speck/config.yml`, and the setup skill then asks only about the base branch, the test command, worktree setup, the builder and reviewer, and unattended builds. It never goes through how much ships without you, how many builds run at once or how big a ticket can be, so those keep defaults the user never chose. Someone who later finds `auto_ship` on, or a 300-line limit, may not know where it came from or what it means.

## Outcome
Setting speck up takes the user through each setting in the panel's Settings view that setup doesn't already ask about. For each, it explains it in plain words, recommends a value for this project and records the user's answer.

## Acceptance criteria
1. The setup skill (`skills/speck-setup/SKILL.md`) goes through every setting in the panel's Settings view (0257) that it doesn't already ask about: `auto_ship`, `auto_ship_risk`, `max_parallel_builds`, `max_parallel_tests`, `limits.max_acceptance_criteria`, `limits.max_changed_lines` and `limits.max_review_rounds`. For each, it says what the setting does using the same explanation the Settings view shows, gives the current value, recommends one and waits for the user's answer.
2. The explanations setup uses come from the same place the Settings view's do (`scripts/settings.mjs`), through a speck command, so setup and the panel never say different things. The command prints each setting's group, name, current value, whether that value is the default, and its explanation.
3. Setup records each value the user picks with `speck config set`, and leaves a setting the user keeps as it is unchanged in the file.
4. Setup never turns `auto_ship` on, or adds `high` to `auto_ship_risk`, unless the user says yes to that setting by itself, after setup has said that a ticket it covers is merged and pushed to the base branch without waiting for them.
5. When speck is already set up and setup runs again, it shows those settings' current values and asks only about the ones the user wants to change.

## Out of scope
- Changing settings from the panel: 0258–0261.
- The settings setup already asks about: base branch, test command, worktree setup, builder and reviewer, and `build_command`.

## Notes
- Checked 2026-10-17: `speck init` copies `templates/config.yml` (`cmdInit` in `scripts/install.mjs`), whose values are generic (`auto_ship: false`, `max_changed_lines: 300`, `max_parallel_builds: 1`), not this repo's own. A project set up with speck 0.5.x had a config matching the template apart from what its setup set: `commands.test`, `commands.test_files`, `worktree_setup` and `auto_ship: true`.
- Criteria 1, 4 and 5 are about the skill's instructions, so check them by review.
- Failing before this build: none
- Self-check: no changes

## In plain words
Setting speck up now goes through seven more settings: whether approved work ships on its own, how many builds and test runs go at once, and how big a ticket can be. For each one, setup explains it in the same words as the panel's Settings view, shows what it's set to, recommends a value and asks. It only turns on shipping without you, or lets risky tickets ship that way, if you say yes to that one setting after it has said what that means. Running setup again on a project that's already set up lists the seven settings and asks only about the ones you want to change. To see the settings and their explanations yourself, run `speck config show`.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none.

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
    "reviewed_sha": "46431f5e6f7bc41ee84304ea3a68385513ab7c30",
    "thread_id": "01a1492d-7484-7d50-ae0a-b0cc20846dc4",
    "seconds": 14,
    "usage": {
      "input_tokens": 95747,
      "cached_input_tokens": 56704,
      "cache_write_input_tokens": 0,
      "output_tokens": 526,
      "reasoning_output_tokens": 16
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-17T09:24:51.934Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "skills/speck-setup/SKILL.md section 7 lists all seven settings and requires the shared explanation, current value, project-specific recommendation and an answer before proceeding. Checked by review."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/settings.mjs cmdConfigShow uses panelSettings and SETTING_GROUPS, printing groups, keys, current values, default comparisons and shared explanations. The three AC2 tests in test/config-show-0269.test.mjs passed and exercise CLI output, JSON output and read-only behaviour."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "Section 7 step 4 requires speck config set only for changed values and no command for retained values. The passing AC3 test exercises recording a changed value and preserving the config when values remain unchanged; the skill fact test checks the command reference."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Section 7's 'Shipping without the user' passage requires separate consent for each shipping setting after explaining automatic merging and pushing, and explicitly prohibits enabling auto_ship or adding high without that consent. Checked by review."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Section 7's 'When speck was already set up' passage requires showing all seven current values, asking which to change and discussing only those selected. Checked by review."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Setup now explains the seven main settings, recommends values and records the user's choices. It requires explicit consent for automatic shipping and preserves existing choices on repeat setup. The command shares the panel's explanations, and all 74 reported tests passed. No blocking concerns found."
  }
}
```

</details>

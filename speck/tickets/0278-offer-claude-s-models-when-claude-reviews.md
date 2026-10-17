---
id: "0278"
title: "Offer Claude's models when Claude reviews"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0277"]               # ticket ids that must be done first
created: 2026-10-17
started: "2026-10-17T18:37:19.169Z"

---
# 0278 · Offer Claude's models when Claude reviews

**Status:** 🔍 reviewing

## Problem
With `claude-subagent` as the reviewer, the Settings view offers `reviewer_model` only as a text box, so you have to know which names Claude accepts. Codex gets a list (0276), but Claude Code has no command that lists its models.

## Outcome
With Claude as the reviewer, the Settings view offers Claude's model names to pick from, and each one always means the newest model of its kind.

## Acceptance criteria
1. With `reviewer: claude-subagent`, the Settings view offers `reviewer_model` as a list: "(default)" for blank, then `fable`, `opus`, `sonnet` and `haiku`.
2. Each name in that list has a few words saying it means the newest model of that kind, for example "the newest Opus".
3. A saved value that isn't in the list, such as a full model name, still shows, marked as not in the list, and isn't changed unless you change it.
4. `reviewer_effort` for `claude-subagent` offers what it offers today.

## Out of scope
- The builder's model: 0279.
- Codex's list (0276).

## Notes
- Checked 2026-10-17: Claude Code's Agent tool, which the builder uses to start a claude-subagent reviewer, takes a model of `sonnet`, `opus`, `haiku` or `fable` (the tool's own schema in this session).
- Checked 2026-10-17: `claude --model` takes an alias such as `fable`, `opus` or `sonnet` for the newest model of that kind (`claude --help`, Claude Code 2.1.301).
- The list of models offered per reviewer is in `scripts/settings.mjs` (0276).
- Failing before this build: none
- Self-check: the brief said every reviewer but Codex gets a box to type the model in; it now says what claude-subagent offers, with a test for the names. Also changed one 0276 assertion that expected claude-subagent to have no list.

## In plain words
With Claude as the reviewer, the Settings view now lets you pick the reviewer's model from a list (fable, opus, sonnet or haiku) instead of typing a name, and each one says it means the newest model of that kind. To see it, set the reviewer to claude-subagent in Settings and open the model list. A full model name you saved before still shows, marked as not offered, and stays as it is unless you change it. The effort choices are the same as before. If Claude adds a new kind of model, this list won't show it until speck is updated.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
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
    "reviewed_sha": "4ac9dd9315db49d19e97d1da88211c9de91a2936",
    "thread_id": "01a14b29-be8a-7f31-9b6c-f1c763fe3919",
    "seconds": 18,
    "usage": {
      "input_tokens": 147672,
      "cached_input_tokens": 102400,
      "cache_write_input_tokens": 0,
      "output_tokens": 694,
      "reasoning_output_tokens": 19
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-17T18:40:07.328Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/settings.mjs supplies the four aliases through reviewerModels and panelSettings; templates/panel.html renders them with a blank '(default)' option. Both 0278 AC1 tests passed, covering server data, selection, saving and switching reviewers."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "CLAUDE_MODELS supplies 'the newest <Kind>' descriptions and settingEditor displays them. The 0278 AC2 test passed for all four names."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "settingEditor preserves an unlisted saved value as a selected option marked '(not offered)'. The passing 0278 AC3 test verifies that changing and saving effort does not submit or alter that model."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "reviewerModelList and settingChoices retain the existing default and low-through-max effort choices for Claude. The passing 0278 AC4 test covers model selection and switching from Codex."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Claude reviewers now get the requested model list, with descriptions explaining that each alias selects the newest model of its kind. Existing custom model values are preserved, and effort choices remain unchanged. The recorded test run confirms 124 passes, no failures and three skips. No blocking issues found."
  }
}
```

</details>

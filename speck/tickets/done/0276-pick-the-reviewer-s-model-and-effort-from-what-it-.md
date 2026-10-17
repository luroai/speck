---
id: "0276"
title: "Pick the reviewer's model and effort from what it offers"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0275"]               # ticket ids that must be done first
created: 2026-10-17
started: "2026-10-17T15:48:22.489Z"
approved: "2026-10-17T15:55:30.569Z"
finished: "2026-10-17T15:57:33.143Z"

---
# 0276 · Pick the reviewer's model and effort from what it offers

**Status:** ✅ done

## Problem
`reviewer_model` is a text box, so you have to know the exact name of a model, and you won't hear when the reviewer's provider releases a new one. `reviewer_effort` offers a fixed list (low to max) that doesn't follow what the model supports: Codex's newest models also offer `ultra`, which speck refuses.

## Outcome
When the reviewer can say which models it offers, the Settings view lists them, so a new model shows up there as soon as the reviewer knows about it, and the efforts offered are the ones the chosen model supports.

## Acceptance criteria
1. With `reviewer: codex`, the Settings view offers `reviewer_model` as a list of the models Codex lists as available, read when the view opens, plus "(default)" for blank. Models Codex marks as hidden aren't listed.
2. With `reviewer: codex`, `reviewer_effort` offers "(default)" and the efforts the chosen model supports, as Codex lists them, and speck accepts any of them, including efforts beyond `max`.
3. A saved value that the list doesn't include, such as a model that's been withdrawn, still shows, marked as not offered, and isn't changed unless you change it.
4. When the models can't be read (Codex isn't installed, isn't signed in, or the command fails or takes more than 10 seconds), and for any other reviewer, the view offers a text box for the model and the fixed effort list, as today, and says in one line why there's no list.

## Out of scope
- Claude Code: it has no command that lists its models. Its aliases (`fable`, `opus`, `sonnet`) always mean the newest model of each kind, so they already follow new releases.
- A setting for the builder's model: `speck/ideas/2026-10-11-choose-the-builder-s-model-per-ticket.md`.

## Notes
- Checked 2026-10-17: `codex debug models` (codex-cli 0.159.0) prints the model catalogue as JSON: each model's `slug`, `visibility` (`list` or `hide`) and `supported_reasoning_levels` (each with an `effort`, including `ultra` on some models) (the installed tool).
- Checked 2026-10-17: `codex debug models` works in codex-cli 0.159.0 with the shape above; whether it stays stable between releases can't be checked ahead of time (it's under `debug`), and criterion 4's fallback covers it changing or going away.
- Checked 2026-10-17: `claude --model` takes an alias such as `fable`, `opus` or `sonnet` for the newest model of that kind, or a full model name, and Claude Code 2.1.301 has no command that lists models (`claude --help`).
- `EFFORTS` in `scripts/core.mjs` is the fixed list today.
- Failing before this build: none
- Self-check: speck asked Codex once for every ticket linted with an effort beyond max, so the answer is now kept for a minute (and re-read when PATH changes); and review.test.mjs's "no model passed to codex" check matched this ticket's worktree path (it has "model" in its name), so it now checks only arguments that set a model or effort.

## In plain words
When the reviewer is Codex, the panel's Settings view now lists the models Codex offers, so you pick one rather than typing its exact name, and a new model appears there as soon as Codex knows about it. The effort list follows the model you pick, including Codex's newer efforts such as ultra, which speck now accepts. To see it, open Settings in the panel, pick a model under reviewer_model, and see the effort list change. A saved model that Codex no longer offers stays as it was, marked "not offered". When Codex isn't installed, isn't signed in or doesn't answer within 10 seconds, or the reviewer isn't Codex, you get the typing box and the usual low-to-max list, with one line saying why. Keep an eye on Codex updates: speck reads the list from a Codex debugging command, which may change without notice, in which case speck falls back to the typing box.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 124,781
- Elapsed since build started: 7 min
- Changed lines: 179 (limit 5000)
Follow-ups:
- To the inbox: `speck/ideas/2026-10-17-check-the-effort-against-the-ticket-s-own-reviewer.md` (a Codex-only effort such as ultra passes lint whatever the ticket's reviewer).
- Known limit: the panel's GET /api/settings wiring (reading the models when the view opens) is tested through reviewerModels and panelSettings directly, not through a running panel.
- Known limit: other tests may match text against paths that include a worktree's name, as review.test.mjs's check did; this build narrowed only that one.

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
    "reviewed_sha": "9c07fbe5cd73b80a1c393a67d29f9c85a3203687",
    "thread_id": "01a14a92-a814-72f3-bb03-c10d95de7276",
    "seconds": 24,
    "usage": {
      "input_tokens": 124077,
      "cached_input_tokens": 76416,
      "cache_write_input_tokens": 0,
      "output_tokens": 704,
      "reasoning_output_tokens": 112
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-17T15:55:11.106Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/panel.mjs reads reviewerModels on each GET /api/settings. parseCodexModels excludes hidden models; panel.html offers the returned models plus '(default)'. Both 0276 AC1 tests passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "panel.html settingChoices derives efforts from the selected model. knownEffort is used by config validation and ticket linting to accept catalogue efforts beyond max. The AC2 tests cover changing models and accepting ultra through config, lint and panel Save; all passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "panel.html settingEditor preserves saved values outside the choices and labels them '(not offered)'. The passing AC3 test verifies that changing effort leaves a withdrawn model unchanged and sends only the changed setting."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "codex-models.mjs applies a 10-second timeout and returns explanatory fallback messages. reviewerModels avoids querying other reviewers. The passing AC4 tests exercise missing Codex, command failure, timeout, malformed output and the fallback text box with fixed efforts."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Settings now lists the models Codex offers and adjusts the effort choices to the selected model, including ultra. Saved values remain intact when no longer offered. When a list is unavailable, manual entry remains available with an explanation. The reported tests passed, and I found no blocking issues."
  }
}
```

</details>

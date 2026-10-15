---
id: "0211"
title: "Stop speck run starting Claude Code for another builder"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: bug                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-10-match-build-command-to-the-chosen-builder.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-15
started: "2026-10-15T13:54:45.172Z"
approved: "2026-10-15T14:16:24.208Z"

---
# 0211 · Stop speck run starting Claude Code for another builder

**Status:** 👍 approved

## Problem
When the user picks Codex, Cursor or Gemini as the builder in `/speck-setup`, `build_command` still starts Claude Code, so `speck run` builds every ticket with an agent they didn't choose, or fails if Claude Code isn't installed. Nothing says so, and a non-technical user won't spot it.

## Outcome
`speck run` never starts one agent's builds when another is set as the builder, and setup leaves a build command that matches the builder.

## Acceptance criteria
1. When `builder` in `speck/config.yml` is `codex`, `cursor` or `gemini` and the first word of `build_command` is `claude`, `speck run` refuses to start, changing nothing, with a plain message naming both and saying how to fix it: set a `build_command` that starts the chosen builder, or set `builder` back to `claude`.
2. `speck doctor` reports the same mismatch with the same advice, and reports nothing about it when they match.
3. When the user chooses a builder other than Claude Code in `/speck-setup`, the skill explains that `build_command` must start that builder without anyone watching, asks the user for the command or offers to leave it blank (builds then start with `/speck-build <id>`), and never leaves Claude's default in place. The copies of the skill that `speck init` installs say the same as `skills/`.
4. With `builder: claude`, or a `build_command` that doesn't start with `claude`, everything works as before.
5. No test that passed before this change fails.

## Out of scope
- Shipping ready-made build commands for each builder, since their flags change between versions.
- Checking that a non-Claude build command works.

## Notes
- Asked for 2026-10-15, for release 0.4.0.
- Decided 2026-10-15: speck flags the mismatch rather than shipping known commands per builder, which settles the note's open question.
- Builder names and their commands: `claude` (`claude`), `codex` (`codex`), `cursor` (`cursor-agent`), `gemini` (`gemini`), from `skills/speck-setup/SKILL.md` section 5. `speck run`'s check of `build_command` is in `cmdRun` in `scripts/run.mjs`; `speck doctor` is in `scripts/install.mjs` (`doctorChecks`).
- No other open ticket changes these files.
- Failing before this build: none
- AC2 and AC5 clashed on one test: `0014 AC1` in `test/core.test.mjs` ran doctor with builder codex, cursor or gemini and Claude Code's default `build_command`, and expected it to pass. That is the mismatch AC2 says doctor must report, so the test now gives those builders a blank `build_command`. Every 0014 assertion is unchanged.
- "Starts with claude" also matches a path to it, such as `/usr/local/bin/claude`.
- Self-check: no changes

## In plain words
If you choose Codex, Cursor or Gemini to build your tickets but speck is still set to start Claude Code for automatic builds, speck now notices. Turning automatic building on refuses to start and says what's wrong and how to fix it, and the setup check reports the same thing. Setup also no longer leaves Claude Code's command in place when you pick another builder: it asks you for your builder's command, or offers to leave automatic builds off so you start each build yourself.

To see it, set the builder to Codex in the settings file while keeping the default build command, then try turning automatic building on or run the setup check. Nothing changes for anyone using Claude Code as their builder.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 461,623
- Elapsed since build started: 22 min
- Changed lines: 26 (limit 5000)
Follow-ups:
- To the inbox: `speck/ideas/2026-10-15-fix-the-0178-ac3-test-that-fails-by-chance.md`. 0178 AC3 failed by chance in this build's full run and passed on its re-run (not covered by 0207).
- Known limit: only a first word that is `claude` or a path ending in `claude` counts. A command started through a wrapper such as `env FOO=1 claude …`, or `claude.exe`, isn't flagged.

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
    "reviewed_sha": "0b0244a9665553f1fbcc511a35d497b9f1909f7f",
    "thread_id": "01a13fea-d45d-7230-b97a-3503e8ca651a",
    "seconds": 45,
    "usage": {
      "input_tokens": 460597,
      "cached_input_tokens": 362624,
      "cache_write_input_tokens": 0,
      "output_tokens": 1026,
      "reasoning_output_tokens": 52
    },
    "saved_at": "2026-10-15T14:16:01.309Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/run.mjs cmdRun calls builderMismatch before locks or writes. AC1 tests cover all three builders, unchanged repository state and executable paths; independent read-only checks also passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/install.mjs doctorChecks uses the shared builderMismatch advice. AC2 tests cover mismatches for all three builders and silence for matching or blank commands."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "skills/speck-setup/SKILL.md section 6 requires an unattended command for the chosen builder or a blank command. AC3 tests check these instructions and verify both installed skill copies match the source."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The AC4 test exercises cmdRun with Claude and non-Claude commands and verifies they reach the subsequent branch check. The guard leaves these cases unchanged."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "/tmp/speck-0211-tests.txt records 1,876 passes, three skips and one timing-sensitive panel failure; all seven tests in that file passed on rerun. The failure compares live elapsed-time counters and is unrelated to this diff. The existing doctor test retains its assertions with appropriately updated configuration."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The change prevents automated builds from starting Claude Code when Codex, Cursor or Gemini is selected, and explains how to correct the configuration. Setup now asks for a suitable command or offers manual builds. Tests cover the requested behaviour. One unrelated timing-sensitive test passed on rerun; no blocking concerns remain."
  }
}
```

</details>

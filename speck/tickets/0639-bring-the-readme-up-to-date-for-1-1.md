---
id: "0639"
title: "Bring the README up to date for 1.1"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0638"]                # ticket ids that must be done first
created: 2026-11-11
started: "2026-11-11T13:17:38.060Z"

---
# 0639 · Bring the README up to date for 1.1

**Status:** 🔍 reviewing

## Problem
Since 1.0.0, speck checks a build's question in the running app itself, works out how to start each project's app, keeps test logins on your machine, carries on after usage limits, ships on quick tests with the whole suite run after, and auto-ships only rounds its own reviewer run recorded. The README says none of this, so someone reading it, or you coming back to it, doesn't know speck can do these.

## Outcome
The README describes what speck does as of 1.1.

## Acceptance criteria
1. The README says, in plain words for someone who doesn't write code, that speck checks a build's question in the running app itself, signing in with test logins kept on your machine, and shows its screenshots in the review pack, and that it works out how to start a project's app the first time it needs to (checked by review).
2. The README says that speck carries a build on by itself once an agent's usage limit resets, and that its watch agent moves to another of your agents while its own is limited (checked by review).
3. The README says that a ticket ships by itself only when speck's own run of the reviewer approved it, and that ships wait for the quick tests while the whole suite runs on the base branch after ships, when you set `commands.test_full` (checked by review).
4. Every command and setting the README names exists as it names it, and every link in it resolves.
5. No test that passed before this change fails.

## Out of scope
- The version, the status line, the "Built with speck" figures and the demo pictures: the release ticket (Prepare release 1.1.0) does those.
- `docs/brief.md`: each ticket's build already kept it up to date.

## Notes
- Asked for 2026-11-11: "update the docs on the repo for 1.1".
- Covers what shipped since `v1.0.0`: 0622 to 0637, and 0638 once it ships. 0626 to 0628 changed only tests and checks, so need no mention.
- Fit the new points into the README's existing sections, such as "Everything in between", "The clever bits" and "Under the hood", rather than adding a long new section.
- Failing before this build: none
- AC4: no new test. `test/readme-links-0491.test.mjs` already checks that every link in the README resolves. The commands and settings it names are a README fact, which the brief's rule (enforced by `test/docs-0491.test.mjs`) leaves to review, so a reviewer checks them against `speck help` and `speck config show`. The builder checked each one by hand with a throwaway script, outside the repo: all exist as named.
- Self-check: narrowed the usage-limit claims to what shipped (builds wait out Claude's limit, reviews Claude's or Codex's; the watch agent moves only off Claude), and said `speck status` names the full suite's failing tests, as the panel only counts them.
- Pictures: none, because the change is to the README's text only, which renders as plain Markdown on GitHub.

## In plain words
The README now covers what speck learned since 1.0. It explains that speck checks a build's question in the running app itself, signing in with test logins kept on your machine and keeping its screenshots in the review pack, and that it works out how to start your app the first time it needs to. It says that speck carries a build on by itself once a usage limit resets, and that its own agent moves to another of yours while Claude is limited. It also says that a ticket ships by itself only when speck's own review run approved it, and that ships can wait for just the quick tests while the whole suite runs afterwards. The commands table gains the test logins and app commands.

To see it, read the README on GitHub once this ships. Nothing in the product changes. The status line, the "Built with speck" figures and the demo pictures still show 1.0: the 1.1.0 release ticket updates those.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
Follow-ups: none.

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
    "reviewed_sha": "a7c4e2de5d40460fb85742bb6a82b3e3a6c40b4f",
    "session": "fresh",
    "thread_id": "01a1cac5-37db-7e02-bab3-32ca7090870e",
    "builder_response": "- Tests run: `speck test --related` with no test files of its own: it chose every existing test file that names README.md (the setup-prompt, picture, link and release tests among them), plus the `commands.checks` files. All pass.\n- No new test file. AC1 to AC3 are (checked by review). AC4's links: `test/readme-links-0491.test.mjs` already checks every link and anchor in the README. AC4's commands and settings: the brief's rule, enforced by `test/docs-0491.test.mjs` (\"only the allowed test files read README.md\"), says a test may read the README only for its setup prompt, status line version, demo pictures and links, so this half is checked by review. Please check each command and setting the README names against `speck help` (the HELP text in scripts/speck.mjs) and the settings `speck config set` knows (KINDS in scripts/config.mjs) or templates/config.yml. New names this build adds: `speck logins set <name>`, `logins remove <name>`, `app <id>` with `--stop`, `commands.start`, `commands.test`, `commands.test_full`. I ran a throwaway checker over every code span in the README against those sources: no problems.\n- AC5: the related run above passed; the recorded result before this build passed too (Failing before this build: none).\n- Claims narrowed to what shipped (0622 to 0638): builds wait out Claude's limit (0622), reviews Claude's or Codex's (0623, Cursor's wording isn't recognised), the watch agent moves off Claude only (0637), the full suite's failing tests are named by `speck status` while the panel only counts them (0630), and the app check needs watch fix or decide and a low-risk ticket (0636).\n",
    "seconds": 31,
    "usage": {
      "input_tokens": 123332,
      "cached_input_tokens": 86144,
      "cache_write_input_tokens": 0,
      "output_tokens": 829,
      "reasoning_output_tokens": 68
    },
    "model": "gpt-6.1-sol",
    "tokens": {
      "input": 37188,
      "cached": 86144,
      "write": 0,
      "output": 829
    },
    "cost_usd": 0.0912804,
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-11-11T13:21:56.206Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "README.md, “Everything in between”, explains app checks on low-risk tickets, locally saved test logins, screenshots in the review pack, and discovering and remembering how to start the app."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "README.md, “Everything in between”, specifies automatic resumption after Claude build limits or Claude/Codex review limits, and another agent standing in while the Claude watch agent is limited. scripts/run.mjs and scripts/watch-stand-in.mjs support these claims."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md, “Shipping”, requires an unchanged approval from speck’s own reviewer run for automatic shipping. “Under the hood” explains commands.test quick checks and commands.test_full running on main after ships; scripts/full-suite.mjs confirms the latter behaviour."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "README command names and options match HELP and COMMANDS in scripts/speck.mjs; settings match KINDS in scripts/config.mjs and templates/config.yml. Existing test/readme-links-0491.test.mjs checks relative links, pictures and anchors and passed in the supplied run. No external links changed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Verified /tmp/speck-0639-tests.txt: 494 tests, 491 passed, 3 skipped, no failures. The diff changes README text and ticket metadata only; no tests or implementation were changed."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The README now explains app checks, local test logins, automatic recovery from usage limits, and the safeguards and tests around shipping. The descriptions match the implemented features, the related checks pass, and the change stays within scope."
  }
}
```

</details>

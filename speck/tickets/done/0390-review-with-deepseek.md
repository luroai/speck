---
id: "0390"
title: "Review with DeepSeek"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: high               # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-18-use-a-model-provider-through-your-own-api-key.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0389","0388"]                # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T07:35:14.552Z"
approved: "2026-10-23T07:42:36.150Z"
finished: "2026-10-23T07:45:26.587Z"

---
# 0390 · Review with DeepSeek

**Status:** ✅ done

## Problem
speck's reviewers are Codex, Claude Code and Cursor. There's no way to review with a model from a provider you have an API key for, such as DeepSeek, which may be cheaper or quicker.

## Outcome
`reviewer: deepseek` reviews tickets with DeepSeek's models.

## Acceptance criteria
1. With `reviewer: deepseek`, `speck review` runs the round on DeepSeek's model named in reviewer_model, or DeepSeek's default model when that's blank. It's read-only, as the Claude reviewer is, and records the round like any other, as reviewer `deepseek`. Later rounds continue the same session. reviewer_effort isn't passed.
2. The reviewer gets DeepSeek's address and this machine's DeepSeek key, and nothing else that would let it sign in. It never sends a request to Anthropic, and it can't reach your Claude sign-in, your Claude Code settings or your connectors.
3. With no DeepSeek key set, the round fails before it starts, saying how to set one. If Claude Code isn't installed, it fails saying DeepSeek reviews need Claude Code installed. Either way, nothing is recorded. `speck doctor` checks both when DeepSeek reviews.
4. The same-model check treats DeepSeek as a family of its own, so any builder may be reviewed by it. Any provider in speck's list reviews the same way, which a test checks with a provider of its own.
5. The brief's table of reviewers has a row for provider reviewers, and the README names DeepSeek as tested (checked by review). No test that passed before this change fails.

## Out of scope
- Building or the Foreman on DeepSeek: 0391 and 0392. Settings: 0393.

## Notes
- speck runs a provider's models through Claude Code, pointed at the provider's Anthropic-compatible address with the provider's key. Settings, config, logs and the panel name the provider, such as DeepSeek, never Claude Code. Only `speck doctor` and the README say Claude Code must be installed to run it.
- Checked 2026-10-23: DeepSeek's API accepts Anthropic's message format at `https://api.deepseek.com/anthropic`, with the key in `ANTHROPIC_API_KEY`, and its guide names `deepseek-v4-pro` and `deepseek-v4-flash` (https://api-docs.deepseek.com/guides/anthropic_api).
- Checked 2026-10-23: `claude --help` (2.1.301) says `--bare` takes Anthropic auth strictly from `ANTHROPIC_API_KEY` or an apiKeyHelper, and never reads OAuth or the keychain. It also skips hooks, plugins and CLAUDE.md discovery, but skills still resolve by `/skill-name`.
- Start from the Claude reviewer's command, `CLAUDE_ARGS` in `scripts/reviewers.mjs`, adding `--bare`. The key goes into the reviewer's own environment only.
- Checked 2026-10-23: `claude --help` (2.1.301) says sessions are saved to disk unless `--no-session-persistence` is given, so `--resume` is local to Claude Code and works whichever endpoint it's pointed at.
- Waits for 0389 for the key, and for 0388, which changes how a ticket's reviewer is chosen (`scripts/review.mjs`, `scripts/same-model.mjs`).
- Failing before this build: none
- Self-check: no changes. Also ran the real Claude Code (2.1.301) with the reviewer's exact flags and environment against a local stand-in for DeepSeek's API: its one request went to the given address with only the DeepSeek key (no Authorization header), and `--resume` continued the same session. No DeepSeek key is set on this machine, so no round has run against DeepSeek itself.

## In plain words
DeepSeek can now review your tickets. Save your DeepSeek key once with `speck keys set deepseek`, set the reviewer to `deepseek`, and each review round runs on DeepSeek's model (its pro model unless you pick another). It works whatever builds the ticket. Claude Code has to be installed, as speck uses it to talk to DeepSeek, but the reviewer only ever gets DeepSeek's address and your DeepSeek key: it doesn't use your Claude account, settings or connectors, and sends nothing to Anthropic. If the key or Claude Code is missing, the round stops straight away and says what to do, and `speck doctor` checks both.

Worth keeping an eye on: no key is set on this machine, so the first round against DeepSeek itself will be the first real one. Choosing DeepSeek in the Settings view comes with a later ticket.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 114,226
- Elapsed since build started: 7 min
- Changed lines: 114 (limit 5000)
Follow-ups (no inbox notes: none needs its own ticket, and the Settings view is 0393):
- No round has run against DeepSeek's real API yet, as this machine has no DeepSeek key. The flags and environment were checked against the real Claude Code and a local stand-in API. Run one round once a key is set.
- Known limit: a `command` of your own under `reviewer_options.deepseek` replaces the built-in reviewer, as for the other built-in reviewers, and then gets neither the key nor the shut-off environment.
- Claude Code prints an `unrecognized_model` warning for DeepSeek's model names on its error output. It's harmless, and only shows if a round fails.

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
    "reviewed_sha": "75771b7e91857667b1a653c9114fde0ba4142c70",
    "session": "fresh",
    "thread_id": "01a167b5-9ffd-7e53-b619-468970ec994d",
    "builder_response": "- Tests run: test/review-provider-0390.test.mjs (and the commands.checks files, which speck test --files adds)\n- Round 1. A provider reviewer is the Claude reviewer's read-only flags plus `--bare`, without `--effort` (scripts/reviewers.mjs), with an environment built from an allowlist in scripts/provider-review.mjs: the provider's address and key, every model variable set to the provider's model, Anthropic's non-essential traffic off, and HOME / CLAUDE_CONFIG_DIR in the repo's ignored speck/.cache/provider-<name>/ (0700), so it can't read the user's Claude sign-in, settings or connectors and its sessions persist for --resume.\n- Checked by hand, beyond the tests (which use a stand-in `claude`): the real Claude Code 2.1.301, run with these exact flags and env against a local stand-in Anthropic-format API, sent its single request to the given address with x-api-key only (no Authorization header) and `--resume` continued the same session. No DeepSeek key is set on this machine, so no round has run against DeepSeek itself.\n",
    "seconds": 25,
    "usage": {
      "input_tokens": 113334,
      "cached_input_tokens": 67840,
      "cache_write_input_tokens": 0,
      "output_tokens": 892,
      "reasoning_output_tokens": 115
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T07:42:23.116Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/reviewers.mjs selects the provider's default or configured model, applies Claude's read-only flags plus --bare, omits --effort, resumes sessions and records reviewer deepseek. Both AC1 tests passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "scripts/provider-review.mjs builds an allowlisted environment with the provider endpoint and key, isolated HOME and Claude configuration, provider model overrides and disabled non-essential traffic. reviewerOptions adds --bare, --setting-sources= and --strict-mcp-config. The AC2 environment and flag test passed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "cmdReview calls providerReady before starting a round; it gives actionable errors for missing Claude Code or keys. doctorChecks checks both dependencies. All three AC3 tests passed, including checks that failed attempts leave the ticket unchanged."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "core.mjs modelFamily treats provider names as independent families. reviewerOptions and provider helpers use the provider registry generically. Both AC4 tests passed, including a separate Acme provider."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The brief's reviewer table includes provider reviewers, and README states 'DeepSeek is tested' with setup instructions. Added document tests check commands and names rather than prose wording. The recorded test run reports 118 passed, zero failed and three skipped."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "DeepSeek reviews now support model selection, read-only operation and continued review sessions, with isolated credentials and clear setup errors. The relevant tests passed. A live DeepSeek round has not been tested; the builder reports checking the real Claude CLI against a local API stand-in. No blocking issues found."
  }
}
```

</details>

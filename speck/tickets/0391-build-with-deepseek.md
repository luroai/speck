---
id: "0391"
title: "Build with DeepSeek"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0390"]                # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T07:46:10.236Z"
approved: "2026-10-23T08:02:13.066Z"

---
# 0391 · Build with DeepSeek

**Status:** 👍 approved

## Problem
speck run builds with Claude Code, Codex or Cursor. There's no way to build with a model from a provider you have an API key for, such as DeepSeek.

## Outcome
`builder: deepseek` builds tickets with DeepSeek's models.

## Acceptance criteria
1. With `builder: deepseek`, speck run builds each ticket that uses that builder on DeepSeek's model named in builder_model, or DeepSeek's default model when that's blank. It follows `/speck-build` exactly as a Claude Code build does: stopping, resuming and handing a ticket back all work the same. Its run record and the panel name the builder as DeepSeek.
2. The build gets DeepSeek's address and this machine's DeepSeek key, and nothing else that would let it sign in. It never sends a request to Anthropic, and it can't reach your Claude sign-in or your connectors. It still reads the repo's AGENTS.md and skills, as a Claude Code build does.
3. With no DeepSeek key set, or Claude Code not installed, the ticket isn't started, and the panel and speck run say why and how to fix it. `speck doctor` checks both when DeepSeek builds.
4. Any provider in speck's list builds the same way, which a test checks with a provider of its own.
5. The README names DeepSeek as a tested builder (checked by review). No test that passed before this change fails.

## Out of scope
- The Foreman: 0392. Settings: 0393.

## Notes
- speck runs a provider's models through Claude Code, pointed at the provider's Anthropic-compatible address with the provider's key. Settings, config, logs and the panel name the provider, such as DeepSeek, never Claude Code. Only `speck doctor` and the README say Claude Code must be installed to run it.
- Checked 2026-10-23: DeepSeek's API accepts Anthropic's message format at `https://api.deepseek.com/anthropic`, with the key in `ANTHROPIC_API_KEY`, and its guide names `deepseek-v4-pro` and `deepseek-v4-flash` (https://api-docs.deepseek.com/guides/anthropic_api).
- Checked 2026-10-23: `claude --help` (2.1.301) says `--bare` takes Anthropic auth strictly from `ANTHROPIC_API_KEY` or an apiKeyHelper, and never reads OAuth or the keychain. It also skips hooks, plugins and CLAUDE.md discovery, but skills still resolve by `/skill-name`.
- Start from `DEFAULT_BUILD_COMMAND` in `scripts/build-model.mjs` and the per-builder plans in `scripts/ticket-builder.mjs` (0312), adding `--bare`. `--bare` skips CLAUDE.md discovery, so the build has to be given AGENTS.md (or CLAUDE.md) itself, for example with `--append-system-prompt-file`.
- Waits for 0390.
- Failing before this build: none
- Checked 2026-10-23, correcting the note above: with the real Claude Code 2.1.301 in `-p` mode, `--bare` doesn't expand `/speck-build` (the model got the bare text) and offers only the Bash, Edit and Read tools. So builds don't use `--bare`: they run with `--setting-sources=project --strict-mcp-config`, their own `CLAUDE_CONFIG_DIR` and the provider's key in `ANTHROPIC_API_KEY`. Against a local stand-in for DeepSeek's API, with a logging proxy for everything else: the skill expanded, the tools were the full set, Claude Code reported `apiKeySource: ANTHROPIC_API_KEY`, every request went to the given address with only the key (no Authorization header), nothing went through the proxy, and `--resume` continued the same session. Without `--bare`, Claude Code reads the repo's CLAUDE.md (which speck's install makes import AGENTS.md), so nothing is appended.
- Self-check: the launcher took `claude` as the model when `--model` was missing, and ran with missing arguments; both fixed, with a test.
- Pictures: none, because the only change on screen is the builder's name in one sentence on a card, which a fake-page test checks.

## In plain words
DeepSeek can now build your tickets. Save your DeepSeek key once with `speck keys set deepseek`, then set the builder to `deepseek` (for the project, with the build command left blank, or on one ticket). Auto-build then builds those tickets on DeepSeek's model (its pro model unless you pick another), following the same steps as a Claude Code build: stopping, resuming and handing a ticket back all work as before, and the board names the builder as DeepSeek. Claude Code has to be installed, as speck uses it to talk to DeepSeek, but it only gets DeepSeek's address and your DeepSeek key: it doesn't use your Claude account, your own Claude Code settings or your connectors, and sends nothing to Anthropic. If the key or Claude Code is missing, the ticket isn't started and Auto-build says why and what to do, and `speck doctor` checks both.

Worth keeping an eye on: no key is set on this machine, so the first build against DeepSeek itself will be the first real one. The commands a build runs still run as you, as any build's do. Choosing DeepSeek in the Settings view, and running the Foreman on it, come with later tickets.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 providerResumeCommand constructs a shell command with .join(' ') without quoting PROVIDER_SCRIPT.
Round 2 (codex): approve.

## Delivery log
- Review rounds: 2
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 633,180
- Elapsed since build started: 16 min
- Changed lines: 230 (limit 5000)
Follow-ups:
- Inbox: speck/ideas/2026-10-23-name-deepseek-properly-when-it-reviews.md (the panel says "Deepseek is reviewing").
- Inbox: speck/ideas/2026-10-23-same-model-check-knows-a-provider-build-s-model.md.
- Skipped, covered by tickets: choosing DeepSeek as builder in Settings and `speck config set builder deepseek` setting build_command (0393); the Foreman still runs on Claude Code when DeepSeek builds (0392).
- No build has run against DeepSeek's real API yet, as this machine has no DeepSeek key. The flags, environment, skill expansion and resume were checked against the real Claude Code and a local stand-in API with a logging proxy. Run one build once a key is set.
- Known limit: the build loads the repo's own Claude Code settings (`--setting-sources=project`), so a committed `.claude/settings.json` that sets its own address, key helper or hooks applies to it, as it would to a Claude Code build.
- Known limit: the commands the build runs still run as the user, so they could read files in the user's home, as any build's could. What's kept apart is what Claude Code itself signs in with and talks to.
- Known limit: a provider build started by hand outside speck run isn't recognised as one by speck run's record of outside builds; only builds speck run starts or resumes are.

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "e31e7ded1c9c92bfcecaf2f949b904cebb606c36",
    "session": "fresh",
    "thread_id": "01a167c6-105c-7b43-8405-57807ce77ca5",
    "builder_response": "- Tests run: test/run-provider-0391.test.mjs, plus the existing test files for the modules this change touches (build-model, build-records, hand-back, ticket-builder, provider-review, doctor, runLimited, statusData, the review-running panel test) and the commands.checks files, which speck test --files adds.\n- Round 1. A provider build is started by speck run (and resumed, handed back or gone-with through resumeFor) as `node scripts/provider-build.mjs <provider> <address> claude …`, Claude Code's own build command plus `--setting-sources=project --strict-mcp-config` and `--model` (builder_model or the provider's default). That launcher reads this machine's key (so it's never on a command line or in a log), strips speck's own Anthropic/Claude Code/cloud sign-in variables, sets the provider's address, key and models (shared with the 0390 reviewer, providerVars), its own CLAUDE_CONFIG_DIR in speck/.cache/provider-<name> (0700), and passes stops and exit codes through. The run record's agent is the provider name; the board gives builder_label (DeepSeek) and the panel uses it.\n- Deliberately not `--bare`, against the ticket's note: checked with the real Claude Code 2.1.301, `-p` with `--bare` doesn't expand /speck-build and offers only Bash, Edit and Read. Without it, against a local stand-in API and with a logging proxy for any other traffic: the skill expanded, full tool set, `apiKeySource: ANTHROPIC_API_KEY`, every request went to the given address with only x-api-key (no Authorization), nothing through the proxy, and `--resume` continued the session. Recorded in the ticket's Notes. CLAUDE.md (which speck init makes import AGENTS.md) is then read as for any Claude Code build.\n- A reviewer started from inside a provider build gets back a clean environment: runLimited drops the provider's ANTHROPIC_* vars, CLAUDE_CONFIG_DIR and the marker (withoutProviderBuild), so a claude reviewer doesn't go to DeepSeek and codex still finds its sign-in under the real HOME, which is kept.\n- Known limit: the build's own commands run as the user (as any build's do), so they can read files in the user's home; the guarantee is about what Claude Code itself is signed in with and talks to.\n",
    "seconds": 49,
    "usage": {
      "input_tokens": 251402,
      "cached_input_tokens": 190848,
      "cache_write_input_tokens": 0,
      "output_tokens": 1205,
      "reasoning_output_tokens": 213
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T08:00:45.006Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "The passing 0391 AC1 tests cover model selection, launch records, stop propagation, automatic resume and panel naming. However, providerResumeCommand in scripts/provider-build.mjs:41 joins arguments without shell quoting, breaking manual resume when the installation path contains spaces."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "providerBuildEnv strips Anthropic and Claude sign-in variables, sets providerVars and an isolated CLAUDE_CONFIG_DIR. providerStartWords restricts settings and MCP access while retaining project instructions and skills. Passing AC2 tests exercise the launcher environment and reviewer cleanup."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "ticket-builder.mjs providerPlan checks Claude Code and the machine's provider key before launch; launchPlan retains and reports the reason. install.mjs providerChecks supplies doctor checks. Passing AC3 tests cover missing prerequisites and remediation."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The passing '0391 AC4: any provider in speck’s list builds the same way' test supplies Acme, saves its key, launches the wrapper and verifies its address, model, key and resume arguments."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "README.md explicitly says 'DeepSeek is tested' and documents builder: deepseek, key setup and model defaults. Reported tests: 537 passed, zero failed, three skipped; no existing tests were weakened."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/provider-build.mjs:41",
        "issue": "providerResumeCommand constructs a shell command with .join(' ') without quoting PROVIDER_SCRIPT. A checkout under a path such as '/home/me/My Projects/speck' builds successfully using argument arrays, but its displayed manual resume command makes Node try to execute '/home/me/My'. Shell metacharacters in the path are also interpreted.",
        "suggested_fix": "Shell-quote the command's literal arguments while preserving session placeholder substitution. Add a regression test proving that the generated manual resume command preserves a script path containing spaces and shell metacharacters.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "DeepSeek builds have model selection, credential isolation, prerequisite checks and passing tests. One fix is needed before merge: the manual resume command breaks when the installation path contains spaces."
  }
}
```

</details>

<details><summary>Round 2 · codex · approve</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "9cf7bb341abfad0c9904c132f6716f4277db2d9d",
    "session": "continued",
    "thread_id": "01a167c6-105c-7b43-8405-57807ce77ca5",
    "builder_response": "- Tests run: test/run-provider-0391.test.mjs, test/run-builder-0312.test.mjs, test/review-provider-0390.test.mjs (and the commands.checks files, which speck test --files adds)\n- F1: fixed. providerResumeCommand (scripts/provider-build.mjs) now shell-quotes every word (single quotes for any word with characters outside a safe set), leaving {session} for resumeHint to fill in quoted. It takes the script path as a parameter (default PROVIDER_SCRIPT), and the 0391 AC1 resume test runs the command through `sh` with a path containing spaces, a quote and `$(…)`/`;`, checking it comes back as one word and nothing in it runs.\n",
    "seconds": 25,
    "usage": {
      "input_tokens": 378690,
      "cached_input_tokens": 312576,
      "cache_write_input_tokens": 0,
      "output_tokens": 1883,
      "reasoning_output_tokens": 213
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T08:01:42.566Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "providerStartWords, resumeFor and providerResumeCommand preserve provider/model selection and session handling. Passing AC1 tests cover launch, stops, resume, hand-back arguments, run records and panel naming. The updated manual-resume test exercises shell quoting with spaces, quotes and shell metacharacters."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "providerBuildEnv removes Anthropic/Claude sign-in variables and supplies providerVars plus an isolated CLAUDE_CONFIG_DIR. Project-only settings and strict MCP configuration retain project instructions and skills. Passing AC2 tests cover launcher credentials, model routing, isolation flags and reviewer environment cleanup."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "ticket-builder.mjs providerPlan checks installation and key availability before launch; launchPlan reports and retains failure reasons. install.mjs providerChecks supplies doctor checks. Passing AC3 tests cover missing prerequisites and corrective instructions."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The passing AC4 test supplies its own Acme provider and exercises key lookup, launcher execution, provider address/model selection and resume arguments."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "README.md names DeepSeek as a tested builder and documents setup and defaults. The current test output confirms 138 passed, zero failed and three skipped; the previous round also had zero failures."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/provider-build.mjs:45",
        "issue": "The manual resume command previously failed to quote the launcher path.",
        "suggested_fix": "Implemented: providerResumeCommand shell-quotes literal arguments, with a passing regression test that checks argument preservation through sh.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "DeepSeek builds meet all five criteria. The manual resume quoting problem is fixed and covered by a regression test. No blocking findings remain."
  }
}
```

</details>

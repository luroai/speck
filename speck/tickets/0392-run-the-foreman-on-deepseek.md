---
id: "0392"
title: "Run the Foreman on DeepSeek"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: high               # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-18-use-a-model-provider-through-your-own-api-key.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0391"]                # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T08:05:16.858Z"
approved: "2026-10-23T08:13:12.714Z"

---
# 0392 · Run the Foreman on DeepSeek

**Status:** 👍 approved

## Problem
The Foreman runs on Claude Code, Codex or Cursor. Someone building with DeepSeek can't run the Foreman on it too.

## Outcome
`foreman: deepseek` runs the Foreman on DeepSeek's models.

## Acceptance criteria
1. With `foreman: deepseek`, speck run starts the Foreman on DeepSeek's model named in foreman_model, or DeepSeek's default model when that's blank. foreman_effort isn't passed. It looks into a stop and takes one action, exactly as the Claude Code Foreman does.
2. It may do only what the Claude Code Foreman may: read files, and run speck's commands and read-only git commands. It gets DeepSeek's address and this machine's DeepSeek key, and nothing else that would let it sign in.
3. With no DeepSeek key set, or Claude Code not installed, the Foreman isn't started, and speck run says why. A blank foreman with `builder: deepseek` uses DeepSeek, as it does for Codex and Cursor builders (0333).
4. Any provider in speck's list runs the Foreman the same way, which a test checks with a provider of its own.
5. No test that passed before this change fails.

## Out of scope
- Settings: 0393.

## Notes
- speck runs a provider's models through Claude Code, pointed at the provider's Anthropic-compatible address with the provider's key. Settings, config, logs and the panel name the provider, such as DeepSeek, never Claude Code. Only `speck doctor` and the README say Claude Code must be installed to run it.
- Checked 2026-10-23: DeepSeek's API accepts Anthropic's message format at `https://api.deepseek.com/anthropic`, with the key in `ANTHROPIC_API_KEY`, and its guide names `deepseek-v4-pro` and `deepseek-v4-flash` (https://api-docs.deepseek.com/guides/anthropic_api).
- Checked 2026-10-23: `claude --help` (2.1.301) says `--bare` takes Anthropic auth strictly from `ANTHROPIC_API_KEY` or an apiKeyHelper, and never reads OAuth or the keychain. It also skips hooks, plugins and CLAUDE.md discovery, but skills still resolve by `/skill-name`.
- Start from `foremanArgv` in `scripts/foreman-agent.mjs`, whose Claude Code command already limits the Foreman to reading and to speck and read-only git commands, adding `--bare`.
- Waits for 0391.
- Failing before this build: none
- Self-check: made the docs name deepseek as a Foreman agent (README, brief, config template) with a test of those facts, and made the no-key test independent of whether Claude Code is installed on the machine running it.

## In plain words
The Foreman, which looks into work that stops for a reason speck has no steps for, can now run on DeepSeek. Set the Foreman to deepseek, or leave it blank while DeepSeek builds your tickets, and it uses DeepSeek's model (the one you name for the Foreman, or DeepSeek's default). It may only read and run speck's own commands and read-only git commands, as before, and it gets your DeepSeek key but no other sign-in or key on your machine.

To see it, save a DeepSeek key with `speck keys set deepseek`, set the Foreman to deepseek, turn fixing on, and let a build stop unexpectedly: speck run says "the Foreman (DeepSeek) is looking into it". Without the key, or without Claude Code installed, it says why the Foreman couldn't start instead.

Worth watching: Settings doesn't offer DeepSeek for the Foreman yet (that's the next ticket), and a stop the Foreman couldn't start on isn't looked into again until the ticket changes.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): changes requested: F1 The final documentation test requires exact prose, including "It runs on" and "or a model provider's name, such as deepseek", and a particular ordering of agent names.; F2 The new Foreman route uses providerBuildEnv, which retains credentials such as AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, GOOGLE_APPLICATION_CREDENTIALS and GH_TOKEN.
Round 2 (codex): changes requested.
Round 3 (codex): approve.

## Delivery log
- Review rounds: 3
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 665,382
- Elapsed since build started: 8 min
- Changed lines: 108 (limit 5000)
Follow-ups:
- Inbox: speck/ideas/2026-10-23-look-into-a-stop-again-once-the-foreman-can-start.md — a stop the Foreman couldn't start on (no key, no Claude Code) counts as tried, so setting the key doesn't bring it back until new commits.
- Skipped, covered by 0393: Settings' Foreman list doesn't offer deepseek yet, and its Foreman model list would read Codex's models while foreman is deepseek.
- Known limit: if the key is removed between speck run's check and the Foreman starting, the launcher stops with its own message, which goes to the Foreman's log rather than speck run's output.

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
    "reviewed_sha": "fd85bfd45b4d00255ca6a0e531a79b9a98861b30",
    "session": "fresh",
    "thread_id": "01a167ce-efff-7382-82b3-1a98e3fd5d27",
    "builder_response": "- Tests run: test/foreman-provider-0392.test.mjs test/readme-0250.test.mjs test/brief-0225.test.mjs test/review-0280.test.mjs test/run-cursor-0290.test.mjs test/run-codex-0289.test.mjs test/foreman-cursor-0333.test.mjs test/foreman-agent-0287.test.mjs test/settings-foreman-0348.test.mjs test/run-provider-0391.test.mjs (plus the commands.checks files speck test adds)\n- Round 1. A provider's Foreman starts through provider-build.mjs (0391's launcher, which reads the key and builds the environment), with Claude Code's own Foreman words plus --bare, --setting-sources=project and --strict-mcp-config. speck run checks Claude Code and the key before starting it. Settings is out of scope (0393): its Foreman list still offers only claude, codex and cursor.\n",
    "seconds": 42,
    "usage": {
      "input_tokens": 112716,
      "cached_input_tokens": 68352,
      "cache_write_input_tokens": 0,
      "output_tokens": 957,
      "reasoning_output_tokens": 135
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T08:10:19.159Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "foremanArgv and foremanAgentQueue in scripts/foreman-agent.mjs select the provider model, omit effort and preserve the existing brief and action handling. The two AC1 tests passed."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "The command preserves Claude Foreman permissions, but providerBuildEnv in scripts/provider-build.mjs inherits all environment variables except its SIGN_IN blacklist. Other credentials remain available; the AC2 test checks only selected Anthropic credentials."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "foremanCantStart checks installation and the machine key; queue launch refuses to start and reports the reason. foremanAgentOf inherits a DeepSeek builder. The corresponding AC3 tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The AC4 test supplies an independent Acme provider, exercises model selection, key lookup, launcher execution and queue naming, and passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The reported targeted run passed 200 tests, with three skipped and no failures. Existing Foreman and provider test files were included."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/foreman-provider-0392.test.mjs",
        "issue": "The final documentation test requires exact prose, including \"It runs on\" and \"or a model provider's name, such as deepseek\", and a particular ordering of agent names. Harmless documentation edits would fail it, contrary to the review rules.",
        "suggested_fix": "Check the documented setting and provider names without requiring surrounding wording or list order.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/provider-build.mjs",
        "issue": "The new Foreman route uses providerBuildEnv, which retains credentials such as AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, GOOGLE_APPLICATION_CREDENTIALS and GH_TOKEN. This violates the requirement to give it no other means of signing in. --bare does not remove these variables from the process environment.",
        "suggested_fix": "Give provider Foremen an environment containing only necessary runtime variables, the provider credentials and the Foreman token. Add a test seeding other credentials and verifying they are absent. Preserve the existing builder environment behaviour.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "DeepSeek model selection, startup checks and generic provider support work in the reported tests. Approval is held because the Foreman inherits unrelated credentials and a documentation test locks down exact wording."
  }
}
```

</details>

<details><summary>Round 2 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "8b42fe51220b777d646cfcaaf6352d1a91acbce6",
    "session": "continued",
    "thread_id": "01a167ce-efff-7382-82b3-1a98e3fd5d27",
    "builder_response": "- Tests run: test/foreman-provider-0392.test.mjs test/readme-0250.test.mjs test/brief-0225.test.mjs test/review-0280.test.mjs test/run-cursor-0290.test.mjs test/run-codex-0289.test.mjs test/foreman-cursor-0333.test.mjs test/foreman-agent-0287.test.mjs test/settings-foreman-0348.test.mjs test/run-provider-0391.test.mjs test/review-provider-0390.test.mjs (plus the commands.checks files)\n- F1: fixed. The docs test now only checks that the README paragraph and the brief's table row naming the Foreman's settings mention deepseek, and that the template's foreman line does, with no wording or order.\n- F2: fixed. A provider's Foreman is started as `provider-build.mjs --foreman <name> <address> …` (FOREMAN_MODE), and gets providerForemanEnv: an allowlist of the reviewer's KEEP variables (PATH, locale, proxy, certificates), LC_*, HOME and XDG_CONFIG_HOME, git's name and email variables (so `speck foreman` can commit its note as the user) and SPECK_FOREMAN_RUN, plus its own CLAUDE_CONFIG_DIR and the provider's vars. The build's environment (providerBuildEnv) is unchanged. The AC2 test seeds AWS, Google, GitHub, OpenAI, Cursor, npm, GIT_ASKPASS and speck's panel token and checks none reaches Claude Code, and that PATH, HOME and git identity do. HOME is kept so git finds the user's identity and config; --bare means Claude Code reads no OAuth or keychain sign-in from it, and its Claude Code folder is its own.\n",
    "seconds": 29,
    "usage": {
      "input_tokens": 217688,
      "cached_input_tokens": 162944,
      "cache_write_input_tokens": 0,
      "output_tokens": 1720,
      "reasoning_output_tokens": 163
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T08:12:08.331Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/foreman-agent.mjs: foremanArgv selects foreman_model or the provider default, omits effort and preserves the existing Foreman brief and action handling. Both AC1 tests passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "foremanArgv preserves Claude Foreman permissions and adds --bare. scripts/provider-build.mjs now selects providerForemanEnv, which allowlists runtime and identity variables. The passing AC2 launcher test verifies unrelated credentials are removed."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "foremanCantStart and queue launch prevent startup and explain missing prerequisites. foremanAgentOf inherits the DeepSeek builder. The corresponding AC3 tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The passing AC4 test supplies Acme as an independent provider and exercises model selection, key lookup, launcher execution and queue naming."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The reported targeted run passed 209 tests, skipped three and had no failures, including existing Foreman, provider builder and provider reviewer tests."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/foreman-provider-0392.test.mjs",
        "issue": "The documentation test still requires prose: the brief lookup uses '`foreman_fixing` of'. Removing or rephrasing 'of' would fail the test even if every setting and provider fact remained correct. The review rules explicitly prohibit tests of exact documentation wording.",
        "suggested_fix": "Use only the setting name '`foreman_fixing`' to locate the relevant passage, without requiring ' of'.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/provider-build.mjs",
        "issue": "Resolved: provider Foremen now use a dedicated environment allowlist rather than inheriting unrelated credentials. Existing builder environment behaviour is preserved.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "The functionality meets all five criteria, and the credential issue is fixed. One small test correction remains: the documentation check still depends on an ordinary word rather than just the documented facts."
  }
}
```

</details>

<details><summary>Round 3 · codex · approve</summary>

```json
{
  "meta": {
    "round": 3,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "e6386d2e30dc11afaff071b7a17e7cea3418df7e",
    "session": "continued",
    "thread_id": "01a167ce-efff-7382-82b3-1a98e3fd5d27",
    "builder_response": "- Tests run: test/foreman-provider-0392.test.mjs (plus the commands.checks files)\n- F1: fixed. The brief's passage is now found by the setting name `foreman_model` alone, with no other words.\n",
    "seconds": 27,
    "usage": {
      "input_tokens": 329942,
      "cached_input_tokens": 272768,
      "cache_write_input_tokens": 0,
      "output_tokens": 2359,
      "reasoning_output_tokens": 163
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T08:12:50.350Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/foreman-agent.mjs: foremanArgv selects the configured or default provider model, omits effort and preserves the Foreman brief and action handling. Both AC1 tests passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "foremanArgv preserves Claude Foreman permissions with --bare; providerForemanEnv supplies an allowlisted environment and provider credentials. Both AC2 tests passed, including credential exclusion through the launcher."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "foremanCantStart prevents startup with missing prerequisites and reports why. foremanAgentOf inherits a DeepSeek builder. The corresponding AC3 tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The passing AC4 test exercises an independent Acme provider through model selection, key lookup, launcher execution and queue naming."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "This round passed 117 tests with three skipped and no failures. The implementation is unchanged since round 2, whose broader targeted run also passed."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "test/foreman-provider-0392.test.mjs",
        "issue": "Resolved: documentation checks now identify settings and provider names without requiring surrounding prose or list order.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "scripts/provider-build.mjs",
        "issue": "Resolved: provider Foremen use a dedicated environment allowlist that excludes unrelated credentials, preserving existing builder behaviour.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "DeepSeek Foremen use the selected model, retain existing action restrictions and report missing prerequisites. Credential isolation and documentation tests are fixed. All criteria pass, with no blocking findings remaining."
  }
}
```

</details>

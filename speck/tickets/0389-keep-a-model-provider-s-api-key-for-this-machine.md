---
id: "0389"
title: "Keep a model provider's API key for this machine"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0380"]                # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T07:26:14.303Z"

---
# 0389 · Keep a model provider's API key for this machine

**Status:** 🔍 reviewing

## Problem
To build or review with a model provider such as DeepSeek, speck needs the provider's API key. A key is a secret: it must never be committed, shown, logged or seen by other processes.

## Outcome
This machine keeps an API key for each model provider speck knows, safely, and speck can hand it to the agents it runs.

## Acceptance criteria
1. `speck keys set <provider>` reads the key from its input, with nothing echoed when typed in a terminal, never from the command line. It saves the key for this machine in a file git ignores, which only its owner can read or write. `speck keys remove <provider>` deletes it. A provider speck doesn't know is refused, naming those it does.
2. The key is never printed, logged, or written to a run record, ticket, review pack, speck/config.yml or any command line. `speck keys` lists each known provider and whether its key is set, and nothing more.
3. Every checkout and worktree of the repo reads the same key from the main checkout, as 0386's settings are read.
4. speck knows its providers from one list, each with a name, a label, an Anthropic-compatible address, its models and a default model. DeepSeek is the first. A provider added to that list gets a key the same way, which a test checks with one of its own.
5. The README says where keys are kept and how to set and remove them, and lists the providers tested with speck: DeepSeek (checked by review). No test that passed before this change fails.

## Out of scope
- Using the key: 0390, 0391 and 0392. The panel's key field: 0393.
- Providers you add yourself in your own settings. New providers are added to speck's list.

## Notes
- speck runs a provider's models through Claude Code, pointed at the provider's Anthropic-compatible address with the provider's key. Settings, config, logs and the panel name the provider, such as DeepSeek, never Claude Code. Only `speck doctor` and the README say Claude Code must be installed to run it.
- Checked 2026-10-23: DeepSeek's API accepts Anthropic's message format at `https://api.deepseek.com/anthropic`, with the key in `ANTHROPIC_API_KEY`, and its guide names `deepseek-v4-pro` and `deepseek-v4-flash` (https://api-docs.deepseek.com/guides/anthropic_api).
- Checked 2026-10-23: `claude --help` (2.1.301) says `--bare` takes Anthropic auth strictly from `ANTHROPIC_API_KEY` or an apiKeyHelper, and never reads OAuth or the keychain. It also skips hooks, plugins and CLAUDE.md discovery, but skills still resolve by `/skill-name`.
- Keep the key next to this machine's settings from 0386, in the main checkout's `speck/.cache/machine/`, in a file of its own with mode 0600.
- For 0.14.0: waits for 0380 (0.13.1), which waits for 0375 and 0386.
- Failing before this build: none
- Keys are kept in one file, `speck/.cache/machine/keys.json`, mode 0600, written through a 0600 temporary file and renamed. In a terminal, a `sh` reads the line with `stty -echo` and a trap that turns echo back on however it ends, so the key comes back on its output and never on a command line.
- Self-check: a closed input now gives "No key was given" rather than a stack trace, and a failed write removes its temporary file so no copy of a key is left behind.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

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
    "reviewed_sha": "6c071c5c0ccecb11687f8e4eb3825a420d8f90a2",
    "session": "fresh",
    "thread_id": "01a167aa-fbb7-7b92-85e0-a1b492e3aab0",
    "builder_response": "- Tests run: test/keys-0389.test.mjs (with the commands.checks files speck test --files adds)\n- The terminal test (AC1) runs the real CLI under a pty through python3, types the key and checks it isn't echoed and that echo is on afterwards. I checked it fails when stty -echo is taken out.\n- No visual change, so no pictures.\n",
    "seconds": 40,
    "usage": {
      "input_tokens": 103637,
      "cached_input_tokens": 63744,
      "cache_write_input_tokens": 0,
      "output_tokens": 854,
      "reasoning_output_tokens": 78
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T07:31:00.889Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "scripts/keys.mjs readKeyInput displays the prompt before spawning the shell that disables terminal echo. Input pasted immediately after the prompt can therefore be shown. Passing tests cover storage permissions, removal, unknown providers and normal terminal entry, but the terminal test waits 0.2 seconds before typing."
      },
      {
        "id": 2,
        "status": "fail",
        "evidence": "keysStatus and writeKeys keep secrets out of normal output and other records, as covered by the passing AC2 test. However, readKeyInput's terminal timing window can expose the key on screen."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "keysFile uses machineConfigFile to resolve the main checkout. The passing AC3 test saves through a worktree and checks shared reads and removal."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "scripts/providers.mjs defines the single provider list with all required fields. Both passing AC4 tests check DeepSeek's definition and key storage for an injected additional provider."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "README's “Model providers' API keys” paragraph describes the storage location, set and remove commands, and DeepSeek as tested. Reported checks passed: 120 passed, zero failed, three skipped. The added documentation test nevertheless violates the review rules; see F2."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/keys.mjs:100",
        "issue": "The secret-entry prompt appears before terminal echo is disabled. A user or terminal automation pasting as soon as the prompt appears can expose the key. The terminal test hides this window by sleeping for 0.2 seconds after seeing the prompt.",
        "suggested_fix": "Disable echo successfully before displaying the prompt, retaining reliable restoration on exit. Update the terminal test to send input immediately upon seeing the prompt, without the artificial delay.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "test/keys-0389.test.mjs:197",
        "issue": "The README test requires the exact prose “tested with speck so far: DeepSeek”. This checks document wording, explicitly prohibited by the review rules, and will fail on harmless editorial changes.",
        "suggested_fix": "Remove the prose assertion and assess the tested-provider statement by review, as AC5 specifies. Assertions for command names and the storage path may remain.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "Key storage, removal and sharing across worktrees are implemented and covered by passing tests. Two fixes are needed before approval: prevent a fast paste from exposing the key before terminal echo is disabled, and remove a test that locks README prose to exact wording."
  }
}
```

</details>

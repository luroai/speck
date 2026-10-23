---
id: "0389"
title: "Keep a model provider's API key for this machine"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

---
# 0389 · Keep a model provider's API key for this machine

**Status:** 📋 ready

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

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

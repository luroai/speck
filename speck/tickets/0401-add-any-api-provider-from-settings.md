---
id: "0401"
title: "Add any API provider from Settings"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: high                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-23-add-any-api-provider-from-settings.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T11:24:39.331Z"

---
# 0401 · Add any API provider from Settings

**Status:** 🔨 building

## Problem
"Add an agent" offers DeepSeek as a fixed provider row. Anyone with another OpenAI- or Anthropic-compatible API has nowhere to enter its name, address, type and key.

## Outcome
Settings lets you add any API provider by name, base URL, API type and key, and use it like DeepSeek.

## Acceptance criteria
1. With "Add an agent" open, API providers are added through a form with the provider's name, base URL, API type (`OpenAI` or `Anthropic`), API key, and at least one model name. There is no DeepSeek-branded offer as the only way to add a provider.
2. Saving the form keeps the provider and its key for this machine only, never in git and never shown again once saved, adds it to your agents, and makes no commit. The provider then appears in Your agents and in each role's model list, grouped by the name you gave it, with the models you entered.
3. An Anthropic-type provider builds, reviews and runs the Foreman the same way DeepSeek does today: through Claude Code, pointed at the base URL with this machine's key, with the key never on a command line, in a log, or in a ticket.
4. An OpenAI-type provider is refused for build, review and Foreman until a later ticket runs it, with a plain message that only Anthropic-type providers run so far. Saving and listing it still work as in criteria 1 and 2.
5. A provider speck already knows, such as DeepSeek, still works for anyone who already added it. No test that passed before this change fails, except a check that "Add an agent" offers only DeepSeek as the provider, which is changed to check criterion 1.

## Out of scope
- Running an OpenAI-type provider for build, review or Foreman: a follow-up once this has shipped.
- Editing a custom provider's name, URL, type or models after it is saved: remove it and add it again.
- Typing a model that isn't on the provider's list after it is added: the inbox note from 0400.

## Notes
- Asked for 2026-10-23 from the Settings "Add an agent" DeepSeek offer. Follows 0389's out-of-scope note that providers you add yourself were left for later.
- Assumption: you enter at least one model name when adding, so 0400's role lists have models to offer. The first is the provider's default.
- Assumption: Anthropic type uses the existing Claude Code path (`ANTHROPIC_BASE_URL` and key). OpenAI type is stored and shown, and a later ticket makes it run.
- Checked 2026-10-23: `PROVIDERS` in `scripts/providers.mjs` holds only DeepSeek. `addRows` in `templates/panel.html` offers each known provider that isn't yours with a key field (0399). `providerVars` in `scripts/provider-review.mjs` only sets Anthropic variables.
- Risk is high: it stores API keys, as 0389 did.
- Failing before this build: none
- Built the code before its tests this time, so the new tests weren't seen failing first; each was checked against the change instead.
- Self-check: saving or removing one provider's key now keeps every other key in the file, even one the provider list doesn't know; a base URL must use https unless it's on this machine, so the key is never sent in the clear; a base URL with a user name, password, ? or # is refused, as it goes on a build's command line.
- Changes `templates/panel.html` and the provider/key scripts (`scripts/providers.mjs`, `scripts/keys.mjs`, `scripts/settings.mjs`, `scripts/your-agents.mjs`, `scripts/provider-review.mjs`). No open ticket changes those.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

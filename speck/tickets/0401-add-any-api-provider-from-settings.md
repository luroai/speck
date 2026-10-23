---
id: "0401"
title: "Add any API provider from Settings"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

**Status:** 🔍 reviewing

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
In Settings, "Add an agent" now has an "Add an API provider" form. You give a provider's name, its web address, whether its API is OpenAI- or Anthropic-style, your key and the names of its models. Once saved, it shows up in Your agents and in the builder, reviewer and Foreman lists under the name you gave it. The provider and its key stay on your machine and never go into the project's history. Anthropic-style providers build, review and run the Foreman just as DeepSeek does. OpenAI-style ones are saved and listed, but speck says it can't run them yet. To see it, open Settings, press Add an agent, and fill in the form at the bottom. Worth watching: an OpenAI-style provider can still be picked for a role, and you only find out it can't run when work starts.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: run OpenAI-type providers (speck/ideas/2026-10-23-run-openai-type-providers.md); flag OpenAI-type providers in the role lists (speck/ideas/2026-10-23-flag-openai-type-providers-in-the-role-lists.md).

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
    "reviewed_sha": "47e122e1b835d737e2df809000a23af4cbdfead0",
    "session": "fresh",
    "thread_id": "01a16889-f3d4-7c53-aac8-bbe749b0b2f0",
    "builder_response": "- Tests run: test/providers-0401.test.mjs test/settings-agents-0399.test.mjs test/settings-provider-0393.test.mjs test/settings-roles-0400.test.mjs test/keys-0389.test.mjs test/review-provider-0390.test.mjs test/run-provider-0391.test.mjs test/foreman-provider-0392.test.mjs (plus the repo checks). 21 more test files that use the changed modules also passed (339 tests), run separately.\n- Design: providers you add are kept in speck/.cache/machine/providers.json (git-ignored) by scripts/custom-providers.mjs. knownProviders(repo) = speck's own (DeepSeek) then yours, and replaces the PROVIDERS default everywhere a provider is looked up. OpenAI-type providers are refused by cantRun() in buildPlan, providerReady, foremanCantStart and provider-build.mjs's main.\n- No existing test needed changing for criterion 5: \"Add an agent\" keeps DeepSeek's row and adds the form beside it.\n",
    "seconds": 38,
    "usage": {
      "input_tokens": 213674,
      "cached_input_tokens": 152192,
      "cache_write_input_tokens": 0,
      "output_tokens": 1010,
      "reasoning_output_tokens": 146
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T11:34:31.357Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html providerFormRow offers all six required fields and both API types. The two AC1 form tests passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "The AC2 tests passed, checking ignored machine storage, key exclusion from responses, no commit, agent membership and models in each role's list."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The AC3 test passed: buildPlan starts the provider wrapper, a fake Claude receives the URL and key through environment variables, and review and Foreman use the existing provider environment paths."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "cantRun guards buildPlan, providerReady, foremanCantStart and the provider wrapper. The AC4 test passed and confirms Claude never starts for an OpenAI provider."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The AC5 test passed, preserving DeepSeek's key and build address beside a custom provider. The supplied regression run reports 195 passed, zero failed and three skipped."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/custom-providers.mjs",
        "issue": "saveCustomProvider silently replaces an existing provider with the same normalised name. panelProviderAddRequest permits this even while that provider is assigned to a role. Submitting the Add form again can therefore change its address, type and models without removing it first, contrary to the explicit scope restriction. It also writes the replacement before saving the new key: if key saving fails, the existing key remains associated with the replacement address.",
        "suggested_fix": "Refuse additions whose normalised name belongs to a provider still in Your agents, before writing anything. Permit replacement only after the required removal, and ensure a failed key save cannot leave an existing provider redirected to a new address. Add tests for duplicate additions and key-save failure.",
        "state": "open"
      }
    ],
    "escalation_question": "",
    "summary": "The form, machine-only storage and provider execution paths are covered by passing tests. One issue blocks approval: adding a provider with an existing name silently changes its settings, including where its key is sent. Require removal before replacement and preserve the existing settings if saving fails."
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
    "reviewed_sha": "c30d508701c1dec513843844e3affdb8f61a63e1",
    "session": "continued",
    "thread_id": "01a16889-f3d4-7c53-aac8-bbe749b0b2f0",
    "builder_response": "- Tests run: test/providers-0401.test.mjs test/settings-agents-0399.test.mjs test/settings-provider-0393.test.mjs test/settings-roles-0400.test.mjs test/keys-0389.test.mjs (plus the repo checks)\n- F1: fixed. scripts/provider-form.mjs panelProviderAddRequest now refuses, before writing anything, a provider whose name is already one of your agents (\"remove it from Your agents, then add it again\"). Once removed, adding it again replaces it. The key is now saved first, then the provider; if saving the provider fails, the old key is put back (or the new one removed when there was none), so a key is never left with an address it wasn't saved for. The provider is then added through panelAgentRequest. New tests: \"a provider that is one of your agents isn't replaced…\" and \"when the provider can't be saved, its key is put back…\".\n",
    "seconds": 26,
    "usage": {
      "input_tokens": 346722,
      "cached_input_tokens": 278400,
      "cache_write_input_tokens": 0,
      "output_tokens": 1656,
      "reasoning_output_tokens": 179
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T11:35:46.191Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "templates/panel.html providerFormRow supplies name, base URL, API type, key and models. Both AC1 form tests passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "panelProviderAddRequest saves machine-local provider details and keys, then adds the agent. Passing AC2 tests cover ignored storage, no commit, hidden keys, role lists, duplicate refusal and rollback after provider-save failure."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "The passing AC3 test exercises the build wrapper with fake Claude and checks review and Foreman arguments and environments. The existing provider paths supply the key through environment variables."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "cantRun guards buildPlan, providerReady, foremanCantStart and the provider wrapper. The passing AC4 test verifies saving and listing work while execution is refused with the required message."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The passing AC5 test verifies DeepSeek's key and build address remain intact alongside custom providers. Supplied test runs report no failures; whole-suite verification remains the shipping gate."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "scripts/provider-form.mjs",
        "issue": "Previously, adding an existing provider name silently replaced its settings before saving the new key.",
        "suggested_fix": "Implemented: refuse replacement while the provider is in Your agents, save the key before provider details, and restore the previous key if saving those details fails. Both regression tests passed.",
        "state": "resolved"
      }
    ],
    "escalation_question": "",
    "summary": "Settings now supports custom API providers, keeps their keys on this machine and runs Anthropic-compatible providers. OpenAI-compatible providers can be saved but cannot run yet. The replacement issue is fixed, all five criteria pass, and the change is ready for the owner's merge decision."
  }
}
```

</details>

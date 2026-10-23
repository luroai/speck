---
id: "0393"
title: "Offer DeepSeek in Settings"                # one outcome, no "and"
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
after: ["0392","0387"]                # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T08:16:16.005Z"
approved: "2026-10-23T08:33:10.954Z"

---
# 0393 · Offer DeepSeek in Settings

**Status:** 👍 approved

## Problem
DeepSeek can be set as builder, reviewer or Foreman from the command line, but Settings doesn't offer it, and there's nowhere in the panel to give its API key.

## Outcome
Settings offers DeepSeek like any other agent, with its models and a field for its key.

## Acceptance criteria
1. The builder, reviewer and Foreman lists in Settings offer DeepSeek, labelled DeepSeek, with no mention of Claude Code. Choosing it lists DeepSeek's models for the model setting.
2. While DeepSeek is chosen for any role, Settings shows whether this machine has a DeepSeek key and has a field to enter or replace it. The field never shows a saved key, and saving a key makes no commit and never sends the key back to the page.
3. Choosing DeepSeek with no key set says the key is needed before it can run, and the panel's checks, like `speck doctor`'s, say when Claude Code isn't installed.
4. Any provider in speck's list appears in Settings the same way, which a test checks with a provider of its own.
5. No test that passed before this change fails.

## Out of scope
- Reading a provider's models from its own API. Settings uses the models in speck's list.

## Notes
- speck runs a provider's models through Claude Code, pointed at the provider's Anthropic-compatible address with the provider's key. Settings, config, logs and the panel name the provider, such as DeepSeek, never Claude Code. Only `speck doctor` and the README say Claude Code must be installed to run it.
- Checked 2026-10-23: DeepSeek's API accepts Anthropic's message format at `https://api.deepseek.com/anthropic`, with the key in `ANTHROPIC_API_KEY`, and its guide names `deepseek-v4-pro` and `deepseek-v4-flash` (https://api-docs.deepseek.com/guides/anthropic_api).
- Checked 2026-10-23: `claude --help` (2.1.301) says `--bare` takes Anthropic auth strictly from `ANTHROPIC_API_KEY` or an apiKeyHelper, and never reads OAuth or the keychain. It also skips hooks, plugins and CLAUDE.md discovery, but skills still resolve by `/skill-name`.
- Builds on 0387's Save for your own settings and 0369's model lists (`agentModels` in `scripts/settings.mjs`).
- Waits for 0392, and for 0387, which also changes Settings in `templates/panel.html`.
- Failing before this build: none
- Self-check: a provider already chosen while Claude Code isn't installed is still offered but now says it can't run; the check uses this machine's own value as the one set now, as Settings shows it; existing tests that pinned the builder, reviewer and Foreman lists (0258, 0287, 0293) now include deepseek.

## In plain words
Settings now offers DeepSeek as the builder, the reviewer and the Foreman, listed by its own name, with DeepSeek's two models to pick from. While DeepSeek is chosen anywhere, a new API keys box says whether this computer has a DeepSeek key and lets you paste one in or replace it. The box never shows a saved key, and saving it keeps the key on this computer only, without a commit.

To see it, open Settings, pick DeepSeek as the reviewer, and the API keys box appears at the bottom. With no key saved, it says DeepSeek can't run until you enter one.

Worth keeping an eye on: if Claude Code isn't installed, DeepSeek isn't offered and Settings says why, because speck runs DeepSeek through it. Switching the builder to DeepSeek from the command line now also sets the build command DeepSeek needs, as the panel does.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.
Round 2 (codex, merge round): approve.

## Delivery log
- Review rounds: 2, 1 of them a merge round
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 573,309
- Elapsed since build started: 17 min
- Changed lines: 254 (limit 5000)
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
Follow-ups:
- speck doctor checks a DeepSeek builder or reviewer but not a DeepSeek Foreman: saved to the inbox as `speck/ideas/2026-10-23-check-the-foreman-s-model-provider-in-speck-doctor.md`.
- Known limit: with a model provider as the reviewer, `reviewer_effort` still offers speck's efforts, though a provider's reviewer isn't given one. Tidy-up only, no idea note.

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
    "reviewed_sha": "27c1aefff79de31ff0407eff680802f53bf5ba40",
    "session": "fresh",
    "thread_id": "01a167dd-a7d4-78f2-ba00-a05d316c3865",
    "builder_response": "- Tests run: test/settings-provider-0393.test.mjs test/panel-0258.test.mjs test/foreman-agent-0287.test.mjs test/builder-switch-0293.test.mjs test/settings-models-0369.test.mjs (plus the commands.checks files speck test adds)\n- Existing tests changed: 0258, 0287 and 0293 pinned the exact reviewer, Foreman and builder lists; each now also expects deepseek, which AC1 adds. No assertion was removed.\n- A wider run of every test file touching Settings, config, keys, providers and the panel's page (48 files, 629 tests) passed apart from those three, now fixed.\n- Pictures taken of Settings with DeepSeek as reviewer, light and dark, from a throwaway repo.\n",
    "seconds": 45,
    "usage": {
      "input_tokens": 193247,
      "cached_input_tokens": 84992,
      "cache_write_input_tokens": 0,
      "output_tokens": 771,
      "reasoning_output_tokens": 84
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T08:26:27.239Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/settings.mjs offers providers for all three roles and supplies their registered models. templates/panel.html uses provider labels and model lists. Three passing 0393 AC1 tests cover choices, labels, models and saving the builder."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "panelKeyRequest saves through the existing machine-only key store and returns status without the key. The HTTP route checks origin and token. Passing 0393 AC2 tests cover empty password fields, replacement status, request bodies, clearing after saving, no commit and no key in responses."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "keyRow warns that a missing key prevents running. readyReviewers checks Claude Code installation and preserves an already selected provider with an explanation. Both 0393 AC3 tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Provider choices, labels, models and key fields derive from the provider registry. The passing 0393 AC4 test supplies TestCo and exercises server output and page behaviour."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The recorded run reports 162 passed, zero failed and three skipped across 165 tests. Existing list assertions were updated to include DeepSeek without removing checks. No unrelated regression is evident in the change."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Settings now offers DeepSeek for building, reviewing and Foreman work, with its models and a machine-only API key field. Key saving keeps secrets out of responses and commits. Missing keys and required software are explained. The relevant tests pass, and I found no blocking issues."
  }
}
```

</details>

<details><summary>Round 2 · codex · approve · merge round</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "5a6b99c10a49ff409290d88e6c8ef850afd50401",
    "merge": true,
    "session": "continued",
    "thread_id": "01a167dd-a7d4-78f2-ba00-a05d316c3865",
    "builder_response": "- Tests run: test/panel-0277.test.mjs test/settings-provider-0393.test.mjs test/panel-0258.test.mjs test/foreman-agent-0287.test.mjs test/builder-switch-0293.test.mjs test/settings-models-0369.test.mjs (plus the commands.checks files speck test adds). Also ran the 17 other real-browser Settings test files (panel-0136, 0140, 0150, 0160, 0161, 0163, 0268, 0273, 0274, 0281, 0309, 0364, 0365, 0371, 0372, 0373, 0385): 297 pass, 0 fail.\n- Handed back by speck run's ship queue: 0277 AC1–AC5 failed on the ticket as it would land. Merging main changed nothing (main is still 8f78a570, already in the branch), so the cause was this ticket's own change.\n- Why: the API key box was always in the view as a `.sgroup`, empty and hidden while no provider is chosen. 0277's real-browser check reads every `.sgroup`'s `h4`, and the empty box has none, so it threw.\n- Fix (templates/panel.html, drawKeys and keyRow): the box has the `sgroup` class only while it shows (the CSS hides `.keys[hidden]`). Its row now has an info button and explanation through settingInfo, like every other setting, so it follows 0277's layout rule when it shows. drawKeys applies the view's tip state, so the new explanation starts hidden.\n- New test in test/settings-provider-0393.test.mjs: the box is a group only while it shows, its row has an info button, and the explanation starts hidden.\n- Pictures taken again, light and dark, as the key row now has an info button.\n",
    "seconds": 26,
    "usage": {
      "input_tokens": 377971,
      "cached_input_tokens": 258432,
      "cache_write_input_tokens": 0,
      "output_tokens": 1320,
      "reasoning_output_tokens": 84
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T08:33:06.532Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "scripts/settings.mjs provides registry-based role choices and models; templates/panel.html displays provider labels and models. All three 0393 AC1 tests passed."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "panelKeyRequest saves through the machine-only key store and returns only status. keyRow and saveKey keep saved keys out of fields and clear successful submissions. All AC2 tests passed, including the new group visibility and info-button regression test."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "keyRow explains that a missing key prevents running; readyReviewers reports missing Claude Code, including for an already selected provider. Both 0393 AC3 tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "Provider choices, labels, models and key fields derive from the registry. The passing 0393 AC4 test exercises these with its own TestCo provider."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "The fresh recorded run reports 164 passed, zero failed and three skipped, including panel-0277. drawKeys now excludes the empty hidden box from Settings groups and gives visible key rows the standard info control. The builder also reports 297 passing real-browser Settings tests."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The Settings layout regression found during shipping is fixed, with a regression test added. DeepSeek choices, models and private key saving still meet the ticket’s requirements. The relevant tests pass, and there are no blocking findings."
  }
}
```

</details>

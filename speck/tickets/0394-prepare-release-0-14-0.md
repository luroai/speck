---
id: "0394"
title: "Prepare release 0.14.0"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-23-prepare-release-0-14-0.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0389","0390","0391","0392","0393"]                # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T08:36:02.999Z"

---
# 0394 · Prepare release 0.14.0

**Status:** 🔍 reviewing

## Problem
0389 to 0393 let you build, review and run the Foreman with DeepSeek's models through your own API key, kept safely for your machine and set in Settings. Anyone following the setup prompt, or updating speck on another machine, gets 0.13.1 without them.

## Outcome
speck is ready to be released as 0.14.0.

## Acceptance criteria
1. `package.json` has version `0.14.0`, and `speck init` prints `speck 0.14.0`.
2. `CHANGELOG.md` has a 0.14.0 section above the 0.13.1 one. It describes, in plain English, what someone using speck can now do since the `v0.13.1` tag, from the tickets shipped since (checked by review). The 0.13.1 and earlier sections are unchanged.
3. The README's and the brief's status lines say 0.14.0, a public preview, and the setup prompt still installs the latest release as 0253 left it.
4. `docs/releases/v0.14.0.md` holds the notes for the GitHub release page: one short paragraph saying this is a minor release that adds model providers through your own API key, with DeepSeek the first and the only one tested so far, what's new and why it matters, how to update (running the install command again in each project), anything that changes for someone upgrading from 0.13.1, and a link to the 0.14.0 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` as it is when this is built, the same way as 0307 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 0.14.0.

## Out of scope
- Creating the `v0.14.0` tag and publishing the GitHub release: the workflow from 0240 does both from `docs/releases/v0.14.0.md` when this lands on `main`.
- The landing page, which lives in its own repo.
- The provider changes themselves: 0389 to 0393.

## Notes
- Asked for 2026-10-23 as a minor release: it adds behaviour (DeepSeek as builder, reviewer and Foreman, `speck keys`, API keys in Settings) after 0.13.1 (0380).
- Covers every ticket shipped since `v0.13.1`: 0389 to 0393, which it waits for (`after:`), and any other that ships before this is built.
- The release notes say DeepSeek runs through your own DeepSeek API key, and that DeepSeek is the only provider tested so far. They don't need to say how speck runs it.
- After it ships, check that the `v0.14.0` tag and its GitHub release page appeared (0240's workflow, in the repository's Actions tab). If it failed, tag and publish by hand: `gh release create v0.14.0 --target main --title "speck 0.14.0" --notes-file docs/releases/v0.14.0.md`.
- Checked 2026-10-23: `package.json` is `0.13.1`, and the `v0.13.1` tag is on GitHub. 0375 and 0380 prepared 0.13.0 and 0.13.1 the same way.
- Relies on nothing outside this repo.
- Failing before this build: none
- Self-check: narrowed two claims in the release notes: a build still reads the repo's own Claude Code settings, so only your own aren't used, and `speck doctor` checks DeepSeek only when it builds or reviews. `test/release-0380.test.mjs`'s checks of the current version now follow `package.json`, and its figures check covers only the figures 0.13.1 was built from, as 0380 did for 0375.
- Pictures: none, because nothing anyone sees in the panel changes.

## In plain words
speck is ready to go out as version 0.14.0, a minor release that adds DeepSeek: with your own DeepSeek API key, saved once on your computer, DeepSeek can build tickets, review them and run the Foreman, chosen from the command line or in Settings. The changelog, the release notes and the version shown everywhere now say 0.14.0, and the "Built with speck" figures in the README are up to date. Once it ships, check that the 0.14.0 release page appears on GitHub; if it doesn't, the ticket's notes say how to publish it by hand.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->
- Follow-ups: none.

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
    "reviewed_sha": "8d69af15b36d428f71e07d7cfca310af4cbf4b0f",
    "session": "fresh",
    "thread_id": "01a167e9-9a1f-7e83-b24a-1f17c589c07b",
    "builder_response": "- Tests run: test/release-0394.test.mjs test/release-0380.test.mjs (plus the commands.checks files that speck test --files runs)\n- Earlier I also ran every test/release-*.test.mjs, test/readme-0250.test.mjs and test/docs-0267.test.mjs: all passed.\n- Shipped since v0.13.1: 0389, 0390, 0391, 0392 and 0393 (git log v0.13.1..main), all covered.\n- Built with speck figures worked out with test/support/figures.mjs at \"speck(0393): Offer DeepSeek in Settings\": 377 shipped, 16 cancelled, 12 minutes, 1 round, 188 in round 1.\n- test/release-0380.test.mjs's checks of the current version now follow package.json, and its figures check only the figures 0.13.1 was built from, as 0380 did for 0375.\n",
    "seconds": 39,
    "usage": {
      "input_tokens": 211447,
      "cached_input_tokens": 157440,
      "cache_write_input_tokens": 0,
      "output_tokens": 952,
      "reasoning_output_tokens": 64
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-23T08:39:23.979Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "package.json names 0.14.0. Both AC1 tests in test/release-0394.test.mjs passed, including running speck init and checking its output."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "CHANGELOG.md adds 0.14.0 above 0.13.1; the diff leaves all older sections unchanged. Its key storage, reviewing, building, Foreman and Settings descriptions cover shipped tickets 0389–0393, verified against git history and those tickets."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md and docs/brief.md status lines both say 0.14.0, a public preview. Both AC3 tests passed, including the unchanged latest-release setup prompt check."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/releases/v0.14.0.md introduces the minor release, own-key providers and DeepSeek's tested status; describes the shipped features, per-project update command and upgrade effects; and links to the correct changelog anchor. It uses no person's name. All three AC4 tests passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Independently recalculated current done-ticket figures: 377 shipped, 16 cancelled, 12 median minutes, 1 median review round and 188 first-round approvals, matching README.md. Both AC5 tests passed. The recorded targeted run has 131 passes, zero failures and three skips. Existing release tests were appropriately adapted for the new current release."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The release version, changelog, release notes and status lines consistently describe 0.14.0. The notes cover the shipped DeepSeek features, and the recalculated project figures match the README. Relevant tests pass; no blocking issues found."
  }
}
```

</details>

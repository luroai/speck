---
id: "0375"
title: "Prepare release 0.13.0"                # one outcome, no "and"
status: approved            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-22-prepare-release-0-13-0.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0368","0369","0370","0371","0372","0373","0374","0381","0382","0385","0386","0387","0388"]                # ticket ids that must be done first
created: 2026-10-22
started: "2026-10-22T23:44:11.286Z"
approved: "2026-10-22T23:47:30.646Z"

---
# 0375 · Prepare release 0.13.0

**Status:** 👍 approved

## Problem
0368 to 0374 rework Settings and the header. Settings opens over the whole panel, a builder or reviewer's models appear when you choose that agent, and changing a setting leaves the view still. An explanation floats over its row. Light and dark move into Settings, the dot-matrix "speck" word comes back with the base branch beside it, and the Foreman's notice board scrolls more slowly. Your own settings, such as which agents build and review, are kept for your machine and no longer need a commit (0386 to 0388). Anyone following the setup prompt, or updating speck on another machine, gets 0.12.0 without them.

## Outcome
speck is ready to be released as 0.13.0.

## Acceptance criteria
1. `package.json` has version `0.13.0`, and `speck init` prints `speck 0.13.0`.
2. `CHANGELOG.md` has a 0.13.0 section above the 0.12.0 one. It describes, in plain English, what someone using speck can now do since the `v0.12.0` tag, from the tickets shipped since (checked by review). The 0.12.0 and earlier sections are unchanged.
3. The README's and the brief's status lines say 0.13.0, a public preview, and the setup prompt still installs the latest release as 0253 left it.
4. `docs/releases/v0.13.0.md` holds the notes for the GitHub release page: one short paragraph saying this is a minor release that reworks Settings and the header and keeps your own settings out of git, what's new and why it matters, how to update (running the install command again in each project), anything that changes for someone upgrading from 0.12.0, and a link to the 0.13.0 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` as it is when this is built, the same way as 0307 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 0.13.0.

## Out of scope
- Creating the `v0.13.0` tag and publishing the GitHub release: the workflow from 0240 does both from `docs/releases/v0.13.0.md` when this lands on `main`.
- The landing page, which lives in its own repo.
- The Settings and header changes themselves: 0368 to 0374, each agent's model beside its family (0381) and the review sentence (0382). Keeping your own settings out of git: 0386 to 0388.

## Notes
- Asked for 2026-10-22 as a minor release, not a patch. It adds behaviour (Settings as a pop-up, model lists that fill when the agent is chosen, light/dark in Settings, the speck word back beside the base branch, your own settings kept out of git). The commands stay the same, apart from `speck config set` saving your own settings for this machine (0386). The slower notice board (0374) would be a patch on its own. Follows 0367 (0.12.0).
- Covers every ticket shipped since `v0.12.0`: 0368 to 0374, each agent's model beside its family (0381), the review sentence (0382) the Settings pop-up no longer moving sideways on a phone (0385), and your own settings kept out of git (0386 to 0388), which it waits for (`after:`), and any other that ships before this is built.
- Upgrading from 0.12.0: light/dark leaves the header for Settings, and the header shows the speck word with the base branch beside it rather than "<project> · base <branch>". Your own settings (0386's list) are now saved for your machine, not committed: `speck config set` and the panel's Save no longer change speck/config.yml for them, `speck config set --repo` changes the project's default, and new tickets leave the builder and reviewer to the settings (0388).
- After it ships, check that the `v0.13.0` tag and its GitHub release page appeared (0240's workflow, in the repository's Actions tab). If it failed, tag and publish by hand: `gh release create v0.13.0 --target main --title "speck 0.13.0" --notes-file docs/releases/v0.13.0.md`.
- Checked 2026-10-22: `package.json` is `0.12.0`. 0367 prepared 0.12.0 the same way, and 0240 publishes the GitHub release from `docs/releases/` when the release ticket lands on `main`.
- Relies on nothing outside this repo.
- Failing before this build: none
- Covers every ticket shipped since `v0.12.0`: 0368 to 0374, 0381, 0382, 0385 to 0388, and also 0383 (reading a verdict after a line of prose) and 0384 (a review round outlasting the builder's shell limit), which shipped since too.
- Built from main at `speck(0388): Leave a ticket's agents to the settings unless it names them`: 366 shipped, 16 cancelled, 12 minutes median, 1.5 review rounds median, 181 approved in the first round, worked out as 0307 did, with its figures test.
- 0367's checks that named 0.12.0 as the current version now check the current version, and its figures test checks only the figures 0.12.0 was built from, as 0367 did for 0360.
- Checked that an open panel page notices the new release: the page compares its own copy with `templates/panel.html`, which 0368 to 0373 changed, and the Foreman's board then says Reload page.
- Self-check: no changes.
- Pictures: none, because only text changes: the README's status line and figures, which render as before.

## In plain words
speck is ready to go out as version 0.13.0, the release with the reworked Settings and header and your own settings kept out of git: Settings in a pop-up, each agent's models beside it, a view that stays still, light and dark in Settings, the "speck" word back in the header beside the base branch, a slower notice board, and who builds and reviews saved for your machine without a commit. The changelog has a 0.13.0 section, the README and the brief say 0.13.0, the README's "Built with speck" figures are up to date (366 tickets shipped, now 1.5 review rounds median), and the notes for the GitHub release page are written, including what changes for someone upgrading. Nothing about how speck works changes in this ticket. Once it lands, the release workflow should tag 0.13.0 and publish its release page: check it appeared in the repository's Actions tab.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 209,397
- Elapsed since build started: 3 min
- Changed lines: 78 (limit 5000)
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
    "reviewed_sha": "6b637b6feb5159e2a8fe4cdafa5b88a45ba3f1cd",
    "session": "fresh",
    "thread_id": "01a16602-8c53-74b2-bb1e-df4b3673c63a",
    "builder_response": "- Tests run: test/release-0375.test.mjs test/release-0367.test.mjs test/release-0360.test.mjs test/docs-0267.test.mjs test/install-0253.test.mjs and every other test/release-0*.test.mjs (the commands.checks files run too)\n- Tickets shipped since v0.12.0 (`git log v0.12.0..HEAD | grep ': ship$'`): 0368 to 0374, 0381, 0382, 0383, 0384, 0385 to 0388. 0383 and 0384 aren't named in the ticket but shipped since, so the changelog and notes cover them too.\n- README figures recomputed with test/support/figures.mjs at the 0388 commit: 366 shipped, 16 cancelled, 12 min median, 1.5 rounds median, 181 first-round approvals.\n- test/release-0367.test.mjs: its checks that named 0.12.0 as the current version now check the current version, as 0367 did to 0360's.\n",
    "seconds": 38,
    "usage": {
      "input_tokens": 208256,
      "cached_input_tokens": 155008,
      "cache_write_input_tokens": 0,
      "output_tokens": 1141,
      "reasoning_output_tokens": 102
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-22T23:47:22.970Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "package.json names 0.13.0. Both 0375 AC1 tests passed, including running init and checking its printed version."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "CHANGELOG.md adds 0.13.0 above 0.12.0 without changing older sections. Reviewed its claims against the 15 tickets shipped since v0.12.0; it covers their Settings, header, machine settings and review changes."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md and docs/brief.md say '0.13.0, a public preview'. The README setup prompt retains the quoted semver:* install command. Both 0375 AC3 tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/releases/v0.13.0.md explains the minor release, benefits, update command for each project and upgrade changes, with no person's name. Claims match shipped tickets. All three AC4 tests passed, covering commands, the changelog link and private words."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Independently recomputed figures from the current done tickets: 366 shipped, 16 cancelled, 12 minutes median, 1.5 review rounds median and 181 first-round approvals, matching README.md. Both AC5 tests passed. The recorded run has 325 passes, no failures and three skips; changes to older release tests appropriately accommodate the new current release."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The release is ready for the owner's merge decision. Version numbers, release notes and README figures agree, and the notes cover all shipped changes since 0.12.0. The tested checks passed, with no blocking concerns found."
  }
}
```

</details>

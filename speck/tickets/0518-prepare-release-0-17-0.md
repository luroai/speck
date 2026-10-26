---
id: "0518"
title: "Prepare release 0.17.0"                # one outcome, no "and"
status: reviewing            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0517"]                # ticket ids that must be done first
created: 2026-10-26
started: "2026-10-26T16:39:50.128Z"

---
# 0518 · Prepare release 0.17.0

**Status:** 🔍 reviewing

## Problem
Since 0.16.1, the panel can switch between every speck project running on the machine from its header (0516), and lane swipes are snappier (0517). The switcher only lists a project whose own copy of speck has it, so carbon and speck-site can't join it until there's a release to update to: anyone following the setup prompt, or updating speck in another project, still gets 0.16.1.

## Outcome
speck is ready to be released as 0.17.0.

## Acceptance criteria
1. `package.json` has version `0.17.0`, and `speck init` prints `speck 0.17.0`.
2. `CHANGELOG.md` has a 0.17.0 section above the 0.16.1 one. It describes, in plain English, what someone using speck will notice is new or changed since the `v0.16.1` tag, from the tickets shipped since (checked by review). The 0.16.1 and earlier sections are unchanged.
3. The README's and the brief's status lines say 0.17.0, a public preview, and the setup prompt still installs the latest release as 0253 left it.
4. `docs/releases/v0.17.0.md` holds the notes for the GitHub release page: one short paragraph on what's new, each change in it and why it matters, how to update (running the install command again in each project), anything that changes for someone upgrading from 0.16.1, including that the project switcher lists only projects updated to 0.17.0 with their panel running, and a link to the 0.17.0 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` as it is when this is built, the same way as 0307 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 0.17.0.

## Out of scope
- Creating the `v0.17.0` tag and publishing the GitHub release: the workflow from 0240 does both from `docs/releases/v0.17.0.md` when this lands on `main`.
- Updating speck in the user's other projects.
- The landing page, which lives in its own repo.
- The changes themselves: 0516 and 0517.

## Notes
- Asked for 2026-10-26: "Get 0517 out the door, then package up a release and get it out." A minor release rather than a patch, as 0516 adds a feature. Follows 0515 (0.16.1).
- Covers every ticket shipped since `v0.16.1`: 0516 and 0517, which it waits for (`after:`), and any other that ships before this is built.
- After it ships, check that the `v0.17.0` tag and its GitHub release page appeared (0240's workflow, in the repository's Actions tab). If it failed, tag and publish by hand: `gh release create v0.17.0 --target main --title "speck 0.17.0" --notes-file docs/releases/v0.17.0.md`.
- Checked 2026-10-26: `package.json` is `0.16.1`.
- Relies on nothing outside this repo.
- Failing before this build: none
- AC5's README figures aren't tested in the README, as 0491 left the rule: `test/release-0518.test.mjs` checks the figures worked out from `speck/tickets/done/` at the commit this was built from (501 shipped, 16 cancelled, 13 minutes, 1 round, 255 in round 1), and the reviewer checks the README gives them.
- `test/release-0515.test.mjs`'s checks of the current version now follow `package.json`, as 0515 did for 0507, and `test/docs-0491.test.mjs` lets `test/release-0518.test.mjs` read the README for its status line and setup prompt, as it does every release test.
- Shipped since `v0.16.1`: 0516 and 0517, and no others.
- Self-check: the upgrade note no longer says to restart a running panel after updating, as a running panel restarts on its new code by itself and registers for the switcher then; dropped an unbacked line about ports. Each other claim checked against 0516 and 0517.
- Pictures: none, because nothing anyone sees in the panel changes.

## In plain words
speck is now ready to go out as version 0.17.0. It gathers the two changes since 0.16.1: switching between every project whose panel is running on your computer from the arrow beside the project's name, at the address you already have open, and quicker lane swipes. The changelog, the release page's notes, the version shown when you install speck and the "Built with speck" figures in the README are all updated.

Once this lands, the release page and its tag should appear by themselves. Check the repository's Actions tab afterwards: if they didn't, the ticket's Notes give the one command to publish it by hand. Other projects, such as carbon and speck-site, only appear in the switcher once they've been updated to 0.17.0.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
- Follow-ups: none. After it ships, check that the `v0.17.0` tag and GitHub release appeared.

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
    "reviewed_sha": "f97267b4c0ed563c3cd3ce2824b76ce19003198b",
    "session": "fresh",
    "thread_id": "01a17917-3324-7cb1-a682-a381f2bd6496",
    "builder_response": "- Tests run: test/release-0518.test.mjs test/release-0515.test.mjs test/docs-0491.test.mjs, with `--related` (950 tests, 947 pass, 3 skipped, 0 fail).\n- Shipped since v0.16.1: 0516 and 0517 (git log v0.16.1..HEAD, \"speck(<id>): ship\").\n- README figures recomputed with test/support/figures.mjs at 66c9a6f2 (main's head when built): 501 shipped, 16 cancelled, 13 min, 1 round, 255 first round.\n- test/release-0515.test.mjs's current-version checks now follow package.json, as 0515 did for 0507.\n- The upgrade note says a running panel picks up the new code by itself: scripts/panel.mjs restarts its server process when its code changes, and the server process registers the project for the switcher (panelProjects, line 544).\n",
    "seconds": 43,
    "usage": {
      "input_tokens": 146483,
      "cached_input_tokens": 101248,
      "cache_write_input_tokens": 0,
      "output_tokens": 1032,
      "reasoning_output_tokens": 33
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-26T16:42:49.115Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "package.json names 0.17.0. Passing release-0518 AC1 tests check that version and exercise speck init, asserting its printed version."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "CHANGELOG.md places 0.17.0 above 0.16.1 and describes project switching and quicker swipes consistently with shipped tickets 0516 and 0517. git log confirms these are the only tickets shipped since v0.16.1. The preservation test passes, and the diff against that tag leaves earlier sections unchanged."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md and docs/brief.md both say '0.17.0, a public preview'. Passing AC3 tests verify the versions and the unchanged setup prompt's quoted latest-release install command."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/releases/v0.17.0.md contains a short introduction, changes and benefits, per-project update command, upgrade guidance and the changelog link. Its claims match 0516 and 0517; scripts/panel.mjs supports automatic restart and switcher registration after updating. No person's name appears. Passing AC4 tests cover commands, the changelog anchor and private words."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Independently recomputed figures from the current speck/tickets/done directory: 501 shipped, 16 cancelled, 13 median minutes, 1 median review round and 255 first-round approvals; README.md matches. The historical figures and version-consistency tests pass. The recorded relevant run has 947 passes, three skips and no failures; existing test adjustments appropriately follow the new current version."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "Release 0.17.0 is ready for the owner's merge decision. The version, changelog, release notes and README figures agree, and the notes accurately explain project switching, faster swipes and updating each project. Relevant tests pass, with no blocking concerns found."
  }
}
```

</details>

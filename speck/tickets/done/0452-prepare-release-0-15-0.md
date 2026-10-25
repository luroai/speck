---
id: "0452"
title: "Prepare release 0.15.0"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0439", "0440", "0441", "0442", "0443", "0444", "0445", "0446", "0447", "0448", "0449", "0450", "0451", "0453", "0454", "0455", "0456", "0457", "0458", "0459", "0460", "0461", "0462", "0463", "0464", "0465", "0466", "0467", "0468", "0469", "0470", "0471", "0472", "0473", "0474", "0476", "0475", "0477", "0478", "0479", "0489", "0490", "0494", "0495", "0500", "0501"]                # ticket ids that must be done first
created: 2026-10-24
started: "2026-10-25T12:50:50.278Z"
approved: "2026-10-25T12:57:25.415Z"
finished: "2026-10-25T13:00:52.198Z"

---
# 0452 · Prepare release 0.15.0

**Status:** ✅ done

## Problem
Since 0.14.0, speck's panel has been rebuilt round speck itself, as the Foreman on an LCD screen at the top, with tabs, shorter tickets and Cursor's look, and builds have got faster. None of it is in a release yet, so projects that install speck don't get it.

## Outcome
speck 0.15.0 is ready to tag, with its changelog and release notes.

## Acceptance criteria
1. `package.json` has version `0.15.0`, and `speck init` prints `speck 0.15.0`.
2. `CHANGELOG.md` has a 0.15.0 section above the 0.14.0 one. It describes, in plain English, what someone using speck can now do since the `v0.14.0` tag, from the tickets shipped since (checked by review). The 0.14.0 and earlier sections are unchanged.
3. The README's and the brief's status lines say 0.15.0, a public preview, and the setup prompt still installs the latest release as 0253 left it.
4. `docs/releases/v0.15.0.md` holds the notes for the GitHub release page: one short paragraph saying this is a minor release that rebuilds the panel round speck as the Foreman, what's new and why it matters, how to update (running the install command again in each project), anything that changes for someone upgrading from 0.14.0, and a link to the 0.15.0 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` as it is when this is built, the same way as 0307 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 0.15.0.

## Out of scope
- Tagging and publishing the release, which the user does after shipping this.

## Notes
- The user asked on 2026-10-24 for everything relevant to the release to be ticketed first: 0439 to 0451, 0453 and 0454. On the same day they added 0455 (the build log as a terminal), 0456 (the README's picture), 0457 (the open tab joined to its lane), and 0458 to 0460 (the Pipeline pop-up showing only the log, as a terminal of short, timed lines), and 0461 to 0465 (a coloured step track and facts grid on every open ticket and the full ticket), and 0466 (a shipped ticket opening as Plan and Build tickets do), 0467 and 0468 (dependencies in a box and a chip), and 0469 (the touch-screen layout with a mouse too), 0470 (the Pipeline log title), 0471 (a bigger "speck" in the header), 0472 to 0474 (the panel's styles and script split into a file for each area) and 0476 and 0477 (sliding between the lanes as cards, with a strip in place of the tabs), 0478 (each lane framed like a second screen) 0475 (the ticket skill chains tickets only when they change the same part of a file) and 0479 (the Pipeline log as a framed card that fills the screen).
- What's new since `v0.14.0`, for the changelog: speck's LCD screen as the panel's header, with a bigger "speck" over it (0471), with speck as the Foreman reacting to the pipeline (0413, 0414, 0436, 0438, 0446, 0451); the pipeline log in place of the Foreman's detail (0415), now on its own under the title Pipeline log, in a framed card that fills the screen with only the log scrolling (0470, 0479), as a terminal of short, timed lines (0458, 0459, 0460); Plan, Build and Shipped as cards you swipe between, with a strip showing which is in view, each framed like a second screen with its name in dot-matrix letters (0410, 0425, 0457, 0476, 0477, 0478); shorter tickets and words only for stages, with a working grid (0416, 0419, 0420, 0421, 0434, 0435, 0443); every open ticket's steps as a coloured track and its facts in a grid, in Plan, Build and Shipped and in the full ticket (0461 to 0465); a shipped ticket opening as Plan and Build tickets do, with a Full ticket button (0466); a ticket's dependencies in a box in its open card, and as a chip on its closed card (0467, 0468); the touch-screen layout with a mouse too, so the panel looks the same in a desktop pane (0469); the latest ten shipped (0411); System, Light and Dark (0412, 0448); Cursor's colours, fonts and corners (0426, 0427, 0428, 0440, 0442, 0450); the build log as a log (0422), in a black box like a terminal (0455); the README's picture of the new panel (0456); the full ticket over the whole panel, set out as a document (0423, 0424, 0445); one layout at every width (0417, 0418); faster builds (0429, 0437, 0447), more tickets building side by side as the ticket skill chains only on the same part of a file (0475), and the panel split into files (0430 to 0433, then by area in 0472 to 0474). Check each against `git log v0.14.0..HEAD`.
- Same shape as 0394 (release 0.14.0).
- Waits for 0439 to 0451 and 0453 to 0479, and the README's new opening and shorter sections (0489, 0490), added by the user on 2026-10-24, and the fixes for a test that fails under load and for `speck status`'s Fixing line (0500, 0501), added by the user on 2026-10-25 before releasing.
- Failing before this build: none
- AC5's README figures aren't tested in the README, as 0491 left the rule: `test/release-0452.test.mjs` checks the figures worked out from `speck/tickets/done/` at the commit this was built from (484 shipped, 16 cancelled, 13 minutes, 1 round, 245 in round 1), and the reviewer checks the README gives them.
- The changelog and release notes describe each change as it stands now, so later tickets win where they replaced an earlier one: the Foreman is called speck (0485 to 0488), the lanes are light cards rather than dark frames (0480) in a strip rather than tabs (0477), and 0457's joined tab went with the tabs.
- Self-check: narrowed two claims: the roomier layout with a mouse (0469) no longer says finger-sized, and speck's breaks (0436) happen during a long build or wait, not only a wait. `test/release-0394.test.mjs`'s checks of the current version now follow `package.json`, as 0394 did for 0380. `test/docs-0491.test.mjs` lets `test/release-0452.test.mjs` read the README for its status line and setup prompt, as it does every release test, and `test/docs-0488.test.mjs`'s check that the changelog and release notes didn't change now looks only at 0488's own commits, as a release changes both.
- Pictures: none, because nothing anyone sees in the panel changes.

## In plain words
speck is ready to go out as version 0.15.0, a minor release that rebuilds the panel round speck itself: its screen at the top, the Pipeline log, the Plan, Build and Shipped cards you swipe between, shorter tickets, Cursor's look, and the new Settings for your agents and API providers. The changelog and release notes describe all 106 tickets shipped since 0.14.0, the version shown everywhere now says 0.15.0, and the "Built with speck" figures in the README are up to date. The notes tell people upgrading that the Foreman's settings and commands have new names, while the old ones still work. Once it ships, check that the 0.15.0 release page appears on GitHub.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 230,244
- Elapsed since build started: 7 min
- Changed lines: 138 (limit 5000)
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
    "reviewed_sha": "e4011fa7711ac51bd003d6b9ba321f49440a9895",
    "session": "fresh",
    "thread_id": "01a17322-413f-78b1-adca-bfc716aa17fe",
    "builder_response": "- Tests run: `speck test --related test/release-0452.test.mjs test/release-0394.test.mjs test/docs-0488.test.mjs test/docs-0491.test.mjs test/docs-0267.test.mjs` (93 related files, plus the commands.checks files): 889 passed, 0 failed.\n- Shipped since v0.14.0 (`git log v0.14.0..HEAD`, \"speck(<id>): ship\" commits): 0395 to 0451 and 0453 to 0501, 106 tickets, all covered in the changelog as each stands now (later tickets win where they replaced earlier ones: the Foreman is speck after 0485 to 0488, the lanes are light cards after 0480, in a strip after 0477).\n- Built with speck figures worked out with test/support/figures.mjs at \"speck(0500): Keep the 0484 copy test passing when the machine is busy\" (main when this was built): 484 shipped, 16 cancelled, 13 minutes, 1 round, 245 in round 1. Under 0491's rule the README's figures are checked by review; the test checks the figures from the done tickets.\n- Existing tests changed: test/release-0394.test.mjs's current-version checks now follow package.json (as 0394 did for 0380); test/docs-0491.test.mjs allows test/release-0452.test.mjs to read the README (status line and setup prompt), as every release test; test/docs-0488.test.mjs's \"CHANGELOG.md and docs/releases/ don't change\" now checks only 0488's own commits, as a release changes both.\n- The brief's status line date moved to 25 October 2026, as 0394 set it to its own day.\n",
    "seconds": 50,
    "usage": {
      "input_tokens": 229004,
      "cached_input_tokens": 173440,
      "cache_write_input_tokens": 0,
      "output_tokens": 1240,
      "reasoning_output_tokens": 64
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-25T12:57:16.646Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "package.json sets 0.15.0. Both 0452 AC1 tests passed, including running speck init and checking its printed version."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "CHANGELOG.md adds 0.15.0 above 0.14.0; git diff confirms all older sections are unchanged. Its descriptions agree with the shipped tickets in git log v0.14.0..HEAD, including later changes replacing tabs and renaming the Foreman."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md and docs/brief.md both state 0.15.0, a public preview. The setup prompt retains github:luroai/speck#semver:*. Both 0452 AC3 tests passed."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "docs/releases/v0.15.0.md provides an introductory paragraph, shipped feature summaries, per-project update instructions, compatibility details and the correct changelog anchor. It names no person. All three 0452 AC4 tests passed."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "Independently recalculating the current done tickets produced 484 shipped, 16 cancelled, 13 median minutes, 1 median review round and 245 first-round approvals, matching README.md. Both AC5 tests passed. The recorded related-test run confirms 889 passed, zero failed and three skipped."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The release preparation is ready for approval. The version, changelog, release notes and README figures agree with the shipped work. The tests passed, and the changes do not tag or publish the release."
  }
}
```

</details>

---
id: "0452"
title: "Prepare release 0.15.0"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0439", "0440", "0441", "0442", "0443", "0444", "0445", "0446", "0447", "0448", "0449", "0450", "0451", "0453", "0454", "0455", "0456", "0457", "0458", "0459", "0460", "0461", "0462", "0463", "0464", "0465", "0466", "0467", "0468", "0469", "0470", "0471", "0472", "0473", "0474", "0476", "0475", "0477", "0478", "0479", "0489", "0490"]                # ticket ids that must be done first
created: 2026-10-24

---
# 0452 · Prepare release 0.15.0

**Status:** 📝 draft

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
- Waits for 0439 to 0451 and 0453 to 0479, and the README's new opening and shorter sections (0489, 0490), added by the user on 2026-10-24.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

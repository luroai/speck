---
id: "0375"
title: "Prepare release 0.13.0"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

---
# 0375 · Prepare release 0.13.0

**Status:** 📋 ready

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

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

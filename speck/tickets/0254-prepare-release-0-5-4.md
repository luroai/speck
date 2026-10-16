---
id: "0254"
title: "Prepare release 0.5.4"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0249", "0250", "0255", "0251", "0256", "0252", "0253"]                # ticket ids that must be done first
created: 2026-10-16
started: "2026-10-16T14:05:31.389Z"

---
# 0254 · Prepare release 0.5.4

**Status:** 🔨 building

## Problem
Since `v0.5.3`, the README has gained a picture of speck at work (0249), the landing page's story (0250) and a new tagline (0255), a plain opening (0251) and a plain first sentence for each section (0256); agents set tickets ready only when told to (0252); and every install command installs the latest release (0253). Anyone following the setup prompt today gets 0.5.3 without them.

## Outcome
speck is ready to be released as 0.5.4.

## Acceptance criteria
1. `package.json` has version `0.5.4`, and `speck init` prints `speck 0.5.4`.
2. `CHANGELOG.md` has a 0.5.4 section above the 0.5.3 one. It describes, in plain English, what someone using speck will notice is fixed or changed since the `v0.5.3` tag, from the tickets shipped since. The 0.5.3 and 0.5.2 sections are unchanged.
3. The README's and the brief's status lines say 0.5.4, a public preview, the setup prompt still installs the latest release as 0253 left it, and the README says nothing about how speck builds, reviews or ships that the tickets shipped since `v0.5.3` have made untrue.
4. `docs/releases/v0.5.4.md` holds the notes for the GitHub release page: one short paragraph saying what this patch release is for, each change in it and why it matters, how to install it, anything that changes for someone upgrading from 0.5.3, and a link to the 0.5.4 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` as it is when this is built, the same way as 0248 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 0.5.4.

## Out of scope
- Creating the `v0.5.4` tag and publishing the GitHub release: the workflow from 0240 does both from `docs/releases/v0.5.4.md` when this lands on `main`.
- The landing page, which lives in its own repo.
- New features, which wait for 0.6.0.

## Notes
- Asked for 2026-10-16, for patch release 0.5.4. Follows 0248 (0.5.3).
- Waits for every ticket planned for this release (0249, 0250, 0255, 0251, 0256, 0252, 0253), so they're all in it. 0249 and 0250 have already shipped.
- After 0253, the setup prompt names no version, so this release doesn't change it. In the release notes, "how to install it" can give the fixed command for this release (`npx 'github:luroai/speck#v0.5.4' init`) as earlier notes did, or the latest one: either is fine.
- After it ships, check that the `v0.5.4` tag and its GitHub release page appeared (0240's workflow, in the repository's Actions tab). If it failed, tag and publish by hand: `gh release create v0.5.4 --target main --title "speck 0.5.4" --notes-file docs/releases/v0.5.4.md`.
- Relies on nothing outside this repo.
- Failing before this build: none

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

---
id: "0668"
title: "Prepare release 1.3.1"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 2              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
level: ""                # blank: no level, so the settings decide. Otherwise one of the levels in speck/config.yml, such as quick, balanced or deep
builder: ""              # blank: the builder your settings give when the build starts
builder_model: ""        # blank: your settings' builder_model, given only to the builder they name
builder_effort: ""       # blank: your settings' builder_effort. Otherwise low | medium | high | xhigh | max
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0666","0667","0669"]                # ticket ids that must be done first
created: 2026-11-12

---
# 0668 · Prepare release 1.3.1

**Status:** 📋 ready

## Problem
1.3.0's build levels are hard to set: the Builder's card asks for each level's model as free text and says "settings" everywhere without explaining it, and a ticket's Level menu doesn't say what each level builds with. 0666 and 0667 fix that, and 0669 shows and lets you pick a ticket's builder model in the panel, which 0659 only made possible in the ticket file. Anyone following the setup prompt, or updating speck in a project, still gets 1.3.0 without the fixes.

## Outcome
speck is ready to be released as 1.3.1.

## Acceptance criteria
1. `package.json` has version `1.3.1`, and `speck init` prints `speck 1.3.1`.
2. `CHANGELOG.md` has a 1.3.1 section above the 1.3.0 one. It describes, in plain English, what someone using speck will notice is fixed or changed since the `v1.3.0` tag, from the tickets shipped since (checked by review). The 1.3.0 and earlier sections are unchanged.
3. The README's and the brief's status lines say 1.3.1, and the setup prompt still installs the latest release.
4. `docs/releases/v1.3.1.md` holds the notes for the GitHub release page: one short paragraph saying this is a bug-fix release, each fix in it and why it matters, how to update (running the install command again in each project), anything that changes for someone upgrading from 1.3.0, and a link to the 1.3.1 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` when this is built, as 0598 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 1.3.1.

## Out of scope
- Creating the `v1.3.1` tag and publishing the GitHub release: the release workflow does both from `docs/releases/v1.3.1.md` when this lands on `main`.
- The landing page, which lives in its own repo.
- The fixes themselves: 0666, 0667 and 0669.

## Notes
- Asked for 2026-11-12: fix the levels' screens "as a patch release".
- Covers every ticket shipped since `v1.3.0`: 0666, 0667 and 0669, which it waits for, and any other that ships before this is built.
- After it ships, check that the `v1.3.1` tag and its GitHub release page appeared. If not: `gh release create v1.3.1 --target main --title "speck 1.3.1" --notes-file docs/releases/v1.3.1.md`.
- Checked 2026-11-12: `package.json` is `1.3.0`, `v1.3.0` is tagged on origin, and `CHANGELOG.md`'s newest section is 1.3.0.
- 0665's checks that name 1.3.0 as the current version should check the current version, as 0665 did for 0653's.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

---
id: "0770"
title: "Prepare release 1.8.0"                # one outcome, no "and"
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
after: ["0764","0765","0766","0767","0768","0769"]                # ticket ids that must be done first
created: 2026-11-26

---
# 0770 · Prepare release 1.8.0

**Status:** 📋 ready

## Problem
Since 1.7.0, `speck serve`'s address has a factory floor page for a laptop: project stations, the line with the model on every station, Virgil's dial, your subscriptions and each project's board side by side. Anyone updating speck still gets 1.7.0.

## Outcome
speck is ready to be released as 1.8.0.

## Acceptance criteria
1. `package.json` has version `1.8.0`, and `speck init` prints `speck 1.8.0`.
2. `CHANGELOG.md` has a 1.8.0 section above the 1.7.0 one. It describes, in plain English, what someone using speck will notice is new or changed since the `v1.7.0` tag, from the tickets shipped since (checked by review). The 1.7.0 and earlier sections are unchanged.
3. The README's and the brief's status lines say 1.8.0, the setup prompt still installs the latest release, and the shipped price table has been refreshed with `npm run prices` on the day this is built, its date saying so.
4. `docs/releases/v1.8.0.md` holds the notes for the GitHub release page: a short paragraph on what the release is about, each change and why it matters, how to update (running the install command again in each project), how to open the factory floor, and a link to the 1.8.0 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` when this is built, as 0598 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 1.8.0.

## Out of scope
- Creating the `v1.8.0` tag and publishing the GitHub release: the release workflow does both from `docs/releases/v1.8.0.md` when this lands on `main`.
- The landing page, which lives in its own repo.

## Notes
- Asked for 2026-11-26: the factory floor as a new page, after 1.7.0's `speck serve`.
- Covers every ticket shipped since `v1.7.0`, the factory floor tickets it waits for included, and any other that ships before this is built. Fix tickets and test-only changes are left out of the changelog unless someone using speck would notice them.
- If one of the tickets it waits for is cancelled rather than shipped, it's taken out of `after:` so this isn't held up, and left out of the changelog.
- `npm run prices` fetches LiteLLM's price list from GitHub, so this build needs the network.
- After it ships, check that the `v1.8.0` tag and its GitHub release page appeared. If not: `gh release create v1.8.0 --target main --title "speck 1.8.0" --notes-file docs/releases/v1.8.0.md`.
- Checked 2026-11-26: `v1.7.0` is tagged on origin.
- speck (2026-11-26 21:09 UTC) I'll resume 0770 at 22:00 UTC: 0770 has to come after 0768 and 0769, which are approved but still shipping (0769 is shipping now and 0768's ship was handed back to its build), so starting now would only be refused again; by 22:00 UTC both should have landed. Its instruction: Check that 0768 and 0769 have both shipped to main, then start 0770 on top of the latest main and build it; if either still hasn't shipped, stop again without changing anything.
- 2026-11-26: its first build stopped before starting, as 0768 and 0769 were approved but not yet shipped. Set ready again once both shipped.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

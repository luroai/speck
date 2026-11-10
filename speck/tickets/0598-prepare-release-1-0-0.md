---
id: "0598"
title: "Prepare release 1.0.0"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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
after: ["0575","0576","0577","0578","0579","0580","0581","0582","0583","0584","0585","0586","0587","0588","0589","0590","0591","0592","0593","0594","0595","0596","0597","0599","0600","0601","0602","0603","0604","0605","0606","0607"]                # ticket ids that must be done first
created: 2026-11-09

---
# 0598 · Prepare release 1.0.0

**Status:** 📝 draft

## Problem
speck has grown up: it works as your engineering manager, which you can name (0575, 0576), the panel is redesigned around it, with the black bar, the Premium character and the bridge across every project (0577 to 0597), and since 0.22.0 it decides and tells you. Anyone following the setup prompt, or updating speck in a project, still gets 0.22.0.

## Outcome
speck is ready to be released as 1.0.0.

## Acceptance criteria
1. `package.json` has version `1.0.0`, and `speck init` prints `speck 1.0.0`.
2. `CHANGELOG.md` has a 1.0.0 section above the 0.22.0 one. It describes, in plain English, what someone using speck will notice is new or changed since the `v0.22.0` tag, from the tickets shipped since (checked by review). The 0.22.0 and earlier sections are unchanged.
3. The README's and the brief's status lines say 1.0.0 and no longer call speck a public preview, and the setup prompt still installs the latest release as 0253 left it. The shipped price table has been refreshed with `npm run prices` (0524) on the day this is built, and its date says so.
4. `docs/releases/v1.0.0.md` holds the notes for the GitHub release page: a short paragraph on speck as your engineering manager, each change and why it matters, how to update (running the install command again in each project), what changes for someone upgrading from 0.22.0 (the LCD screen is gone, and the name setting), that costs are estimates at API list prices, and a link to the 1.0.0 section of `CHANGELOG.md`. Every claim in it matches a shipped ticket, and it uses no one's name.
5. The README's "Built with speck" figures are worked out again from `speck/tickets/done/` as it is when this is built, the same way as 0307 did, and match it. No test that passed before this change fails, and the test that checks the version in `package.json` and the newest changelog section match passes with 1.0.0.

## Out of scope
- Creating the `v1.0.0` tag and publishing the GitHub release: the workflow from 0240 does both from `docs/releases/v1.0.0.md` when this lands on `main`.
- The landing page, which lives in its own repo.

## Notes
- Asked for 2026-11-09: "do you think this is a candidate for a 1.0.0 release? … let's make it a big one." A major release after 0574 (0.22.0).
- Covers every ticket shipped since `v0.22.0`: 0575 to 0597 and 0599 to 0607, which it waits for, and any other that ships before this is built.
- After it ships, check that the `v1.0.0` tag and its GitHub release page appeared (0240's workflow). If it failed: `gh release create v1.0.0 --target main --title "speck 1.0.0" --notes-file docs/releases/v1.0.0.md`.
- Checked 2026-11-09: `package.json` is `0.22.0`; the README's status line reads "Status: 0.22.0, a public preview."
- `npm run prices` fetches LiteLLM's price list from GitHub, so this build needs the network.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

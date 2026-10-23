---
id: "0394"
title: "Prepare release 0.14.0"                # one outcome, no "and"
status: ready            # draft | ready | building | reviewing | blocked | approved | done | cancelled
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

---
# 0394 · Prepare release 0.14.0

**Status:** 📋 ready

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

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

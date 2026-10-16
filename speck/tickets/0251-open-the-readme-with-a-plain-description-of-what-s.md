---
id: "0251"
title: "Open the README with a plain description of what speck does"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low               # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0255"]                # ticket ids that must be done first
created: 2026-10-16
started: "2026-10-16T13:48:40.175Z"

---
# 0251 · Open the README with a plain description of what speck does

**Status:** 🔨 building

## Problem
The README doesn't say plainly what speck is, who it's for or why you'd trust it. A reader, the maintainer included, has to work it out from abstract lines about decisions, when a non-technical builder or a hiring team should get it from the first few lines.

## Outcome
Between the tagline and the image, the README says in plain, obvious sentences who speck is for, what you do, where you do it, what happens while you're away, why speck exists and why you can trust the result.

## Acceptance criteria
1. After the tagline and the plain line under it (0255), and before the image, the opening says plainly: who it's for (people who don't write code, naming product managers, founders, programme managers and designers, as well as engineers); that you plan tickets in a conversation with your agent and follow or manage the builds in speck's panel, both in the same app (for example Claude Code's desktop app, Cursor, or an editor with a built-in browser); and that you can set tickets ready and walk away (to a meeting, to lunch, to bed) while speck builds, tests, reviews and, with auto-ship on, ships them.
2. The opening says why speck exists, in a short paragraph of its own: it was built by a product manager, for product managers and other non-technical people working with engineering teams, who have always had to ship code they can't read and still trust it. The tagline names that situation, and speck gives them a way to trust the result without reading the code: criteria agreed up front, an independent check of every change, and evidence in plain English.
3. The opening says why you can trust the result: every ticket goes through the same steps whatever the task (tests written first from its criteria, a self-check, an independent review by a second AI, and the whole test suite before it ships), and nothing ships unless you ship it or have set auto-ship to cover its risk. It claims only what speck does today: shipping merges into `main` and pushes it to GitHub when the repo has a remote, and it doesn't say speck publishes GitHub releases for your project.
4. Before the first review round, the builder runs the `/no-ai-slop` skill in detect mode on the new and changed text, then fixes each pattern it names or keeps it with a reason. The ticket's Notes list each pattern found, the line and what was done, and a second detect pass names no pattern left unaddressed.
5. No fact the README gives today is dropped, and no test that passed before this change fails, apart from tests that check wording this ticket deliberately changes, which check the new wording instead.

## Out of scope
- The tagline and the line under it (0255), and each section's first sentence (0256).
- The landing page (speck-site repo), `docs/brief.md` and the skills' wording.
- New features, or describing anything speck doesn't do today.

## Notes
- Split on 2026-10-16: the tagline is 0255, which this waits for, and each section's first sentence is 0256.
- Follows 0250, which shipped the README's current wording. The maintainer's words for the opening, to use where they fit: "a framework that lets non-technical builders (PMs, founders, programme managers, designers etc.) create well-formed tickets from a conversation, and manage (or not) the build of them through the panel, all in the same app (Claude Code desktop, an IDE with a browser, Cursor etc.)... spec out their ideas, get all the tickets ready, set them all ready, walk away, go to a meeting, have lunch, go to bed... and when they come back speck has built it, tested it and shipped it, autonomously, in a way you can trust, because whatever the task, the same process and rigour has been followed."
- Why speck exists, in the maintainer's words (2026-10-16), to use where they fit: the tagline and plain line are "exactly the same mindset that a PM or non-technical person now working in an engineering environment or engineering team has to deal with. And this is why I built this... a framework built by a PM for a PM to ship code I trust, without necessarily having the ability to read the code myself." Say it in the third person ("built by a product manager"), with no name: the project's public name is Luro.
- Plain over clever: short sentences that state the obvious. British English.
- GitHub releases: only speck's own repo publishes them, from a workflow in this repo (`docs/brief.md`, "Releases"), so the README mustn't promise them for the reader's project.
- `/no-ai-slop` is installed globally for Claude Code (`~/.claude/skills/no-ai-slop/`); see how 0250's Notes recorded its passes.
- About 26 test files read `README.md` (for example `readme-0089`, `wording-0125`, `release-0092`, `private-words-0084`): keep what they check unless the change is deliberate.
- Failing before this build: none
- No-ai-slop detect, first pass: on the README's new opening (lines 7–15).
  - L7 "It works just as well for engineers.": often-empty adverb ("just") and a claim nothing backs. Changed to "It's for engineers too."
  - L13 "…still trust it, which is what the tagline is about.": interpretive metadiscourse. Rewritten as a plain sentence, "The tagline names that situation.", kept because AC2 asks the opening to say so.
  - L15 four short sentences in a row with the same shape ("Its tests…", "The builder…", "A second AI…", "The whole test suite…"): robotic rhythm. Joined into two sentences in the order the steps run.
  - L11 "Go to a meeting, have lunch, go to bed.": possible dramatic fragmentation. Kept: one complete sentence of imperatives, in the maintainer's words.
  - L13 and L15 both say "trust the result": possible repetition. Kept: the same words on purpose, the trust paragraph answering the one before it.
- No-ai-slop detect, second pass: no pattern left unaddressed. The changed lines read as plain sentences; the patterns kept are listed above with their reasons.
- Self-check: narrowed one claim: speck builds while you're away only when `speck run` is on, so the opening says to turn it on in the panel.
- AC5: `test/readme-0250.test.mjs` checked that the two-decisions paragraph was the fourth line, straight after the plain line; it now checks it still comes just before the image, with the new opening above it.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

---
id: "0251"
title: "Open the README with a plain description of what speck does"                # one outcome, no "and"
status: draft            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low               # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-16

---
# 0251 · Open the README with a plain description of what speck does

**Status:** 📝 draft

## Problem
The README still doesn't say plainly what speck is. It opens with a slogan that needs context to make sense ("Your judgement, at agent speed.") and abstract lines about decisions, so a reader, the maintainer included, has to work out what it does and who it's for. A non-technical builder or a hiring team should get it from the first few lines.

## Outcome
The README opens with a tagline that says what's different about speck, then says, in plain and obvious sentences, what speck is, who it's for, what you do, where you do it, what happens while you're away and why you can trust the result. Each section after that starts by saying plainly what it's about.

## Acceptance criteria
1. Under the `# speck` heading, the README opens with the tagline **Ship code you can't read, and still trust it.** followed by this plain line: "speck turns ideas from a conversation into tickets, then builds, tests, reviews and ships them the same way every time, so you can set them going, walk away and trust what you come back to." The old tagline "Your judgement, at agent speed." no longer appears in the README.
2. Before the image, the opening says plainly: who it's for (people who don't write code, naming product managers, founders, programme managers and designers, as well as engineers); that you plan tickets in a conversation with your agent and follow or manage the builds in speck's panel, both in the same app (for example Claude Code's desktop app, Cursor, or an editor with a built-in browser); and that you can set tickets ready and walk away (to a meeting, to lunch, to bed) while speck builds, tests, reviews and, with auto-ship on, ships them.
3. The opening says why you can trust the result: every ticket goes through the same steps whatever the task (tests written first from its criteria, a self-check, an independent review by a second AI, and the whole test suite before it ships), and nothing ships unless you ship it or have set auto-ship to cover its risk.
4. It claims only what speck does today: shipping merges into `main` and pushes it to GitHub when the repo has a remote. It doesn't say speck publishes GitHub releases for your project.
5. Each `##` section after the opening starts with one plain sentence saying what the section tells you or what you do with it.
6. Before the first review round, the builder runs the `/no-ai-slop` skill in detect mode on the new and changed text, then fixes each pattern it names or keeps it with a reason. The ticket's Notes list each pattern found, the line and what was done, and a second detect pass names no pattern left unaddressed.
7. The first line of `speck help`, the comment at the top of `scripts/speck.mjs` and the `description` in `package.json` use the new tagline in place of "Your judgement, at agent speed.", which none of them contains any more.
8. No fact the README gives today is dropped, and no test that passed before this change fails, apart from tests that check wording this ticket deliberately changes, which check the new wording instead.

## Out of scope
- The landing page (speck-site repo), which still has the old tagline, `docs/brief.md` and the skills' wording.
- The image (0249) and the order of the README's sections (0250), apart from each section's first sentence.
- New features, or describing anything speck doesn't do today.

## Notes
- Follows 0250, which shipped the README's current wording. The maintainer's words for the opening, to use where they fit: "a framework that lets non-technical builders (PMs, founders, programme managers, designers etc.) create well-formed tickets from a conversation, and manage (or not) the build of them through the panel, all in the same app (Claude Code desktop, an IDE with a browser, Cursor etc.)... spec out their ideas, get all the tickets ready, set them all ready, walk away, go to a meeting, have lunch, go to bed... and when they come back speck has built it, tested it and shipped it, autonomously, in a way you can trust, because whatever the task, the same process and rigour has been followed."
- Tagline and plain line chosen by the maintainer on 2026-10-16: use them word for word. The tagline's point is what a plain agent session doesn't give you: a second AI checks every change against agreed criteria, the same way every time, so a non-coder can trust work they can't read.
- Plain over clever: short sentences that state the obvious. British English.
- GitHub releases: only speck's own repo publishes them, from a workflow in this repo (`docs/brief.md`, "Releases"), so the README mustn't promise them for the reader's project.
- `/no-ai-slop` is installed globally for Claude Code (`~/.claude/skills/no-ai-slop/`); see how 0250's Notes recorded its passes.
- About 26 test files read `README.md` (for example `readme-0089`, `wording-0125`, `release-0092`, `private-words-0084`): keep what they check unless the change is deliberate.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

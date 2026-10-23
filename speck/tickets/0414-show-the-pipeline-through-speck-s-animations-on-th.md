---
id: "0414"
title: "Show the pipeline through speck's animations on the screen"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0413"] # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T15:09:04.633Z"

---
# 0414 · Show the pipeline through speck's animations on the screen

**Status:** 🔨 building

## Problem
After 0413, speck sits on the screen in the same idle animation whatever the pipeline is doing. A new ticket, a ship or a question looks the same as nothing happening.

## Outcome
speck, the Foreman, plays an animation for each thing that happens in the pipeline, with a short caption under it, and otherwise shows the pipeline's current state, changing only when that state does. It never acts out the builders' and reviewers' work.

## Acceptance criteria
1. While tickets are being created, speck is at the laptop with `WRITING <id>`, naming the newest. That starts when a draft ticket that wasn't on the board appears, or a draft's text changes, while the page is open, and ends 30 seconds after the last such change. Drafts already on the board when the page loads don't count.
2. When one of these happens while the page is open, speck plays its animation once, with its caption under it, then goes back to what criterion 3 says:
   - a ticket starts shipping: one push of the boat, `SHIPPING <id>`
   - a ticket ships: celebrating for 6 seconds, `<id> SHIPPED`
   - a ticket is blocked or the Foreman agent asks you something: the question mark for 6 seconds, `<id> HAS A QUESTION`
   - a ticket is approved and waits for you to ship it: the flag for 6 seconds, `<id> IS READY TO SHIP`
   - the Foreman agent starts looking into a ticket: thinking for 6 seconds, `LOOKING INTO <id>`
3. Between events, what speck does follows the Foreman's status word, and stays the same until that word changes or an event plays:
   - `Off`: asleep, `SPECK RUN IS OFF`
   - `Building <n>` or `Shipping <id>`: watching with a clipboard, `WATCHING <n> BUILDS` (or `WATCHING 1 BUILD`, or `WATCHING THE SHIP`)
   - `Needs you <n>`: the question mark, `<n> NEEDS YOU`
   - `Waiting`: grumpy, `WAITING`
   - `Idle`: one of tea, chess, messy or sweeping, picked at random when the word becomes `Idle`, with its caption from a fixed set. After 15 minutes of `Idle`, speck falls asleep, `NAPPING`, and stays asleep until the word changes or an event plays.

   No model is asked, and no ticket's building, self-check or review stage changes what speck does.
4. When two events happen at once, both animations play, one after the other. An event that happened before the page was loaded doesn't play.
5. Every caption fits on the screen without scrolling. With reduced motion on, each animation is one still frame, and the captions still change.

## Out of scope
- The screen's layout, frame and status word (0413).
- The pipeline log (0415).
- The ticket tiles' animations (0416).
- Captions written by a model.

## Notes
- No timed cycling: speck changes only when the pipeline does, and a nap lasts until something happens (the user, 2026-10-23).
- speck is the Foreman: building, reviewing and shipping are the work of other models, so speck shows them only as events (the user, 2026-10-23). The laptop now means writing tickets.
- The animations are the ones in console.html in https://claude.ai/artifact/R5CQDZJfMZ2rYcTmZK1B8z and `templates/lcd.js`: the landing page's states (`STATES`, whose `building` is the laptop), the panel's `ship`, `wait` and `bad` poses (`PANEL`), and the mock's new clipboard pose (`watch` in console.html). "One push" is one 3.2-second loop of `PANEL.ship`.
- Waits for 0413: both change `templates/panel.html`.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

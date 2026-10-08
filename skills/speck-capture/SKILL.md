---
name: speck-capture
description: Capture an idea or the current conversation as a speck idea note in speck/ideas/. Use when the user says "capture this", "save this idea", "speck capture", or wants to park an idea before it becomes a ticket.
---

# speck capture

Turn an idea, or the conversation so far, into a short note in `speck/ideas/`. Ideas are low ceremony. Don't size, number or estimate them; that happens in `/speck-ticket`.

CLI: `node .speck/scripts/speck.mjs`, run from the repo root (below: `speck`). If `speck/config.yml` doesn't exist, ask whether to run `speck init` first.

## Check for overlap first

Before you write anything, check whether the idea is already covered. `/speck-ticket` runs this same check before it creates a ticket. Read:

- every note in `speck/ideas/`, with its `Status:` value;
- every ticket in `speck/tickets/` and `speck/tickets/done/`, including done and cancelled ones. Read each ticket's problem, outcome and acceptance criteria, not only its title;
- `speck/product.md`, which says what the product already does.

An overlap is something with the same, or largely the same, outcome. Use your judgement: wording can differ, and a shared word isn't enough.

**If something overlaps,** name each match:

- an idea: its path and its `Status:` value, for example `speck/ideas/2026-10-08-pr-ship-mode.md (idea)`;
- a ticket: its id and its status, plus the reason (`cancel_reason`) if it was cancelled, for example `0006 (done)` or `0012 (cancelled: replaced by 0013)`;
- `speck/product.md`: quote the line that already covers it.

Then ask whether to add to the existing item, go ahead anyway or stop. Write nothing until the user answers: no note, no ticket and no edits to existing files. If they choose to add to it, put the new detail into that idea note or live ticket. A done or cancelled ticket isn't reopened this way, so say so and offer a new item that refers to it.

**If nothing overlaps,** say so in one line (for example "No overlap with existing ideas, tickets or product.md.") and carry on as normal.

## Steps

1. Work out the idea from the user's message or the conversation. If several distinct ideas came up, capture each one separately.
2. Run the overlap check above for each idea, and wait for the user if it finds anything.
3. Write `speck/ideas/<YYYY-MM-DD>-<short-slug>.md` using this shape. Keep it under 30 lines and use the user's own words where possible:

   ```markdown
   # <Idea title>

   Captured: <date> · Status: idea

   ## What
   <what the user wants, in 1–3 sentences>

   ## Why
   <the problem or opportunity, and who it's for>

   ## Notes
   - <decisions, constraints, links and open questions from the conversation>
   ```

4. Don't invent requirements the user didn't state. List unknowns under Notes as questions.
5. Reply with the file path and one line on what's needed to turn it into a ticket. Don't commit unless the user asks.

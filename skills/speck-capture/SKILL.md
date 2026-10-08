---
name: speck-capture
description: Capture an idea or the current conversation as a speck idea note in speck/ideas/. Use when the user says "capture this", "save this idea", "speck capture", or wants to park an idea before it becomes a ticket.
---

# speck capture

Turn an idea, or the conversation so far, into a short note in `speck/ideas/`. Ideas are low ceremony. Don't size, number or estimate them; that happens in `/speck-ticket`.

CLI: `node .speck/scripts/speck.mjs`, run from the repo root (below: `speck`). If `speck/config.yml` doesn't exist, ask whether to run `speck init` first.

## Steps

1. Work out the idea from the user's message or the conversation. If several distinct ideas came up, capture each one separately.
2. Write `speck/ideas/<YYYY-MM-DD>-<short-slug>.md` using this shape. Keep it under 30 lines and use the user's own words where possible:

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

3. Don't invent requirements the user didn't state. List unknowns under Notes as questions.
4. Reply with the file path and one line on what's needed to turn it into a ticket. Don't commit unless the user asks.

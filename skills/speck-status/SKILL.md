---
name: speck-status
description: Show speck tickets by status, with approved tickets waiting to ship and blocked tickets with their questions first, and suggest the next action. Use when the user asks "speck status", "what's on the board", "what's blocked", or what to work on next.
---

# speck status

1. Run `node .speck/scripts/speck.mjs status` from the repo root.
2. Summarise briefly:
   - **Approved:** these are waiting for the user, because `auto_ship` is off or doesn't cover them. Suggest reading `speck pack <id>` and then running `/speck-ship <id>`. Never ship them yourself.
   - **Blocked:** show each question, since these need the user.
   - **Ready:** list by priority, and suggest `/speck-build <id>` for the top one.
   - **Cancelled:** list them with their reason, so the user can see what was already considered and turned down. Don't suggest reviving one unless they ask.
   - **Drafts:** list any that need the user's decision to become ready.
   - **Ideas:** give the counts of waiting and ticketed ideas (`speck status` prints both), and offer `/speck-ticket` if there are ideas waiting.
3. For a ticket in `building` or `reviewing`, run `speck next <id>` to see whether the review loop is mid-flight, and say how to resume it.

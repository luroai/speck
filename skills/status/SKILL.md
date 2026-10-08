---
name: status
description: Show speck tickets by status, with blocked tickets and their questions first, and suggest the next action. Use when the user asks "speck status", "what's on the board", "what's blocked", or what to work on next.
---

# speck status

1. Run `node ${CLAUDE_PLUGIN_ROOT}/scripts/speck.mjs status`.
2. Summarise briefly:
   - **Blocked:** show each question, since these need the user.
   - **Ready:** list by priority, and suggest `/speck:build <id>` for the top one.
   - **Drafts:** list any that need the user's decision to become ready.
   - **Ideas:** give a count, and offer `/speck:ticket` if there are ideas waiting.
3. For a ticket in `building` or `reviewing`, run `speck next <id>` to see whether the review loop is mid-flight, and say how to resume it.

# Hand off to a Claude conversation from the panel

Captured: 2026-10-10 · Status: idea

## What
Wherever an action needs judgement, the panel offers a button that starts a conversation with your agent instead of acting itself, starting with "Discuss this idea". The message to users: use speck in a Claude session, with Claude as the admin even when you use the panel.

## Why
Ideas need to be discussed and agreed before they're promoted; you can't just promote them yourself. The panel should send people to the chat, not around it. "This is exactly the type of behaviour we want to promote."

## Notes
- Rule: a button when it's a yes/no decision on something already shaped and the effect is mechanical; a conversation when it needs judgement, wording or new information. The panel shows the board and holds the human gates; shaping happens in conversation.
- Handoffs: Discuss this idea (`/speck-ticket <idea>`), Answer this (blocked ticket), Talk it through (draft, before Ready), Explain this change (approved, walks the review pack), Settle this (escalated review dispute), What went wrong? (failed or stopped build), Triage with me (inbox, builds on 0037), What next? (board planning), Tell my stakeholders (release notes for a shipped ticket), Fix with Claude (setup health).
- The CLI generates each prompt (for example `speck ask <kind> <id>`; `speck prompt` is taken by the reviewer prompt), and the panel only copies it. Keeps prompts testable and the same everywhere.
- Positioning: update the brief and README to say Claude is the admin and ideas are agreed in conversation before they become tickets. This changes the brief's principles, so agree the wording first.
- Open: copy to clipboard only, or can the panel open a Claude session directly?

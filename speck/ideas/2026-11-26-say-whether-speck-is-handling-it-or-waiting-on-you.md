# Say whether speck is handling it or waiting on you

Captured: 2026-11-26 17:50 · Status: idea
Raised by: you

## What
Every ticket and question on the board says plainly which of two states it's in: "speck is handling this" (with what it's doing and what it's waiting for), or "waiting on you" (with the one thing to do, and that it's safe to do it now). "Needs you" only ever means the second.

## Why
The user can't tell when they're genuinely needed. In one case a build's blocked question said "leave this unanswered until another ticket ships", while the header said "Needs you". The other ticket had already shipped, but nothing said so. The watch agent had used up its 3 recommendations on that ticket, so the question silently became the user's, and `speck answer` refused it because it wasn't the watch agent's question. The user only found out by asking.

## Notes
- A question that waits on another ticket could name that ticket, and either resume by itself once that ticket is done, or move to "waiting on you" at that moment, saying "it has now shipped, answer to carry on".
- When the watch agent hits its recommendation limit, say so on the ticket, in plain words: "speck has stopped deciding for this ticket: your answer is needed".
- `speck answer` should accept a build's blocked question as well as the watch agent's question, or say which command does (today only the panel's Go with the recommendation does).
- Related, both dropped: `2026-10-18-answer-or-dismiss-the-foreman-s-question.md`, `2026-10-18-foreman-will-take-it-while-speck-run-is-off.md`.
- Open: should a "waiting on you" item send a notification, so the user isn't watching the board?

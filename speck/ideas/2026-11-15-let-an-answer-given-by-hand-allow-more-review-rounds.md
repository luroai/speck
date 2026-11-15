# Let an answer given by hand allow more review rounds

Captured: 2026-11-15 14:45 · Status: inbox
Triaged: 1
From ticket: 0680
Raised by: agent

## What
When you answer a question asked at the review limit by writing your answer in the ticket and running /speck-build, the build should get 2 more rounds, as it does after the Go with the recommendation button or `speck answer`.

## Why
Only the button and `speck answer` (or the panel's Answer) add the line that opens 2 more rounds, and the build mustn't write it itself. So an answer given by hand resumes a build that can only block again with the same question, the stall 0680 set out to end.

## Notes
- From my own note while building 0680 (self-check). 0680's criteria named only the button, the panel's Answer and `speck answer`.
- Open question: a small command for you, such as `speck allow <id>`, or a field you set in the ticket, so the build still can't open rounds for itself?

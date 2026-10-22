# Read a reviewer's verdict after a line of prose

Captured: 2026-10-22 · Status: ticketed (0383)
From ticket: 0374

## What
When a reviewer's reply has a sentence or two of prose before its JSON verdict, speck should still find and read the verdict, rather than refusing the round.

## Why
With `reviewer: cursor` on grok-4.7-high, `speck review` failed three times in a row on 0374 with "didn't return a verdict". Each time the model wrote a line such as "I'll review ticket 0374…" and then a valid verdict. A build that `speck run` starts can't get past this, so the ticket stalls in `building`.

## Notes
- From the builder's own note on 0374. The verdict was recorded with `speck record --reviewer=cursor` after running the same prompt by hand and stripping the prose.
- Open question: take the last JSON object in the text that has a `verdict` key, or tell the reviewer more firmly to reply with JSON only (or both)?

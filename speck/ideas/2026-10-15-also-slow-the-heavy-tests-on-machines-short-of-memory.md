# Also slow the heavy tests on machines short of memory

Captured: 2026-10-15 · Status: inbox
Triaged: 1
From ticket: 0233

## What
Run the heavy test files 2 at a time on machines with little memory (for example 8 GB or less), as well as on those with 8 cores or fewer.

## Why
0233 decides by cores only. The MacBook Air it was for has 8 cores, so it's covered, but a machine with more cores and little memory still starts every heavy file at once, and real panels and browsers use memory more than CPU. Its tests could still miss their time limits there.

## Notes
- From the builder's note on 0233's blocked question: the user chose C (cores only), with memory offered as an extra.
- Open question: what memory limit, and whether to count free memory or total memory.

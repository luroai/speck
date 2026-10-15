# Keep speck stop's five-second wait to five seconds

Captured: 2026-10-15 · Status: ticketed (0218)
From ticket: 0198

## What
When a build's process ignores the request to end, `speck stop` should force it to end after the 5 seconds it allows, not after about 11.

## Why
`speck stop` asks each process to end, then checks 50 times, 100 ms apart, before forcing it. Each check also lists every process on the machine, which took about 120 ms on a busy one, so the wait is about twice as long as meant. Someone pressing Stop build waits longer than they need to, and so does the 0072 test that checks it.

## Notes
- Seen while timing `test/stop-0072.test.mjs` in 0198: its `speck stop` took about 11 s.
- Open question: wait by the clock rather than by counting checks, or list the processes less often.

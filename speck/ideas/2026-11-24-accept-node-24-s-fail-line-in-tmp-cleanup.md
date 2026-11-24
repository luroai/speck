# Accept Node 24's fail line in tmp-cleanup

Captured: 2026-11-24 15:58 · Status: inbox
From ticket: 0727
Raised by: agent

## What
`test/tmp-cleanup.test.mjs` AC1 AC2 should accept the fail count Node's default reporter prints (`ℹ fail 2`), or force TAP for its nested `node --test` run, instead of requiring `# fail 2` only.

## Why
On Node 24 the nested fixture run no longer emits TAP `# fail 2` when stdout is captured, so every `speck test --files` that includes the checks fails that one test even when the temporary folder was cleaned.

## Notes
- Seen during 0727: recorded suite still passed, but checks always failed this assertion.
- Fix is a one-line match or `--test-reporter=tap` on the spawned fixture.

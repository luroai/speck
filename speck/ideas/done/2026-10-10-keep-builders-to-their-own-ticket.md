# Keep builders to their own ticket

Captured: 2026-10-10 · Status: ticketed (0095, 0096)

## What
Tighten the build, review and ticket skills so builders never fix problems outside their ticket, even when a criterion seems to need it. "Ideally we don't want agents going rogue."

## Why
On 2026-10-10, 0090 (add a licence) fixed an unrelated broken test on `main`, because its criterion said "the full test suite passes". The reviewer accepted it, and the fix then conflicted with 0086, which had to be merged and re-reviewed past its round limit. The rule "Keep to the ticket … Don't fix them" was already in the build skill; a criterion gave the builder a reason to break it.

## Notes
- Builder: run the tests on the base branch before starting, and record any that already fail. A test that failed before the change isn't the ticket's to fix, whatever its criteria say: note it, don't touch it, and stop at approved with a plain note.
- Reviewer: a change to a file the ticket doesn't need, to fix a failure that was there before, is out of scope and blocking, even when it makes a criterion pass.
- Ticket writing: don't write "the full suite passes" as a criterion. Write "no test that passed before fails", so a broken `main` can't pull a build out of scope.
- Builders also stop shipping from their own sessions once the shipping agent exists (`speck/ideas/2026-10-10-a-shipping-agent-that-heals-the-build.md`). These rule changes can ship before it.
- Open: should speck check this itself, for example by failing `speck close` when the branch changes a test file that a pre-existing failure was in?

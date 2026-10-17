# Look into a build that runs long

Captured: 2026-10-13 · Status: idea

## What
When a build runs well past the project's usual build time (outside its median range), speck starts an agent to look into why. If it finds that `main` itself is broken, for example a test that hangs, it raises a P0 fix ticket so the fix happens without waiting for the user to notice.

## Why
On 2026-10-13 a test added by 0149 hung about half of all full test runs. Builds went from 6–9 minutes to 26 and 45+, and nobody knew until the user asked why tonight's builds were taking ages. Spotting that and raising the fix (0159) took a human. speck already has the numbers to notice: the Shipped section shows median build minutes.

## Notes
- Trigger: a build's elapsed time passing some multiple of the median, or a fixed margin above it. Builds that are waiting for the user (approved, blocked) don't count.
- The investigating agent should read the build's log, the test runs (`speck/.cache/results/`) and the machine's load, and say in plain words what it found.
- Raising a P0 fix ticket means writing it, as `/speck-ticket` would. Open question: should speck also set it ready on its own? That skips Gate 1, the user's decision on what gets built. Options: always ask; set it ready only when a setting allows it (like `auto_ship`); or set it ready and say so plainly in the panel.
- It should tell the user what it found either way, even when the slowness was harmless (for example a big ticket).
- Related: 0152 ends a test run that stalls; 0153 shows ship progress in the panel; the phone idea's notifications (`speck/ideas/done/2026-10-13-use-the-panel-from-your-phone.md`) would be a natural way to tell the user.

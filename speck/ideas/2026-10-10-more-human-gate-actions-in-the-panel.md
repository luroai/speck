# More human-gate actions in the panel

Captured: 2026-10-10 · Status: idea

## What
Add panel buttons for actions that pass the rule "a yes/no decision on something already shaped, with a mechanical effect": Try it, Undo a ship, Notify me, and possibly Ship from the review pack.

## Why
The panel already holds Ready, priority and pause/play/stop. These fill the gaps a non-technical user feels most: seeing the change before shipping, and a safety net afterwards.

## Notes
- Try it (priority): run the approved branch's app from its worktree, via a new `commands.run` setting, so the user can click around before shipping. Using the change is stronger evidence than the review pack.
- Undo a ship: a confirmed revert of a shipped ticket's merge. Makes auto-ship less scary.
- Notify me: a desktop notification when a ticket is approved or blocked.
- Ship from the review pack (ticketed as 0133, after 0132 lets you read the pack in the panel): by the rule, Gate 2 belongs in the panel like Gate 1, but the brief says shipping only happens through `/speck-ship`. Open: change that principle? Related: 0015 (ask the user to confirm before ship merges) also aims to put the merge in the user's hands.
- Already captured, not repeated here: one more review round (`speck/ideas/2026-10-09-allow-one-more-review-round-without-editing-config.md`), resume a build (`speck/ideas/2026-10-09-resume-a-build-stopped-before-it-started.md`), cancel with reason (`speck cancel`, 0008).
- Decided: keep the framework and the panel in one repo. Move the panel into its own module (alongside 0018's split), and the panel writes to the repo only through CLI functions. Split the repos only for a different runtime, release rhythm or framework.

# Run a software factory from one speck service

Captured: 2026-11-10 20:42 · Status: idea
Raised by: you

## What
Grow speck from one team into a software factory: many teams (one per project), each with its own engineering manager, sharing one set of subscriptions under one person. Its first building block is a single speck service per machine running every project, rather than a panel and a `speck run` for each, then other machines reached over SSH.

## Why
"A tool to supercharge one human." With teams that build, review, check and ship by themselves, the limit becomes how many teams one person can oversee and how fairly they share subscriptions.

## Notes
- The bridge becomes the factory floor: what every team needs from you.
- Shared usage: something above the teams shares out each subscription, for example moving one team's builds to Codex when Claude reaches 85%.
- Web first: the panel on your phone over a private tunnel stays the main surface; a desktop app is a thin shell around the same panel, adding notifications and a menu-bar manager, built only when it pays. Telegram or Slack bring the manager's questions and reports to wherever you are.
- Related: `speck/ideas/2026-10-11-show-all-your-projects-in-one-panel.md`, which the bridge (0596) partly delivered.
- The vision and roadmap put this in 2.0.
- 2026-11-25: step 1, one speck service per machine, is ticketed as 0755 to 0759, released as 1.7.0 (0760). The rest stays here as an idea.

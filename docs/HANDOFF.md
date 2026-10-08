# Handover for the next agent

Last updated: 8 October 2026

## State

speck v0.1 is built and works end to end on Luro's machine, but nothing is committed yet. Read these first:
- `speck/product.md`: what exists today;
- `docs/brief.md`: the design and its rules;
- `AGENTS.md`: rules for working in this repo.

| Part | Where | Status |
|---|---|---|
| Install | `npx github:luroai/speck init` (`speck init` and `speck doctor` in `scripts/speck.mjs`) | Tested from an `npm pack` tarball into a fresh repo. Not yet tested from GitHub, because the changes aren't pushed |
| Skills | `skills/speck-{capture,ticket,build,review,ship,status}/SKILL.md` | Installed into `.claude/skills/` and `.agents/skills/`, and found by cptr. The Claude Code plugin was removed |
| CLI | `scripts/speck.mjs` | 11 unit tests pass (`npm test`) |
| Codex review loop | `speck review` | Verified end to end (see below) |
| `claude-subagent` reviewer | `skills/speck-review/SKILL.md`, `speck prompt`, `speck record` | **Not yet tested** (ticket 0003) |
| `/speck-ship` with `gh` | `skills/speck-ship/SKILL.md` | **Not yet tested** against a real GitHub remote |

## What was verified

On a throwaway repo (`/tmp/speck-e2e`):
1. A ticket was created and passed the lint.
2. The implementation included a planted bug and a weak test.
3. Round 1: Codex returned `changes_requested`, flagging both the bug and the weak test.
4. The builder fixed both and wrote a response file.
5. Round 2: the same Codex session was resumed, and it approved.
6. `speck pack` produced the PR body.

The verdict JSON schema is accepted by Codex's structured output in both the first round and resumed rounds.

## Known issues

- **Codex sandbox on this machine:** in `--sandbox read-only`, every command fails with `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`. The likely cause is Ubuntu's AppArmor restriction on unprivileged user namespaces (`kernel.apparmor_restrict_unprivileged_userns = 1`). The reviewer still works from the diff and test output in its prompt, but it can't inspect other files. The fix is a host-level choice for Luro, such as an AppArmor profile that allows bwrap. **Don't change system security settings without his approval.** Ticket 0001 makes speck warn when this happens.
- GitHub self-approval limit: ticket 0002.

## Next steps

1. Luro reviews the repo and makes the initial commit.
2. Dogfood: Luro marks a ticket `ready` (`node scripts/speck.mjs set 0001 status ready`), then runs `/speck-build 0001` from a Claude Code session in this repo. The skills are linked in by `node scripts/speck.mjs init`. From here on, every change goes through speck.
3. Create the GitHub repo (with Luro's approval only), add branch protection, and test `/speck-ship` for real.
4. Once pushed, test `npx github:luroai/speck init` in a fresh repo (the repo must be public, or the user needs access). Add a worked example with actuals from real tickets to the README.
5. Later, as a separate project: the board (`speck/ideas/2026-10-08-speck-board.md`).

## Rules

- Don't publish, push or create remote repos without Luro's explicit approval.
- Nothing about Luro's employer or other private projects goes in this repo.

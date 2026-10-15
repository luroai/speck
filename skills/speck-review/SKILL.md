---
name: speck-review
description: Run speck's independent, adversarial review loop for a ticket. The builder spawns a reviewer subagent (Codex by default, or a fresh Claude subagent) and they take turns until the reviewer approves or it escalates to the user. Use from /speck-build, or when the user says "speck review <id>" or "re-review ticket <id>".
---

# speck review loop

The builder (you) and an independent reviewer take turns on the same ticket. **Only the reviewer can approve.** The reviewer is read-only and cannot change code. Every round is recorded in the ticket file, in a `## Review rounds` section at the end that only speck writes. Never edit it by hand.

CLI: `node .speck/scripts/speck.mjs`, run from the repo root (below: `speck`).

## Before every round

- All work is committed. The reviewer reviews commits, not uncommitted changes. The new round that speck has just added to the ticket can stay uncommitted until your next commit, and so can the status change from `building` to `reviewing` that round 1 makes (or from `approved` to `reviewing`, in a re-review after merging the base branch).
- You stage only the files you created or changed, by name (`git add <path> …`). Never use `git add -A`, `git add .` or `git commit -a`: other sessions may have files in the same checkout, and those commands would sweep them into your commit. If files you didn't create or change appear, leave them alone (don't commit, move or delete them) and mention them to the user when you report back. Untracked files don't stop `speck review` or `speck record`; modified or staged tracked files that aren't committed do.
- The test output is fresh and from the round's test files only: `speck test --files <file>… 2>&1 | tee /tmp/speck-<id>-tests.txt`. The files are the ticket's own test files, any existing test files it changed and the files of any test that failed in its last test run. Never run the whole suite (`speck test` without `--files`) for a round: `speck ship` runs it on the ticket as it would land, before anything ships. This holds for round 1, later rounds and merge rounds alike. `speck test --files` runs `commands.test_files` from `speck/config.yml` with those files, or the whole suite when that's blank. When the output is TAP, as `node --test` writes it, the reviewer gets a summary instead of the full output: the run's totals, every failing test with its details, and every test whose name contains the ticket's id, with the path of the full output file.
- Each round has a response file, `/tmp/speck-<id>-response.md`, written fresh for the round, round 1 included, that says which test files you ran (a `- Tests run: <file> …` line). In later rounds it also answers the findings (see "Your turn").
- Wait for every command you start. Run each review round (`speck review`, or a reviewer subagent) and each test run between rounds (`speck test`, with or without `--files`) in the foreground, and wait for it to finish, however long it takes: give it the longest time limit your shell tool allows, and never spawn the reviewer subagent to run in the background. Never end your turn while a command you started is still running in the background. A build that `speck run` started ends when your turn ends, and whatever is still running is stopped with it.

## Reviewer model and effort

The reviewer's model and effort come from the ticket's `reviewer_model` and `reviewer_effort` fields. A blank ticket value falls back to the same fields in `speck/config.yml`. If both are blank, speck passes nothing and the reviewer runs on its own default. Model names are passed through exactly as written. Effort must be blank or one of `low`, `medium`, `high`, `xhigh` or `max` (`speck lint` checks this). Every saved round and the review pack record the model and effort used, or `default`.

## Round 1

Check the ticket's `reviewer:` field.

**`codex` (default)**

```
speck review <id> --tests=/tmp/speck-<id>-tests.txt --response=/tmp/speck-<id>-response.md
```

This runs Codex in a read-only sandbox, with the reviewer model (`-m`) and effort (`model_reasoning_effort`) if they're set, and gives it the ticket, the diff, the test output and your response file. It saves the Codex session so later rounds continue the same conversation, records the round, and prints the verdict and `NEXT: …`. Exit codes: 0 means ship, 10 means fix, 11 means block.

**Any reviewer with a `command`** under `reviewer_options` in `speck/config.yml`

```
speck review <id> --tests=/tmp/speck-<id>-tests.txt --response=/tmp/speck-<id>-response.md
```

speck runs the command, sends it the prompt, reads the verdict from its output and records the round, just as for Codex. You never handle the verdict. Exit codes are the same. If it fails, it says why and records nothing: fix the command or the reviewer's setup, then run it again.

**`claude-subagent`** (only if config allows it, because it's the same model family)

1. Run `speck prompt <id> --tests=/tmp/speck-<id>-tests.txt --response=/tmp/speck-<id>-response.md > /tmp/speck-<id>-prompt.md`.
2. Run `speck reviewer-settings <id>`. It prints `model: …` and `effort: …`, and saves them so that later rounds are recorded with the settings this reviewer was started with. Run it only when you start a new reviewer.
3. Spawn a fresh subagent with the Agent tool. If the model isn't `default`, pass it as written as the Agent tool's `model`. If the effort isn't `default`, pass it as `effort`. If a value is `default`, leave that parameter out so the subagent runs on your own model in a fresh session. Its prompt should say: "Read /tmp/speck-<id>-prompt.md and follow it. You are read-only: do not edit files. Return only the JSON verdict." Keep the agent's id: you'll send round 2 to it with SendMessage.
4. Save its reply to `/tmp/speck-<id>-verdict.json` as it came back. A subagent often puts the JSON inside a ```` ```json ```` fence, and `speck record` accepts that, so don't edit the reply. Then run `speck record <id> /tmp/speck-<id>-verdict.json --reviewer=claude-subagent --tests=/tmp/speck-<id>-tests.txt`, so the review pack says what the reviewer was told about the tests.

## Your turn (when NEXT is `fix`)

Respond to **every blocking finding** in a response file, `/tmp/speck-<id>-response.md`:

```markdown
- Tests run: test/<area>-<id>.test.mjs …
- F1: fixed. <what you changed, file/function>
- F2: disputed. <concrete reason, with evidence from the code or ticket>
- F3: needs_pm. <the product question>
```

- **Fix** whenever the reviewer is right. That's the default.
- **Dispute** only with a concrete, checkable reason, such as "the ticket puts X out of scope" or "test Y covers that path". Don't dispute to save effort.
- **needs_pm** if the finding depends on a product decision. Then stop the loop and block the ticket using the build skill's section 6.
- Minor findings don't block. Fix them if they're trivial; otherwise handle them as follow-up ideas in `/speck-build` section 5 step 1: they go in the ticket's Delivery log, and any that would need its own ticket also goes to the inbox in `speck/ideas/`.

Check each fix with the ticket's own test files (`speck test --files <file>…`). Then, once your fixes for this round are done, run the round's test files once (see "Before every round"), keeping the output (`speck test --files <file>… 2>&1 | tee /tmp/speck-<id>-tests.txt`), commit (`speck(<id>): review round N fixes`), and run the next round. This holds for every round, merge rounds included. Never run the whole suite (`speck test` without `--files`). If a test fails because of your change, fix it and run the files again: never start a round on a run that failed because of your change.

## Round 2 onwards

**codex**

```
speck review <id> --tests=/tmp/speck-<id>-tests.txt --response=/tmp/speck-<id>-response.md
```

This resumes the same Codex session. The reviewer remembers its earlier findings and sees your response plus the diff since its last review.

**Reviewer with a `command`:** run the same command as for Codex, with `--response`. If the reviewer's config has `session_id_path` and `resume_command`, speck continues its session and sends only your response, the new diff and the tests. Otherwise, or if resuming fails, speck says so in one line and resends the round-1 prompt, every earlier verdict and response, then your new response and the diff since its last review. Either way, carry on as normal.

**claude-subagent:** use SendMessage to the agent id you kept in round 1. That resumes the same reviewer, with its earlier findings and the model and effort it started with. Don't spawn a new one. Include your response file, the output of `speck diff <id>` (the changes since its last review, or the whole change against the base branch as merged after a merge, without the ticket's review rounds) and the new test output, and ask for the full verdict JSON again with stable finding ids. Save its reply as in round 1, then run `speck record <id> /tmp/speck-<id>-verdict.json --reviewer=claude-subagent --tests=/tmp/speck-<id>-tests.txt`.

## Ending the loop

Check `speck next <id>` after each round:
- `ship`: the reviewer approved with every criterion passing and no open blocking findings. Go to the build skill's section 5 (Approved). Never merge or ship unless the user runs `/speck-ship`. `speck run`'s ship queue ships approved tickets when `auto_ship` in `speck/config.yml` allows it.
- `fix`: take another turn.
- `block`: max rounds reached, repeated disagreement on the same finding, or the reviewer escalated. Block the ticket with the reason as the question, using the build skill's section 6.

speck overrides an `approve` that still has failing criteria or open blocking findings, so a lenient reviewer can't wave a change through.

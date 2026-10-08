---
name: speck-review
description: Run speck's independent, adversarial review loop for a ticket. The builder spawns a reviewer subagent (Codex by default, or a fresh Claude subagent) and they take turns until the reviewer approves or it escalates to the user. Use from /speck-build, or when the user says "speck review <id>" or "re-review ticket <id>".
---

# speck review loop

The builder (you) and an independent reviewer take turns on the same ticket. **Only the reviewer can approve.** The reviewer is read-only and cannot change code. Every round is recorded in `speck/reviews/<id>/round-N.json`.

CLI: `node .speck/scripts/speck.mjs`, run from the repo root (below: `speck`).

## Before every round

- All work is committed. The reviewer reviews commits, not uncommitted changes.
- The test output is fresh: `<test command> 2>&1 | tee /tmp/speck-<id>-tests.txt`.

## Reviewer model and effort

The reviewer's model and effort come from the ticket's `reviewer_model` and `reviewer_effort` fields. A blank ticket value falls back to the same fields in `speck/config.yml`. If both are blank, speck passes nothing and the reviewer runs on its own default. Model names are passed through exactly as written. Effort must be blank or one of `low`, `medium`, `high`, `xhigh` or `max` (`speck lint` checks this). Every saved round and the review pack record the model and effort used, or `default`.

## Round 1

Check the ticket's `reviewer:` field.

**`codex` (default)**

```
speck review <id> --tests=/tmp/speck-<id>-tests.txt
```

This runs Codex in a read-only sandbox, with the reviewer model (`-m`) and effort (`model_reasoning_effort`) if they're set, and gives it the ticket, `product.md`, the diff and the test output. It saves the Codex session so later rounds continue the same conversation, records the round, and prints the verdict and `NEXT: …`. Exit codes: 0 means ship, 10 means fix, 11 means block.

**`claude-subagent`** (only if config allows it, because it's the same model family)

1. Run `speck prompt <id> --tests=/tmp/speck-<id>-tests.txt > /tmp/speck-<id>-prompt.md`.
2. Run `speck reviewer-settings <id>`. It prints `model: …` and `effort: …`.
3. Spawn a fresh subagent with the Agent tool. If the model isn't `default`, pass it as written as the Agent tool's `model`. If the effort isn't `default`, pass it as `effort`. If a value is `default`, leave that parameter out so the subagent runs on your own model in a fresh session. Its prompt should say: "Read /tmp/speck-<id>-prompt.md and follow it. You are read-only: do not edit files. Return only the JSON verdict." Keep the agent's id.
4. Save its JSON reply to `/tmp/speck-<id>-verdict.json`, then run `speck record <id> /tmp/speck-<id>-verdict.json --reviewer=claude-subagent`.

## Your turn (when NEXT is `fix`)

Respond to **every blocking finding** in a response file, `/tmp/speck-<id>-response.md`:

```markdown
- F1: fixed. <what you changed, file/function>
- F2: disputed. <concrete reason, with evidence from the code or ticket>
- F3: needs_pm. <the product question>
```

- **Fix** whenever the reviewer is right. That's the default.
- **Dispute** only with a concrete, checkable reason, such as "the ticket puts X out of scope" or "test Y covers that path". Don't dispute to save effort.
- **needs_pm** if the finding depends on a product decision. Then stop the loop and block the ticket using the build skill's section 6.
- Minor findings don't block. Fix them if they're trivial; otherwise list them as follow-up ideas in the PR.

Then re-run the tests, commit (`speck(<id>): review round N fixes`), and run the next round.

## Round 2 onwards

**codex**

```
speck review <id> --tests=/tmp/speck-<id>-tests.txt --response=/tmp/speck-<id>-response.md
```

This resumes the same Codex session. The reviewer remembers its earlier findings and sees your response plus the diff since its last review.

**claude-subagent:** use SendMessage to the same reviewer agent, which keeps the model and effort it started with. Include your response file, the output of `git diff <last reviewed sha>..HEAD` and the new test output, and ask for the full verdict JSON again with stable finding ids. Record it with `speck record`.

## Ending the loop

Check `speck next <id>` after each round:
- `ship`: the reviewer approved with every criterion passing and no open blocking findings. Go to ship.
- `fix`: take another turn.
- `block`: max rounds reached, repeated disagreement on the same finding, or the reviewer escalated. Block the ticket with the reason as the question, using the build skill's section 6.

speck overrides an `approve` that still has failing criteria or open blocking findings, so a lenient reviewer can't wave a change through.

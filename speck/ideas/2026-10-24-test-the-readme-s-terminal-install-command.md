# Test the README's terminal install command

Captured: 2026-10-24 · Status: inbox
From ticket: 0491

## What
Add the README's command to run in a terminal (the `npx 'github:luroai/speck#semver:*' init` block under Get started) to the few README facts that are tested, beside the setup prompt, the status line's version, the pictures and the links.

## Why
0491 left the README tested only for the four things its criteria named, so the check on that command was removed. A wrong command there breaks installs for anyone who skips the setup prompt, which is what the rule's exceptions are for.

## Notes
- From the reviewer's round 1 finding on 0491: the check was kept at first, then removed because the ticket's list allowed only four exceptions.
- Would change the ticket skill, the brief's "Criteria about documents", the reviewer prompt and docs-0491's allowed list.

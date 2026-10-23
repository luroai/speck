---
id: "0408"
title: "Don't offer DeepSeek until you add it"                # one outcome, no "and"
status: building            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
task: code               # code | document (what the build makes: a code change or a document)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: "speck/ideas/done/2026-10-23-dont-offer-deepseek-until-you-add-it.md"               # e.g. speck/ideas/2026-10-08-csv-export.md
after: []                # ticket ids that must be done first
created: 2026-10-23
started: "2026-10-23T12:51:23.306Z"

---
# 0408 · Don't offer DeepSeek until you add it

**Status:** 🔨 building

## Problem
Add an agent still offers DeepSeek with a key field even when this machine has never set a DeepSeek key. Beside the Add an API provider form from 0401, that row looks like speck expects an account you do not have.

## Outcome
Add an agent does not offer DeepSeek, or any other known API provider, until you have added that provider yourself.

## Acceptance criteria
1. With Add an agent open, DeepSeek does not appear as an offer row when this machine has no DeepSeek key and DeepSeek is not one of your agents. Other known providers in speck's list are treated the same way.
2. API providers are added only through the Add an API provider form from 0401. Claude Code, Codex and Cursor are still offered when they are not yours, as today.
3. A provider that is already one of your agents still appears under Your agents, with its key and Remove. Someone who already uses DeepSeek keeps it. No test that passed before this change fails, except a check that Add an agent offers DeepSeek without a key, which is changed to check criterion 1.

## Out of scope
- Removing DeepSeek from speck's built-in provider list for builds and reviews that already use it.
- Changing the Add an API provider form.

## Notes
- Asked for 2026-10-23 after 0401 shipped the form but left the DeepSeek offer in `addRows` (`templates/panel.html`). 0401's criterion 1 only required that DeepSeek not be the only way to add a provider.
- Checked 2026-10-23: `addRows` maps every agent that is not yours, including `kind === 'provider'` from `PROVIDERS` (DeepSeek), and shows a key field when `key_set` is false.
- A provider removed from Your agents with its key still kept may still be offered with Add and no paste, as 0399 left it: that is someone who already configured it.
- Failing before this build: none
- Existing tests changed: besides 0393's check that DeepSeek with no key is offered with its key field (now checking AC1), five other checks relied on the removed offer: 0399 AC2 (offers listed TestCo with its key field), 0399 AC3's page part (pasting TestCo's key in its offer row; now pasted in its own row once yours), 0399 AC4 in a browser (counted two offers; now one), 0393 AC2's two page checks (DeepSeek's key field under Add an agent; now in its row as one of yours) and 0393 AC4's page part (TestCo offered with no key; now not offered). Each keeps its intent where the behaviour still exists.
- The form refuses the name DeepSeek, as speck already knows it, so the built-in DeepSeek is added by setting its key (`speck keys set deepseek`, or keeping it when removed), after which Add an agent offers it with Add. The README says so.
- Self-check: README's Add an agent sentence still said each provider is offered with a key field; changed it and added a facts check.

## In plain words
<!-- Filled in by the builder before approval: the change for someone who doesn't read code. -->

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

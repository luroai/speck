---
id: "0497"
title: "Pitch the README's bursts paragraph to PMs who work with tech teams"                # one outcome, no "and"
status: done            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5, or 0 on a fix ticket
size: S                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
kind: code               # code | task (what the build does: changes the project's code, or does a task and leaves its result in outputs/)
type: ""                 # blank | bug (a ticket that fixes a defect) | fix (fixes a broken base branch, at priority 0)
builder: ""              # blank: the builder your settings give when the build starts
reviewer: ""             # blank: the reviewer your settings give when each review round starts
reviewer_model: ""       # blank: your settings' reviewer_model (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: your settings' reviewer_effort. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0496"]                # ticket ids that must be done first
created: 2026-10-25
started: "2026-10-25T10:24:05.325Z"
approved: "2026-10-25T10:25:14.568Z"
finished: "2026-10-25T10:28:46.088Z"

---
# 0497 · Pitch the README's bursts paragraph to PMs who work with tech teams

**Status:** ✅ done

## Problem
The README's third paragraph sells speck through a phone ("check the panel on your phone afterwards"), and who speck is for sits apart, lower down, in one thin line. The people speck is built for, PMs and others who've worked alongside tech teams without writing the code, should see themselves straight away, with the bursts of ticketing up a batch, walking away and coming back that they'll recognise.

## Outcome
The README's opening says speck was built by a PM for PMs and non-technical people used to working with tech teams, and that it fits working in bursts, with no mention of a phone.

## Acceptance criteria
1. The paragraph that starts "It fits the way you really work, in bursts" is replaced by one that says speck was built by a product manager, for product managers and other people who've worked alongside tech teams without writing the code. (checked by review)
2. The new paragraph describes working in bursts: ticketing up a batch, going away, coming back to what's shipped and setting the next batch going. It ends with speck stopping only when it needs you, with one plain question. (checked by review)
3. The new paragraph doesn't mention a phone. (checked by review)
4. The separate line "speck was built by a product manager, for people who decide what gets built but don't write the code. Engineers use it too." is gone, and the new paragraph keeps that engineers use speck too. (checked by review)
5. No test that passed before this change fails.

## Out of scope
- Naming speck in place of "It" in the rest of the README: 0496.
- The phone in The clever bits ("It fits in your pocket") and The panel section, which stay.

## Notes
- Wording agreed with the user on 2026-10-25, to use as it is unless review finds a fact wrong:
  > speck was built by a product manager, for product managers and anyone who has spent years working alongside tech teams without writing the code themselves. You already know how to shape a piece of work and tell when it's done. speck fits the way that work really happens, in bursts between everything else: ticket up a batch before a meeting, come back afterwards to see what's shipped, and set the next batch going before you log off. speck stops only when it needs you, with one plain question. Engineers use speck too.
- Waits for 0496: both change the README's opening paragraphs, on lines next to each other.
- Failing before this build: none
- No new tests: criteria 1 to 4 are about how the README reads (checked by review), and criterion 5 is checked by running the existing test files that name the README. A reviewer can check it by reading the README's opening paragraphs.
- Self-check: no changes. The agreed wording is used as it is. Its bursts part ends with speck stopping only when it needs you, with one plain question; the closing "Engineers use speck too." follows it, as criterion 4 keeps engineers in the paragraph.
- Pictures: none, because the change is a README copy change with no layout change.

## In plain words
The README's opening now says straight away who speck is for: it was built by a product manager, for product managers and anyone who has worked alongside tech teams without writing the code. The same paragraph describes working in bursts, without mentioning a phone, and still says engineers use speck too. The old one-line note about who speck is for, lower down, is gone. Open the README on GitHub to read it: it's the third paragraph.

## Blocked question
<!-- Filled in by speck only when status is blocked. -->

## Review log
Round 1 (codex): approve.

## Delivery log
- Review rounds: 1
- Reviewer: codex, model gpt-6.1-sol, effort default
- Reviewer tokens: 83,216
- Elapsed since build started: 1 min
- Changed lines: 4 (limit 5000)
Follow-ups: none.

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · approve</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "44a774fe079c11f6201dd6ba6c01e41b58b83a72",
    "session": "fresh",
    "thread_id": "01a17297-75af-71a1-8e49-ee7f3ebf129a",
    "builder_response": "- Tests run: `speck test --related` with no ticket test files (criteria 1 to 4 are checked by review); it chose every existing test file that names README.md (docs-0491, install-0253, readme-0089, readme-0249, readme-0250, readme-links-0491, the release-* files, repo-speck-0122, retry-0228, setup-0107) plus the commands.checks files. 356 tests, 0 failing.\n- The new paragraph is the wording the user agreed on 2026-10-25 (ticket Notes), used as it is. The bursts part ends with \"speck stops only when it needs you, with one plain question.\"; \"Engineers use speck too.\" closes the paragraph, as criterion 4 asks the paragraph to keep it.\n- The separate line \"speck was built by a product manager, for people who decide what gets built but don't write the code. Engineers use it too.\" is removed. The phone in The clever bits and The panel section are out of scope and unchanged.\n",
    "seconds": 17,
    "usage": {
      "input_tokens": 82608,
      "cached_input_tokens": 49024,
      "cache_write_input_tokens": 0,
      "output_tokens": 608,
      "reasoning_output_tokens": 23
    },
    "tests": {
      "failing": 0,
      "second_try": []
    },
    "saved_at": "2026-10-25T10:25:08.457Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "approve",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "README.md:9 replaces the bursts paragraph with the agreed wording identifying its PM creator and intended audience of PMs and people experienced alongside tech teams."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "README.md:9 describes ticketing a batch before a meeting, returning afterwards to see what shipped and starting the next batch. The bursts passage ends with stopping when needed, with one plain question; the engineers sentence follows, as clarified in the ticket Notes."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "README.md:9 contains no phone reference."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "README.md:9 retains 'Engineers use speck too.' The diff removes the separate audience paragraph beneath the agents paragraph."
      },
      {
        "id": 5,
        "status": "pass",
        "evidence": "/tmp/speck-0497-tests.txt confirms 356 tests: 353 passed, 3 skipped, 0 failed. Existing README-related tests and repository checks ran; no tests or executable code changed."
      }
    ],
    "findings": [],
    "escalation_question": "",
    "summary": "The README now speaks directly to PMs and people who work alongside tech teams, using the agreed wording about working in bursts. It retains engineers as an audience and removes the phone reference from this paragraph. The change stays within scope, and the relevant tests pass."
  }
}
```

</details>

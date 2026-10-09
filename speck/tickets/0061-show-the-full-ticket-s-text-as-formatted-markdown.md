---
id: "0061"
title: "Show the full ticket's text as formatted Markdown"                # one outcome, no "and"
status: blocked            # draft | ready | building | reviewing | blocked | approved | done | cancelled
priority: 3              # 1 (highest) to 5
size: M                  # S | M  (L is never ready; split it)
risk: low                # low | high (auth, payments, data deletion, migrations, infra, secrets)
type: ""                 # blank | bug (a ticket that fixes a defect)
builder: claude
reviewer: codex
reviewer_model: gpt-6.1-sol       # blank: use speck/config.yml (blank there too: the reviewer's default)
reviewer_effort: ""      # blank: use speck/config.yml. Otherwise low | medium | high | xhigh | max
source: ""               # e.g. speck/ideas/2026-10-08-csv-export.md
after: ["0060"]               # ticket ids that must be done first
created: 2026-10-09
started: "2026-10-09T19:42:48.053Z"

---
# 0061 · Show the full ticket's text as formatted Markdown

**Status:** ⛔ blocked

## Problem
The full ticket pane shows each section as plain text, so Markdown such as `**bold**`, `` `code` `` and `- ` lists shows its raw symbols. Long notes and criteria with code and lists are harder to read than in a Markdown viewer.

## Outcome
The full ticket pane shows each section's Markdown formatted, the way a Markdown viewer would.

## Acceptance criteria
1. In every section of the pane (problem, outcome, each acceptance criterion, out of scope and notes), this Markdown shows formatted: `**bold**` as bold; `*italic*` and `_italic_` as italic; `` `code` `` in monospace with a background; fenced code blocks (three backticks) as monospace blocks keeping their line breaks and spaces; lines starting `- `, `* ` or `1. ` as bulleted or numbered lists, nested by their indentation; `#`, `##` and `###` lines as headings smaller than the section's own heading; and blank lines between paragraphs.
2. A link `[text](url)` whose URL starts `http://` or `https://` shows its text as a link that opens in a new tab. Any other link shows as its text only, with nothing to click.
3. Anything else, including raw HTML such as `<script>` or `<img src=x onerror=alert(1)>`, shows as literal text, exactly as written. Markdown symbols inside code spans and code blocks show as written, unformatted.
4. Text selected in the pane stays selected through the 2-second refresh while that ticket's data in `/api/state` is unchanged, as it does today.

## Out of scope
- Ideas, inbox notes, the short open view in the Tickets list, and the queue: they stay plain text.
- Tables, images, blockquotes and other Markdown not listed above: they show as literal text.
- Making the pane modal (0060).

## Notes
- After 0060, as both change the side pane in `templates/panel.html`.
- The page is one file served locally: nothing may be loaded from the network, such as a Markdown library from a CDN.
- product.md says ticket text is "always shown as text, never as HTML": it needs to say the pane formats the Markdown listed here and shows everything else as text.
- The sections come from `/api/state` as their Markdown text (`problem`, `outcome`, `acceptance_criteria`, `out_of_scope`, `notes`). Nothing in the JSON changes.
- Headings: "smaller than the section's own heading" is built as ranking below it: `#` is an `h5`, `##` and `###` are `h6` (classes `md-h1` to `md-h3`), under the section's `h4`, no larger than body text.
- Three older assertions expected the raw `- Not this.` / `- A note.` / `- A new note.` in the pane (`test/panel-0054.test.mjs`, `test/panel.test.mjs`). AC1 makes those list items, so they now look for the item text.
- Self-check: a list starting `0.` showed as starting at 1, lists nested 2000 deep overflowed the stack, and long runs of unmatched `[`, `*`, `**` or `_` took seconds; fixed with `start` kept as written, nesting capped at 16 levels, closer searches remembered per call and code spans found once, with a test for each.

## Blocked question
The reviewer hit the 3-round limit with one open finding (F3: text after a multi-line HTML element's closing tag stayed unformatted). It's now fixed with a regression test, committed but not yet reviewed. Allow one more review round to check the F3 fix (yes/no)? Recommendation: yes. Rounds 1 and 2 were also about HTML edge cases inside AC3, and every criterion other than this one passed in round 3.

## Review log
<!-- Filled in by speck: one line per round, with the verdict and the key findings. -->

## Delivery log
<!-- Filled in by speck: attempts, review rounds, wall time, cost. -->

## Review rounds
<!-- Written by speck after each review round. Don't edit it by hand. -->

<details><summary>Round 1 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 1,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "957ed34848e48d907ae7fe6620c3e7560290b74a",
    "thread_id": "01a1223b-625f-79c3-8eb3-adfc141efabc",
    "seconds": 40,
    "usage": {
      "input_tokens": 311135,
      "cached_input_tokens": 230144,
      "cache_write_input_tokens": 0,
      "output_tokens": 1179,
      "reasoning_output_tokens": 165
    },
    "saved_at": "2026-10-09T19:55:19.786Z"
  },
  "verdict": {
    "round": 1,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "The AC1 tests exercise formatting in every section, but markdown() in templates/panel.html:376 clears list nesting on every blank line. Reproduced '- first\\n\\n  - child': it produces two top-level lists instead of a nested list."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "inline() filters link protocols; mdInline() sets target='_blank' and rel='noopener noreferrer'. test/panel-0061.test.mjs exercises permitted and rejected URLs, including browser coverage."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "markdown()/inline() format Markdown inside unsupported constructs. Reproduced '<img alt=\"**bold**\" src=x>', '![**alt**](https://example.com/a_b)' and '> **quoted**': each produces a strong node and removes the literal ** symbols. Existing AC3 tests omit Markdown inside these constructs."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The pane retains its nodes when its ticket signature is unchanged. The AC4 node-retention test and real-browser selection test in test/panel-0061.test.mjs exercise refresh preservation."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html:417",
        "issue": "Unsupported constructs do not remain literal when they contain recognised Markdown. Raw HTML attributes, image labels and blockquotes can lose their Markdown symbols and gain formatting, contrary to AC3 and the explicit scope.",
        "suggested_fix": "Preserve unsupported constructs as literal text before applying inline formatting. Add regression tests containing bold, italic, code and links inside raw HTML, images and blockquotes.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "templates/panel.html:376",
        "issue": "Blank lines discard list context. A nested item following a blank line becomes a separate top-level list, so nesting no longer follows indentation as AC1 requires.",
        "suggested_fix": "Keep list context across blank lines when subsequent items continue the list, using indentation to determine nesting. Add a test for '- first\\n\\n  - child\\n- second'.",
        "state": "open"
      }
    ],
    "product_md": {
      "accurate": false,
      "note": "The update describes the intended capability, but its claims that unsupported Markdown remains literal and lists nest by indentation are not fully true until F1 and F2 are fixed."
    },
    "escalation_question": "",
    "summary": "The pane formats the basic examples, safely restricts links and preserves selected text through refreshes. Two formatting gaps remain: unsupported content can have its literal symbols removed, and blank lines break nested lists. These need fixes before merge."
  }
}
```

</details>

<details><summary>Round 2 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 2,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "0e6f6d27f61ca325dd9c8958cef95859128dde21",
    "thread_id": "01a1223b-625f-79c3-8eb3-adfc141efabc",
    "seconds": 30,
    "usage": {
      "input_tokens": 552397,
      "cached_input_tokens": 430464,
      "cache_write_input_tokens": 0,
      "output_tokens": 2075,
      "reasoning_output_tokens": 226
    },
    "saved_at": "2026-10-09T19:59:24.322Z"
  },
  "verdict": {
    "round": 2,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "pass",
        "evidence": "markdown(), fullTicket() and mdBlocks() format all sections. The AC1 tests cover the listed formatting; the new '0061 AC1 (review F2)' test covers nesting across blank lines. Independently reproduced the corrected nested-list structure."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "inline() permits only HTTP/HTTPS targets; mdInline() opens them in a new tab with noopener noreferrer. The AC2 unit and browser tests exercise permitted and rejected links and pass in the supplied output."
      },
      {
        "id": 3,
        "status": "fail",
        "evidence": "keptSpans() now preserves HTML tags and attributes, images and comments, but does not preserve HTML element contents. Independently reproduced '<script>**bold** [link](https://x.y)</script>': markdown() still creates strong and clickable link nodes, removing literal Markdown symbols inside the raw HTML."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The pane's unchanged-signature guard retains its formatted nodes. The AC4 node-retention and real-browser selection tests exercise refresh preservation and pass in the supplied output."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html:keptSpans",
        "issue": "The literal-content fix is incomplete: it protects HTML tags, but Markdown between opening and closing tags is still formatted. For example, '<script>**bold** [link](https://x.y)</script>' loses its ** symbols and gains a clickable link. No script executes, but AC3 requires this raw HTML to remain literal.",
        "suggested_fix": "Preserve complete raw HTML constructs, including their contents, from Markdown parsing. Add regression coverage for paired HTML containing bold, code and links, including multiline content.",
        "state": "open"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "templates/panel.html:markdown",
        "issue": "Resolved: blank lines now retain list context, and subsequent items nest by indentation. The new review F2 test honestly exercises both nested and numbered lists across blank lines.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      }
    ],
    "product_md": {
      "accurate": false,
      "note": "The list description is now accurate. The claim that Markdown inside raw HTML remains unformatted is still broader than the implementation; F1 remains open."
    },
    "escalation_question": "",
    "summary": "Nested lists now survive blank lines correctly. Formatting, restricted links and selection preservation remain covered. One literal-text gap remains: Markdown inside paired HTML tags is still formatted, so the change needs another fix before merge."
  }
}
```

</details>

<details><summary>Round 3 · codex · changes_requested</summary>

```json
{
  "meta": {
    "round": 3,
    "reviewer": "codex",
    "reviewer_model": "gpt-6.1-sol",
    "reviewer_effort": "default",
    "reviewed_sha": "1d9e396244799a5ad4c21d198da9d1636cba946f",
    "thread_id": "01a1223b-625f-79c3-8eb3-adfc141efabc",
    "seconds": 32,
    "usage": {
      "input_tokens": 870078,
      "cached_input_tokens": 709632,
      "cache_write_input_tokens": 0,
      "output_tokens": 3018,
      "reasoning_output_tokens": 267
    },
    "saved_at": "2026-10-09T20:04:10.122Z"
  },
  "verdict": {
    "round": 3,
    "verdict": "changes_requested",
    "criteria": [
      {
        "id": 1,
        "status": "fail",
        "evidence": "The AC1 tests cover all sections and list nesting, but the new multiline HTML branch in markdown() suppresses formatting outside the HTML element. Independently reproduced '<div>\\nx\\n</div> **outside**': **outside** remains literal instead of becoming bold."
      },
      {
        "id": 2,
        "status": "pass",
        "evidence": "inline() restricts clickable targets to HTTP/HTTPS, and mdInline() sets a new-tab target and safe rel attributes. AC2 unit and browser tests pass in the supplied output; independently checked permitted and rejected targets."
      },
      {
        "id": 3,
        "status": "pass",
        "evidence": "keptSpans()/elementEnd() now preserve complete HTML elements, while markdown() preserves multiline HTML. The review F1 regression tests cover attributes, paired and nested elements, multiline content and unsupported constructs. Code-literal and browser safety tests also pass."
      },
      {
        "id": 4,
        "status": "pass",
        "evidence": "The unchanged-ticket signature guard still retains pane nodes. AC4 node-retention and real-browser selection tests pass in the supplied output; this round does not alter refresh handling."
      }
    ],
    "findings": [
      {
        "id": "F1",
        "severity": "blocking",
        "file": "templates/panel.html:keptSpans and elementEnd",
        "issue": "Resolved: complete HTML elements and their contents now remain literal, including the script example from round 2. Regression coverage exercises the behaviour without mocking the parser.",
        "suggested_fix": "No further change required for this finding.",
        "state": "resolved"
      },
      {
        "id": "F2",
        "severity": "blocking",
        "file": "templates/panel.html:markdown",
        "issue": "Resolved: list context remains intact across blank lines, with nested items placed by indentation. The review F2 regression test remains passing.",
        "suggested_fix": "No further change required.",
        "state": "resolved"
      },
      {
        "id": "F3",
        "severity": "blocking",
        "file": "templates/panel.html:markdown multiline HTML branch",
        "issue": "The new branch marks the entire closing line as literal, including text after the closing tag. For '<div>\\nx\\n</div> **outside**', the bold text outside the element is left unformatted. Links and code after the tag are suppressed too. This contradicts AC1 and the builder's claim that text outside the element is formatted.",
        "suggested_fix": "End the literal span at the closing tag's exact character position and parse the remaining text normally. Add a regression test with bold, code and an HTTP link after a multiline element's closing tag.",
        "state": "open"
      }
    ],
    "product_md": {
      "accurate": false,
      "note": "The HTML preservation description now matches the intended behaviour, but the general formatting claim is still inaccurate for text following a multiline element's closing tag (F3)."
    },
    "escalation_question": "",
    "summary": "Both earlier findings are fixed. The latest fix introduces one formatting regression: text after a multiline HTML element's closing tag stays unformatted. That needs correcting before merge; link safety and selection preservation remain covered."
  }
}
```

</details>

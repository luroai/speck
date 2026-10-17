# Review the documents an agentic task writes

Captured: 2026-10-17 · Status: idea

## What
When speck builds agentic tasks, with writing documents as one of the main tasks, work out how to point the user at the documents to review. The whole document can't go in a review pack. Is a review pack even needed for tasks like these?

## Why
For code, the review pack lets someone who doesn't read code decide whether to ship (Gate 2): each criterion with its evidence, and a plain-English summary. For a document, the document is the result, and the user judges it by reading it. A pack that summarises it, or one that pastes all of it in, doesn't fit.

## Notes
- Came up after 0266, which has a document's wording checked by the reviewer reading it rather than by a test. The reviewer's evidence for such a criterion is a quoted passage, not the whole document.
- Related: `speck/ideas/2026-10-16-show-images-in-review-packs.md`, for showing what a visual change looks like in the pack.
- Open: how the user gets to the document: a link from the panel to the rendered document on its branch, the document opened in the panel, or a diff of what changed?
- Open: for a document, what does Gate 2 need beyond the document itself: the reviewer's verdict, the criteria checked by review, or nothing more?
- Open: does a document task keep a review pack at all, or something lighter in its place?

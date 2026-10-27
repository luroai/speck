# Show images in review packs

Captured: 2026-10-16 · Status: ticketed (0294)

## What
Review packs need images where applicable. For a ticket that changes what something looks like, the pack shows a picture of the result, so you can judge it before you ship. For example, for 0249 it would have been useful to see the README with the images in it.

## Why
A review pack is meant to let someone who doesn't read code decide whether to ship (Gate 2). For a visual change, criteria with ✅ and the reviewer's evidence don't show you what it looks like. Today you'd have to check out the branch or wait until it ships to see it.

## Notes
- Came up building 0249, which adds light and dark images to the README; 0249 and 0250 are high risk so they wait for a manual ship.
- Open: which tickets count as "applicable": any change to the README, docs, the panel or the landing page, or whichever ones the ticket or the builder says?
- Open: who takes the picture: the builder during the build (it can already render pages in a real browser, as the panel tests do), or speck when it writes the pack?
- Open: what it shows: the rendered page as it would look after shipping (for the README, as GitHub renders it), before and after, and light and dark where both exist?
- Open: where the images are kept (the repo, or `speck/.cache/` beside the pack) and how the panel's review pack and `speck pack <id>` show them.

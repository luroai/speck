# Skip images in the model-name check

Captured: 2026-10-14 · Status: inbox
Triaged: 1
From ticket: 0170

## What
The test that checks no model name is hard-coded in speck's scripts, templates and skills should skip binary files such as the panel's PNG icons, and only read text files.

## Why
It reads the PNG icons as text, and compressed image bytes often happen to contain a short pattern like "o6" that it takes for a model name. Any change to the icons can then fail the suite for no real reason, as it did in 0170 until a different stroke width was picked.

## Notes
- From the builder's own note in 0170: stroke widths 2.3 to 2.6 all produced PNGs the check flagged; 2.2 happened not to.

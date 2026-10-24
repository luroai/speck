# Measure the panel's layout in a proportional font

Captured: 2026-10-23 · Status: ticketed (0441)
From ticket: 0427

## What
The browser tests that measure how the panel's text wraps and how tall its cards are should see the panel in a proportional font, as people using it do, rather than a monospace.

## Why
On the machine that builds and ships speck, only the Liberation fonts are installed and Chrome takes `system-ui` to be Liberation Mono. Since 0427 the panel's text names `system-ui`, so the layout tests (0419, 0420) measure a monospaced panel nobody sees: they had to allow longer wrapping there, and they can't check the gaps round the dots in a details line.

## Notes
- From the builder's own note on 0427.
- Open question: give the tests' browser a font setup that maps `system-ui` to a sans font such as Liberation Sans or DejaVu Sans, or install one on the build machine? Either may change other browser tests calibrated on the monospace.

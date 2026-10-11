# speck's own build history

speck is built with speck. This folder is its working record: every idea, every ticket and every review round since 8 October 2026, exactly as the pipeline left them. Nothing here is installed when you use speck. In your own project, `speck init` creates an empty `speck/` folder of its own.

## What's here

- **`tickets/done/`:** finished tickets, `done` or `cancelled`. This is the history to read.
- **`tickets/`:** tickets still in progress, from `draft` to `approved`.
- **`ideas/`:** ideas waiting to be shaped, and the inbox: follow-ups that builds noticed and wrote down rather than fixing outside their ticket.
- **`ideas/done/`:** ideas that have become tickets.
- **`config.yml`:** how speck runs on itself. Here it ships each ticket as soon as the reviewer approves it.

## How to read a ticket

Open any file in `tickets/done/`, for example the one that set the principle of building one ticket at a time: [`0111`](tickets/done/0111-write-the-one-build-at-a-time-principle-into-the-b.md).

- **The top:** the problem, the outcome and the acceptance criteria. A person approved this before anything was built.
- **Notes:** decisions made along the way, and facts checked before building.
- **Review log:** one line per review round: what the independent reviewer found and its verdict.
- **Delivery log:** what it took: review rounds, the reviewer's tokens, elapsed time and changed lines, plus anything the builder wants you to know.
- **Review rounds:** each round in full, folded away. The reviewer's verdict on every acceptance criterion, with its evidence, and each finding and how it was resolved.

A cancelled ticket keeps its reason at the top. Those are the decisions not to build something, and they're worth reading too.

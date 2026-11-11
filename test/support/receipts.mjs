// 0629: fixtures that approve a ticket with `speck record` and then auto-ship it keep a receipt for its latest round,
// as `speck review` does for a round it runs the reviewer for, so they ship by themselves as before.
import { findTicket } from '../../scripts/core.mjs';
import { ticketsRounds } from '../../scripts/review.mjs';
import { keepReceipt } from '../../scripts/receipts.mjs';

export function keepLatestReceipt(dir, id = '0001') {
  const all = ticketsRounds(dir, findTicket(dir, id));
  keepReceipt(dir, id, all.at(-1));
}

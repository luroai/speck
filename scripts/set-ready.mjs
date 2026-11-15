// 0681: `speck set <id> <id>… status ready` sets several tickets ready with one command.
import { SpeckError } from './core.mjs';

export const SET_USAGE = 'Usage: speck set <id> <field> <value>, or speck set <id> <id>… status ready';

// Each ticket is set as `speck set <id> status ready` sets it on its own (`setOne` is speck set itself), so each gets
// its own commit, in the order given. One it refuses is left unchanged and named with the reason, and the rest are
// still set. No field is a number, so the ids are the numbers before the field.
export function setSeveralReady(args, setOne) {
  const at = args.findIndex(a => !/^\d+$/.test(a));
  if (at < 1 || args[at] !== 'status' || args.slice(at + 1).join(' ') !== 'ready') throw new SpeckError(SET_USAGE);
  const ids = args.slice(0, at), left = [];
  for (const id of ids) {
    try { setOne([id, 'status', 'ready']); }
    catch (e) {
      if (!(e instanceof SpeckError)) throw e;
      left.push(`- ${id}: ${e.message.split('\n').join('\n  ')}`);
    }
  }
  if (left.length) throw new SpeckError(`Left ${left.length} of ${ids.length} unchanged:\n${left.join('\n')}`);
}

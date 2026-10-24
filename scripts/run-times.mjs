// 0460: speck run's output, timed. Each message it writes starts with the local time as `HH:MM:SS `, as a build log's
// lines do (0422), so the pipeline log in the panel says when each thing happened. A message over several lines has
// the time on its first line only.
import { format } from 'node:util';

const two = n => String(n).padStart(2, '0');
export const clockOf = (d = new Date()) => `${two(d.getHours())}:${two(d.getMinutes())}:${two(d.getSeconds())}`;

// One message, with the time `now` gives on its first line.
export const timedMessage = (text, now = new Date()) => `${clockOf(now)} ${text}`;

// From now on, each console.log and console.error in this process writes its message timed, once only however often
// it's called. Only speck run's own process calls it, so a command run inside another process isn't timed. Returns a
// function that puts them back as they were.
let undo = null;
export function timeRunOutput(now = () => new Date()) {
  if (undo) return undo;
  const { log, error } = console;
  console.log = (...args) => log.call(console, timedMessage(format(...args), now()));
  console.error = (...args) => error.call(console, timedMessage(format(...args), now()));
  undo = () => { console.log = log; console.error = error; undo = null; };
  return undo;
}

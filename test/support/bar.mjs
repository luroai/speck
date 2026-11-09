// A board and the Foreman's status, for the tests of the bar at the top of the panel (0580).
import { T } from './panel.mjs';

export const foreman = (o = {}) => ({ word: 'Building 2', tone: 'ok', building: [], ready: [], held: [], ship: { running: null, waiting: [] }, blocked: [], took: [], ...o });
export const state = (f, o = {}) => ({ tickets: [T('0362', 'building'), T('0363', 'building')], ideas: [], run: { on: true, pid: 1 }, foreman: f, ...o });

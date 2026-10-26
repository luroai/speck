'use strict';
// 0432: the panel's Settings view, which the page loads from /panel-settings.js after its own script and before it starts.
// It opens, draws, changes and saves Settings, with its switches and the questions it asks, using the page's helpers, such as el and $.
// 0136: a look chosen switches the page and is remembered in this browser (the <head> script applies it on load). 0372:
// chosen in Settings, not the header. 0412: System, Light or Dark; System is kept as no choice, so it follows the computer.
const LOOKS = [['system', 'System'], ['light', 'Light'], ['dark', 'Dark']];
let lookPicked = null; // without the <head> script's pickLook
const systemLook = () => (typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
const lookNow = () => (typeof lookChoice === 'function' ? lookChoice() : lookPicked || 'system');
function chooseLook(look) {
  if (!LOOKS.some(([l]) => l === look)) return;
  try {
    if (look === 'system') localStorage.removeItem('speck-theme'); else localStorage.setItem('speck-theme', look);
  } catch { /* storage refused: the look still switches, until a reload */ }
  if (typeof pickLook === 'function') pickLook(look);
  else {
    lookPicked = look;
    const root = document.documentElement, shown = look === 'system' ? systemLook() : look;
    if (typeof setLook === 'function') setLook(shown); else if (root?.dataset) root.dataset.theme = shown;
  }
  drawLook();
}
// 0257: the Settings view. It shows the settings people tune, read afresh from speck/config.yml each time it opens.
// 0258: the ones the server marks editable can be changed in place. 0274: the view's one Save sends every change at
// once, and the server saves them all or none.
let settingAgentModels = new Map(); // 0369: each agent chosen since the view opened: { reading } | { models } | { why }
let settingsView = null, settingsSeq = 0; // null while it's closed, or { state: 'error' | 'ok', … }
let settingsOpening = false; // 0409: whether a press on Settings is waiting for the config, to open it
let settingTyped = new Map(), settingRefused = new Map(); // key → what was typed, and why the server refused it, until the view closes
let settingClear = new Set(); // 0261: keys whose machine value is cleared on Save
// 0399: "Your agents", after Auto-build, drawn in place in a box kept while the view is open, so a change to it moves
// nothing else in the view and keeps the keyboard focus. Each agent's { busy, typed } until the view closes: a provider's
// key is only ever sent, never read back, as the server says only whether this machine has it (0393).
let agentsBox = null, agentsAdding = false, agentsSaid = null; // the box; whether "Add an agent" is open; the last change's { text, bad }
let agentStates = new Map();
let providerForm = null; // 0401: the Add an API provider form's { name, address, type, key, models, busy } until the view closes
let settingsFailed = null; // 0274: why the last Save failed, when it wasn't one setting's fault
let settingsSaid = null; // 0311: what the last Save changed that you didn't, such as builder_model cleared
let settingsBar = null;
let settingRowsDrawn = new Map(); // 0370: key → its row, and its explanation's number, as drawn
let settingControls = new Map(); // 0276: key → its control, as drawn // 0274: the Save button, as drawn
// 0268: each setting's explanation sits behind an info button beside its name. It shows while the pointer is over the
// button or the button has focus, and a tap or click keeps it until the next tap or click on it. One shows at a time.
let settingTip = null, settingTipKept = false, settingHover = null, settingFocus = null; // keys, or null
let settingHoverWait = 0; // 0371: counts the pointer's moves onto and off info buttons, so a pause that's been cut short shows nothing
const SETTING_TIP_PAUSE = 500;
let settingTips = new Map(); // key → its explanation, in the view as it's drawn
let settingInfos = new Map(); // 0395: key → its info button, in the view as it's drawn
// 0275: closing the view with changes not saved asks first. null, or the question being asked, as { saving }.
let settingsLeaving = null;
$('settings-open').addEventListener('click', openSettings);
$('settings-backdrop').addEventListener('click', e => { if (e.target === $('settings-backdrop')) leaveSettings(); });
// 0368: the pop-up covers the backdrop, so a click on the pop-up itself, beside its column, is a click on the backdrop.
// One between two groups, inside the column, isn't, nor is a drag from the column, such as selecting text, ending beside it.
let settingsDownBeside = false;
$('settings').addEventListener('pointerdown', e => { settingsDownBeside = e.target === $('settings') && besideColumn(e); });
$('settings').addEventListener('click', e => { if (settingsDownBeside && e.target === $('settings') && besideColumn(e)) leaveSettings(); });
// Not on its scroll bar, which sits beside the column too: a click there scrolls. 0415: the Pipeline pop-up's too.
function besideColumn(e, pane = $('settings')) {
  const col = pane.children[0];
  if (!col || typeof col.getBoundingClientRect !== 'function' || typeof e.clientX !== 'number') return false;
  if (typeof pane.getBoundingClientRect === 'function' && typeof pane.clientWidth === 'number') {
    const p = pane.getBoundingClientRect(), inside = p.left + (pane.clientLeft || 0);
    if (e.clientX < inside || e.clientX >= inside + pane.clientWidth) return false; // its border or scroll bar
  }
  const r = col.getBoundingClientRect();
  return e.clientX < r.left || e.clientX >= r.right;
}
// 0395: the pointer going down anywhere but on the open explanation or its info button closes it, and the click still
// reaches what it lands on. Beside the column, it closes only the explanation, not Settings. On the way up, after the
// pop-up's own listener, so that one's "beside" is taken back. A press inside it, such as one selecting its text, keeps it.
document.addEventListener('pointerdown', e => {
  if (settingsView === null || settingTip === null) return;
  if (within(e.target, settingTips.get(settingTip)) || within(e.target, settingInfos.get(settingTip))) return;
  settingHoverWait++; // 0371: no pause left to show it again
  showSettingTip(null, false);
  settingsDownBeside = false;
});
renderSettings(); // closed
renderLeaving(); // not asking
// 0409: it opens once the config has come back, onto its groups and their values, with no loading line in their place.
function openSettings() {
  if (settingsView !== null || settingsOpening) return;
  settingsOpening = true;
  $('settings-open').setAttribute('aria-busy', 'true');
  loadSettings();
}
// 0407: the settings from the config first, at once, then the agents' lists, filled in where they show.
async function loadSettings() {
  const mine = ++settingsSeq;
  settingAgentModels = new Map();
  // The lists read last time, shown while they're read again after a Save.
  const had = settingsView !== null && settingsView.state === 'ok' && settingsView.catalogues === undefined ? settingsView : null;
  const opening = settingsOpening, next = await readSettings('/api/settings?quick=1');
  if (opening) { settingsOpening = false; $('settings-open').setAttribute('aria-busy', 'false'); }
  if (mine !== settingsSeq || (settingsView === null && !opening)) return; // closed, or opened again, since
  const quick = next.state === 'ok' && next.loading === true;
  if (quick && had !== null) for (const f of CATALOGUES) next[f] = had[f];
  if (quick && had !== null) keepChoices(next, had);
  if (quick && had === null) Object.assign(next, { catalogues: 'loading', agent_models: [] }); // a list for each role, saying it's loading
  settingsView = next;
  renderSettings();
  const pane = $('settings');
  if (opening && pane.focus) pane.focus({ preventScroll: true }); // so the keys scroll the pane, and none reach the page behind
  if (!quick) return;
  const asked = settingsView.your_agents, full = await readSettings('/api/settings');
  if (mine !== settingsSeq || settingsView === null) return;
  fillCatalogues(full, asked);
}
// What the server answers at `url`, as the view takes it: { state: 'ok', … } or { state: 'error', text }.
async function readSettings(url) {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    let body = null;
    try { body = await res.json(); } catch { /* no JSON: say what we know */ }
    return res.ok && body && Array.isArray(body.groups) ? { state: 'ok', groups: body.groups, reviewer_models: body.reviewer_models ?? null,
      claude_models: body.claude_models ?? null, builder_models: body.builder_models ?? null, foreman_models: body.foreman_models ?? null,
      providers: Array.isArray(body.providers) ? body.providers.filter(x => x && typeof x.name === 'string' && typeof x.label === 'string') : [], // 0393
      your_agents: body.your_agents !== null && typeof body.your_agents === 'object' ? body.your_agents : null, // 0399
      agent_models: Array.isArray(body.agent_models) ? body.agent_models : null, // 0400
      ...(body.loading === true ? { loading: true } : {}) } // 0407
      : { state: 'error', text: body && typeof body.error === 'string' && body.error ? body.error : `Couldn't read the settings (${res.status}).` };
  } catch { return { state: 'error', text: "Couldn't reach speck panel to read the settings. Close this and try again." }; }
}
// 0407: what the agents' checks and lists give the view, which the config alone doesn't.
const CATALOGUES = ['reviewer_models', 'builder_models', 'foreman_models', 'your_agents', 'agent_models'];
const AGENT_KEYS = ['builder', 'reviewer', 'watch_agent']; // 0487: watch_agent was foreman
// The choices of each role's agent, and why some are left out, from `from`'s rows into `into`'s.
function keepChoices(into, from) {
  const rows = v => v.groups.flatMap(g => Array.isArray(g.settings) ? g.settings : []);
  for (const key of AGENT_KEYS) {
    const to = rows(into).find(x => x.key === key), was = rows(from).find(x => x.key === key);
    if (!to || !was) continue;
    for (const f of ['choices', 'missing']) { if (Object.hasOwn(was, f)) to[f] = was[f]; else delete to[f]; }
  }
}
// 0407: the agents' lists, once read, drawn in place: each role's list and Your agents, keeping what's typed or picked,
// how far the view is scrolled and where the keyboard focus is. `full` is the whole answer, or why it couldn't be read.
// Your agents as an add or a removal since `asked` gave them is newer than the answer, so it stays.
function fillCatalogues(full, asked) {
  const view = settingsView, before = yourModels() !== null;
  if (full.state === 'ok') {
    for (const f of CATALOGUES) if (f !== 'your_agents' || view.your_agents === asked) view[f] = full[f];
    keepChoices(view, full);
    delete view.catalogues;
  } else view.catalogues = { why: full.text };
  if ((yourModels() !== null) !== before) { // each role's lists are laid out another way: the view drawn again, as far down
    const pane = $('settings'), top = pane.scrollTop;
    renderSettings();
    pane.scrollTop = top;
    return;
  }
  for (const key of [...AGENT_KEYS, ...Object.keys(ROLE_PAIRS), ...Object.keys(SETTING_PAIRS)]) redrawSettings([key], key);
  drawAgents();
}
// 0407: whether the agents' lists are still being read, and why they couldn't be, or null.
const cataloguesLoading = () => settingsView !== null && settingsView.catalogues === 'loading';
const cataloguesWhy = () => settingsView !== null && settingsView.catalogues !== null && typeof settingsView.catalogues === 'object' ? settingsView.catalogues.why : null;
// 0275: Close, Escape and a click outside the view: at once with nothing to save, otherwise after asking.
function leaveSettings() {
  if (settingsLeaving !== null) return;
  if (settingsView === null || settingsView.state !== 'ok' || !settingChanges().length) { closeSettings(); return; }
  settingsLeaving = { saving: false };
  renderLeaving();
}
function renderLeaving() {
  const box = $('settings-unsaved'), asking = settingsLeaving !== null;
  box.hidden = !asking;
  $('settings').inert = asking; // Tab stays in the question
  if (!asking) { box.replaceChildren(); return; }
  const choice = (label, cls, fn) => { const b = el('button', cls, label); b.type = 'button'; b.addEventListener('click', fn); return b; };
  const keep = choice('Keep editing', null, keepEditing);
  const title = el('h3', null, 'Unsaved changes');
  title.id = 'settings-unsaved-title';
  box.replaceChildren(el('div', 'box', null, title,
    el('p', null, 'You have unsaved changes in Settings. Save them before closing, or discard them?'),
    el('div', 'choices', null, choice(settingsLeaving.saving ? 'Saving…' : 'Save', 'save-all', saveAndLeave), choice('Discard', null, closeSettings), keep)));
  box.setAttribute('role', 'alertdialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-labelledby', title.id);
  if (keep.focus) keep.focus();
}
function keepEditing() {
  settingsLeaving = null;
  renderLeaving();
  const pane = $('settings');
  if (pane.focus) pane.focus({ preventScroll: true });
}
// Saves as the view's Save does, then closes once saved. Refused, or waiting on 0259's confirmation, the question goes
// so the view shows why, as it would after its own Save.
async function saveAndLeave() {
  const asked = settingsLeaving;
  if (asked === null || asked.saving) return;
  asked.saving = true;
  renderLeaving();
  const saved = await saveSettings();
  if (settingsLeaving !== asked) return; // kept editing, or closed, since
  if (saved && !settingChanges().length) closeSettings(); // nothing changed since it was sent
  else keepEditing();
}
function closeSettings() {
  settingsView = null;
  settingsSeq++;
  settingAgentModels = new Map();
  settingsLeaving = null;
  renderLeaving();
  settingTip = settingHover = settingFocus = null;
  settingTipKept = false;
  settingTyped = new Map();
  settingRefused = new Map();
  settingClear = new Set();
  agentsBox = agentsSaid = null;
  agentsAdding = false;
  agentStates = new Map();
  providerForm = null;
  settingsFailed = settingsSaid = null;
  renderSettings();
  const back = $('settings-open');
  if (back.focus) back.focus();
}
const settingValue = v => Array.isArray(v) ? `[${v.join(', ')}]` : v === '' ? '""' : v !== null && typeof v === 'object' ? JSON.stringify(v) : String(v);
function renderSettings() {
  const pane = $('settings'), open = settingsView !== null;
  pane.hidden = !open;
  $('settings-backdrop').hidden = !open;
  holdPage(pageHeld());
  holdPane();
  settingTips = new Map();
  settingInfos = new Map();
  settingControls = new Map();
  settingRowsDrawn = new Map();
  settingsBar = null;
  // Drawn afresh, its buttons are new, so no pointer is over one and none has focus: only a kept explanation stays.
  settingHover = settingFocus = null;
  if (!settingTipKept) settingTip = null;
  if (!open) { pane.replaceChildren(); return; }
  const close = el('button', 'close', 'Close');
  close.type = 'button';
  close.addEventListener('click', leaveSettings);
  const kids = [el('div', 'top', null, el('h3', null, 'Settings'), close)];
  let foremanRows = []; // 0286: the server's Foreman settings, shown in the Foreman group
  if (settingsView.state === 'error') kids.push(el('p', 'bad', settingsView.text));
  else {
    for (const g of settingsView.groups) {
      const rows = [];
      for (const x of Array.isArray(g.settings) ? g.settings : []) if (!roleModelKey(x.key)) rows.push(settingRow(x, settingTips.size));
      pairSettings(rows); // 0381
      if (g.title === 'Watching') { foremanRows = rows; continue; } // 0486: the server's title, was Foreman
      // 0273: a box like the panel's sections, with a heading bar
      kids.push(el('section', 'sgroup', null, el('div', 'sh', null, el('h4', null, g.title)), ...rows));
    }
  }
  if (settingsView.state === 'ok' && settingRows().some(x => x.editable === true)) kids.push(saveBar()); // none to change: nothing to save
  // 0396: Appearance and Auto-build first, then 0399's Your agents and the Foreman (0285) once the settings have loaded
  kids.splice(1, 0, toggleGroup(), ...(settingsView.state === 'ok' ? [agentsGroup(), foremanGroup(foremanRows)] : []));
  pane.replaceChildren(...kids);
  refreshSettings();
  showSettingTip(settingTips.has(settingTip) ? settingTip : null, settingTipKept);
}
// 0372: kept in this browser rather than speck/config.yml, so it switches the page as it's pressed and Save neither
// sends it nor counts it as a change. 0412: System, Light and Dark, as radio buttons in one group: Tab reaches the one
// chosen, and the arrow keys, Home and End choose another, kept between redraws so it keeps focus.
const lookButtons = LOOKS.map(([look, word]) => {
  const b = el('button', null, word);
  b.type = 'button';
  b.id = `look-${look}`;
  b.setAttribute('role', 'radio');
  b.addEventListener('click', () => chooseLook(look));
  return b;
});
const lookGroup = el('div', 'looks', null, ...lookButtons);
lookGroup.id = 'look';
lookGroup.setAttribute('role', 'radiogroup');
lookGroup.setAttribute('aria-label', 'Appearance');
lookGroup.addEventListener('keydown', e => {
  const at = LOOKS.findIndex(([l]) => l === lookNow()), last = LOOKS.length - 1;
  const to = { ArrowRight: at + 1, ArrowDown: at + 1, ArrowLeft: at - 1, ArrowUp: at - 1, Home: 0, End: last }[e.key];
  if (to === undefined) return;
  e.preventDefault?.();
  const i = (to + LOOKS.length) % LOOKS.length;
  chooseLook(LOOKS[i][0]);
  lookButtons[i].focus?.();
});
function drawLook() {
  const chosen = lookNow();
  LOOKS.forEach(([look], i) => {
    lookButtons[i].setAttribute('aria-checked', String(look === chosen));
    lookButtons[i].tabIndex = look === chosen ? 0 : -1;
  });
}
// 0396: Appearance, then Auto-build, each a row of its name and its switch, above the other groups.
function toggleGroup() {
  drawLook();
  drawRunSwitch();
  // An info button, as every setting has, so the rows line up with the others (0277).
  const [lookInfo, lookTip] = settingInfo({ key: 'Appearance', explain: 'System follows your computer\'s setting; Light and Dark stay as they are. It\'s kept in this browser, not in speck/config.yml.' }, settingTips.size);
  const [runInfo, runTip] = settingInfo({ key: 'Auto-build', explain: 'On: speck run builds each ready ticket and ships each approved one auto_ship covers. Off: ready tickets wait.' }, settingTips.size);
  const row = (name, info, sw, ...after) => el('div', 'switch-row', null,
    el('div', 'row', null, el('span', 'label', null, el('span', 'name', name), info), el('div', 'control', null, sw)), ...after);
  return el('section', 'switches', null, row('Appearance', lookInfo, lookGroup, lookTip), row('Auto-build', runInfo, runSwitchButton, runSwitchSaid, runTip));
}
// 0381: each agent's model, drawn in the agent's row: key → the agent's key.
const SETTING_PAIRS = { builder_model: 'builder', reviewer_model: 'reviewer', watch_model: 'watch_agent' };
// 0400: with one list for each role, its effort is drawn beside it instead, and its model has no row.
const ROLE_PAIRS = { builder_effort: 'builder', reviewer_effort: 'reviewer', watch_effort: 'watch_agent' }; // 0402: and the builder's
const settingPairs = () => yourModels() !== null ? ROLE_PAIRS : SETTING_PAIRS;
// The agent whose row `key`'s model is drawn in, when the server put both in one group; otherwise null.
function pairedWith(key) {
  const pairs = settingPairs(), agent = Object.hasOwn(pairs, key) ? pairs[key] : null;
  if (agent === null || settingsView === null || !Array.isArray(settingsView.groups)) return null;
  const keys = g => (Array.isArray(g.settings) ? g.settings : []).map(x => x.key);
  return settingsView.groups.some(g => keys(g).includes(key) && keys(g).includes(agent)) ? agent : null;
}
// Each model's row among a group's `rows`, as drawn, moved into its agent's row, beside the agent's control.
function pairSettings(rows) {
  for (const [key, agent] of Object.entries(settingPairs())) {
    const model = settingRowsDrawn.get(key), host = settingRowsDrawn.get(agent);
    if (!model || !host || !rows.includes(model.row) || !rows.includes(host.row) || pairedWith(key) === null) continue;
    rows.splice(rows.indexOf(model.row), 1);
    host.control.appendChild(model.row);
  }
}
// A setting's row, whose explanation is the view's `n`th. 0381: an agent's model's is drawn to sit in the agent's row.
function settingRow(x, n) {
  const role = yourModels() !== null && Object.hasOwn(ROLES, x.key) ? x.key : null; // 0400: a role's one list
  const edit = x.editable === true ? (role !== null ? roleEditor(x) : settingEditor(x)) : null;
  // 0405: a role's effort, drawn in its row, is explained with the role, under the role's one info button.
  const effortKey = role !== null ? Object.keys(ROLE_PAIRS).find(k => ROLE_PAIRS[k] === role) : undefined;
  const effort = effortKey !== undefined && pairedWith(effortKey) !== null && takesEffort(role) ? settingRows().find(r => r.key === effortKey) : undefined;
  const nested = yourModels() !== null && Object.hasOwn(ROLE_PAIRS, x.key) && pairedWith(x.key) !== null;
  // 0397: where a change is saved, and this machine's own value with its button, are said in the explanation, not marked.
  const [info, tip] = nested ? [null, null] : effort === undefined ? settingInfo(x, n, ownLine(x))
    : settingInfo({ key: x.key, explain: sharedEnd(String(x.explain ?? ''), String(effort.explain ?? '')) }, n, [ownLine(x), ownLine(effort, x.key)], typeof effort.explain === 'string' && effort.explain ? effort.explain : null);
  const shown = edit ? edit : [el('code', 'value', settingValue(x.value))];
  const model = pairedWith(x.key) !== null, control = model ? null : el('div', 'control', null, ...shown);
  const row = el('div', model ? 'setting model' : 'setting', null,
    model ? el('span', 'pick', null, settingName(x.key), el('span', 'list', null, ...shown, info))
      : el('div', 'row', null, el('span', 'label', null, settingName(x.key), info), control),
    role === null && ['reviewer', 'builder', 'watch_agent'].includes(x.key) && typeof x.missing === 'string' && x.missing ? el('p', null, x.missing) : null, // 0288, 0293, 0393
    role !== null ? notYoursLine(role) : null, role !== null ? unlistedLine(role) : null, role !== null ? needsClaudeLine() : null, // 0400
    role !== null && cataloguesWhy() !== null ? el('p', 'bad', `Couldn't read your agents' models. ${cataloguesWhy()}`) : null, // 0407
    x.key === 'builder' ? builderSwitchLine(x) : null,
    x.key === 'reviewer_model' && modelsWhy() !== null ? el('p', null, modelsWhy()) : null,
    x.key === 'builder_model' && builderModelsWhy() !== null ? el('p', null, builderModelsWhy()) : null,
    x.key === 'watch_model' && foremanModelsWhy() !== null ? el('p', null, foremanModelsWhy()) : null, // 0348
    settingRefused.has(x.key) ? el('p', 'bad', settingRefused.get(x.key)) : null,
    // 0400: a refusal of the role's model, whose list is the role's own
    role !== null && settingRefused.has(ROLES[role].model) && settingRefused.get(ROLES[role].model) !== settingRefused.get(x.key) ? el('p', 'bad', settingRefused.get(ROLES[role].model)) : null,
    tip);
  if (yourModels() !== null && Object.hasOwn(ROLE_PAIRS, x.key) && !takesEffort(ROLE_PAIRS[x.key])) row.hidden = true; // 0400
  settingRowsDrawn.set(x.key, { row, n, control });
  return row;
}
// 0397: this machine's own value of `x`, with its button, or that it's cleared on Save, for its explanation; null when
// it has none. 0405: `tip`, the explanation it's in, kept open by its button.
function ownLine(x, tip = x.key) {
  // 0400: a role's list holds its model too, so it's this machine's own when either is.
  const own = withRoleModel(x.key).filter(k => settingRows().some(r => r.key === k && r.for_machine === true && r.from === 'machine'));
  const cleared = own.length > 0 && own.every(k => settingClear.has(k));
  return own.length === 0 ? null : cleared ? clearLine(x, tip) : machineLine(x, tip);
}
// 0405: `a` without the sentences it ends with that `b` ends with too, such as where a change is saved, so the two read
// as one explanation that says them once.
function sharedEnd(a, b) {
  for (let i = a.indexOf('. '); i !== -1; i = a.indexOf('. ', i + 1)) if (b.endsWith(` ${a.slice(i + 2)}`)) return a.slice(0, i + 1);
  return a;
}
// 0370: the rows of `keys` drawn again in their places, leaving the rest of the view, and how far it's scrolled, as it
// was. `kept`, the setting just changed, keeps its name and control, never taken out, so it keeps the focus: only the
// lines under them are drawn again.
function redrawSettings(keys, kept = null) {
  for (const key of keys) {
    const drawn = settingRowsDrawn.get(key), x = settingRows().find(r => r.key === key);
    if (!drawn || !x || !drawn.row.parentNode) continue;
    const had = settingControls.get(key), hadInfo = settingInfos.get(key);
    const row = settingRow(x, drawn.n), made = settingControls.get(key);
    if (key === kept && had && made && made.tagName === had.tagName) {
      if (hadInfo) settingInfos.set(key, hadInfo); // 0395: its name, and its info button with it, stay as they were
      drawn.row.hidden = row.hidden; // 0407: an effort, shown only for an agent that takes one
      for (const c of [...drawn.row.children].slice(1)) drawn.row.removeChild(c);
      for (const c of [...row.children].slice(1)) drawn.row.appendChild(c);
      if (String(had.tagName).toLowerCase() === 'select') { // what it offers can change with what's picked
        const picked = made.value; // read before its options go
        had.replaceChildren(...made.children);
        had.value = picked;
      }
      settingControls.set(key, had);
      settingRowsDrawn.set(key, drawn);
      continue;
    }
    if (settingHover === key) settingHover = null; // its info button is a new one
    if (settingFocus === key) settingFocus = null;
    for (const [m, agent] of Object.entries(settingPairs())) { // 0381: an agent's row keeps its model's
      const model = settingRowsDrawn.get(m);
      if (agent === key && model && drawn.control && model.row.parentNode === drawn.control) settingRowsDrawn.get(key).control.appendChild(model.row);
    }
    drawn.row.parentNode.insertBefore(row, drawn.row);
    drawn.row.parentNode.removeChild(drawn.row);
  }
  refreshSettings();
  showSettingTip(settingTips.has(settingTip) ? settingTip : null, settingTipKept);
}
// 0370: the settings whose rows show what a change to `key` alters: its own lines, and the lists of models and efforts
// it decides.
const SETTING_AFFECTS = { reviewer: ['reviewer', 'reviewer_model', 'reviewer_effort'], builder: ['builder', 'builder_model', 'watch_model'],
  watch_agent: ['watch_agent', 'watch_model'], reviewer_model: ['reviewer_model', 'reviewer_effort'] };
// 0273: a setting's name, which a narrow row breaks after a dot or an underscore ("max_parallel_" then "builds"),
// rather than in the middle of a word.
function settingName(key) {
  const parts = String(key).match(/[^._]+[._]?|[._]/g) || [];
  return el('code', 'name', null, ...parts.flatMap((part, i) => [i > 0 ? el('wbr') : null, el('span', null, part)]));
}
// 0268: a setting's info button and its explanation, which a screen reader reads with the button. 0397: `line`, this
// machine's own value and its button, goes at the end of it, and the pointer or the focus can move into it from the
// button without it closing.
function settingInfo(x, n, lines = null, also = null) {
  const key = x.key, more = (Array.isArray(lines) ? lines : [lines]).filter(l => l !== null);
  const line = more.length > 0 ? more : null;
  const tip = el('p', 'explain', null, el('span', null, x.explain), also !== null ? el('span', null, ` ${also}`) : null, ...more);
  const inTip = node => line !== null && node != null && typeof tip.contains === 'function' && tip.contains(node);
  const hide = () => { if (settingTip === key && !settingTipKept && settingFocus !== key && settingHover !== key) showSettingTip(null, false); };
  tip.id = `setting-explain-${n}`;
  const info = el('button', 'info');
  info.type = 'button';
  info.setAttribute('aria-label', `About ${key}`);
  info.setAttribute('aria-describedby', tip.id);
  // 0371: shown once the pointer has rested on the button for SETTING_TIP_PAUSE ms, not as soon as it's over it.
  info.addEventListener('mouseenter', () => {
    if (!canHover()) return;
    settingHover = key;
    const wait = ++settingHoverWait;
    if (settingTip !== key) setTimeout(() => { if (wait === settingHoverWait && settingHover === key && settingTip !== key) showSettingTip(key, false); }, SETTING_TIP_PAUSE);
  });
  // 0397: with a button in it, the pointer has a moment to cross to it before it closes.
  const leave = e => {
    settingHoverWait++;
    if (inTip(e?.relatedTarget)) return;
    if (settingHover === key) settingHover = null;
    if (line === null) hide(); else setTimeout(hide, SETTING_TIP_PAUSE);
  };
  info.addEventListener('mouseleave', leave);
  info.addEventListener('focus', () => { settingFocus = key; settingHoverWait++; if (settingTip !== key) showSettingTip(key, false); });
  const blur = e => { if (inTip(e?.relatedTarget) || e?.relatedTarget === info) return; if (settingFocus === key) settingFocus = null; hide(); };
  info.addEventListener('blur', blur);
  if (line !== null) {
    tip.addEventListener('mouseenter', () => { settingHover = key; });
    tip.addEventListener('mouseleave', e => { if (e?.relatedTarget !== info) leave(e); });
    tip.addEventListener('focusin', () => { settingFocus = key; });
    tip.addEventListener('focusout', blur);
  }
  // 0371: a click or focus settles it, so a pause still running from the pointer shows nothing when it ends.
  info.addEventListener('click', () => { settingHoverWait++; if (settingTip === key && settingTipKept) showSettingTip(null, false); else showSettingTip(key, true); });
  settingTips.set(key, tip);
  settingInfos.set(key, info);
  return [info, tip];
}
function showSettingTip(key, kept) {
  settingTip = key;
  settingTipKept = key !== null && kept;
  for (const [k, tip] of settingTips) tip.hidden = k !== key;
  if (key !== null) placeSettingTip(settingTips.get(key));
}
// 0371: an explanation goes above its row, or below it when the top of the view would cut it off there. 0379: the top
// of the view is the bottom of its held top line, which would hide it.
function placeSettingTip(tip) {
  const pane = $('settings');
  if (!tip || typeof tip.getBoundingClientRect !== 'function' || !pane || typeof pane.getBoundingClientRect !== 'function') return;
  tip.classList.remove('below');
  const line = [...pane.children].find(n => n.className === 'top' && typeof n.getBoundingClientRect === 'function');
  const edge = Math.max(pane.getBoundingClientRect().top, line ? line.getBoundingClientRect().bottom : -Infinity);
  if (tip.getBoundingClientRect().top < edge) tip.classList.add('below');
}
// 0258: a setting's control, a list of the server's choices or a box to type in. 0274: what's typed or picked is kept,
// and Save sends it with the rest. 0259: auto_ship_risk's is a box to tick for each risk.
function settingEditor(x) {
  const typed = settingTyped.has(x.key) ? settingTyped.get(x.key) : settingNow(x);
  const typing = value => {
    settingTyped.set(x.key, value);
    // 0276: the reviewer and its model decide what the model and effort lists offer, so those are drawn again. 0370: only
    // those, keeping this control.
    if (x.key === 'reviewer' || x.key === 'builder' || x.key === 'watch_agent' || (x.key === 'reviewer_model' && reviewerModelList() !== null)) { // 0348: and foreman
      redrawSettings(SETTING_AFFECTS[x.key], x.key);
    } else refreshSettings();
  };
  if (settingClear.has(x.key)) { // 0261: this machine's value goes on Save, leaving the repo's
    const shown = el('input', 'edit');
    shown.type = 'text';
    shown.value = String(x.repo_value ?? '');
    shown.disabled = true;
    shown.setAttribute('aria-label', x.key);
    return [shown];
  }
  if (x.key === 'auto_ship_risk' && Array.isArray(x.choices)) {
    const boxes = x.choices.map(String).map(c => {
      const box = el('input', 'edit');
      box.type = 'checkbox';
      box.value = c;
      box.checked = typed.split(',').includes(c);
      box.setAttribute('aria-label', `${x.key} ${c}`);
      // What's ticked, as the server reads it: "low,high".
      box.addEventListener('change', () => typing(boxes.filter(b => b.checked).map(b => b.value).join(',')));
      return box;
    });
    return boxes.map(b => el('label', 'risk', null, b, el('span', null, b.value)));
  }
  let input;
  const choices = settingChoices(x);
  if (choices !== null) {
    input = el('select', 'edit');
    // A value the file has, or one picked before the list changed, that isn't a choice is shown, marked as not
    // offered, but can't be picked again.
    const off = [...new Set([settingNow(x), typed])].filter(c => !choices.includes(c));
    for (const c of [...off, ...choices]) {
      const list = x.key === 'reviewer_model' ? reviewerModelList() : x.key === 'builder_model' ? builderModelList() : x.key === 'watch_model' ? foremanModelList() : null;
      const m = off.includes(c) ? null : (list || []).find(x => x.slug === c); // 0288: with its display name and description
      const named = m && m.display_name && m.display_name !== c ? ` (${m.display_name})` : '';
      // 0393: a model provider is offered by its own name, such as DeepSeek.
      const agent = ['builder', 'reviewer', 'watch_agent'].includes(x.key) && settingProvider(c) !== null ? settingProvider(c).label : c;
      const o = el('option', null, c === '' ? '(default)' : off.includes(c) ? `${agent} (not offered)` : `${agent}${named}${m && m.description ? `: ${m.description}` : ''}`);
      o.value = c;
      if (off.includes(c)) o.disabled = true;
      input.appendChild(o);
    }
  } else {
    input = el('input', 'edit');
    input.type = typeof x.value === 'number' ? 'number' : 'text';
    if (input.type === 'number') input.min = '1';
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { typing(String(input.value ?? '')); saveSettings(); } });
  }
  input.value = typed;
  input.setAttribute('aria-label', x.key);
  settingControls.set(x.key, input);
  input.addEventListener('input', () => typing(String(input.value ?? '')));
  input.addEventListener('change', () => typing(String(input.value ?? '')));
  return [input];
}
// 0276: what a setting's list offers: the server's choices, or with the reviewer's models, read when the view opened,
// those models for reviewer_model, and for reviewer_effort the efforts the chosen model supports (any model's for the
// default). null: a box to type in.
function settingChoices(x) {
  if (x.key === 'builder_model') { // 0279: the builder's models, or a box to type in
    const built = builderModelList();
    return built !== null ? ['', ...built.map(m => m.slug)] : null;
  }
  if (x.key === 'watch_model') { // 0348: the Foreman agent's models, or a box to type in
    const listed = foremanModelList();
    return listed !== null ? ['', ...listed.map(m => m.slug)] : null;
  }
  const models = x.key === 'reviewer_model' || x.key === 'reviewer_effort' ? reviewerModelList() : x.key === 'builder_effort' ? builderEffortModels() : null;
  if (models !== null && x.key === 'reviewer_model') return ['', ...models.map(m => m.slug)];
  if (models !== null) {
    const model = models.find(m => m.slug === settingChosen(x.key === 'builder_effort' ? 'builder_model' : 'reviewer_model'));
    const listed = (model ? [model] : models).filter(m => m.efforts !== null); // 0278: none for Claude's: speck's own
    if (listed.length) return ['', ...new Set(listed.flatMap(m => m.efforts))];
  }
  return Array.isArray(x.choices) ? x.choices.map(String) : null;
}
// 0402: the models of the builder's agent, as your agents list them, each with the efforts it lists (null for none),
// for builder_effort to offer those of the model chosen; null without your agents' models, or for an agent not yours.
function builderEffortModels() {
  const a = yourModels() !== null ? yourAgent(settingChosen('builder')) : null;
  return a === null ? null : agentModelsOf(a).map(x => ({ slug: x.slug, efforts: Array.isArray(x.efforts) ? x.efforts.filter(e => typeof e === 'string') : null }));
}
// A setting's value as picked or typed in the view, or as the view read it.
function settingChosen(key) {
  if (settingTyped.has(key)) return settingTyped.get(key);
  const x = settingRows().find(r => r.key === key);
  return x ? settingNow(x) : '';
}
// 0276: the models the server read, while the reviewer chosen in the view is the one it read them for; otherwise null.
// 0278: Claude's model names whenever claude-subagent (or 0292's claude) is chosen, each with no `efforts` (null).
// 0347: Cursor's have no `efforts` either: their names carry the effort, so reviewer_effort offers speck's own.
// 0369: or those of codex or cursor chosen but not yet saved, read when it's chosen.
function reviewerModelList() {
  if (yourModels() !== null) { // 0400: the models of the reviewer's agent, as your agents list them
    const a = yourAgent(settingChosen('reviewer'));
    return a === null ? null : agentModelsOf(a).map(x => ({ slug: x.slug, efforts: Array.isArray(x.efforts) ? x.efforts.filter(e => typeof e === 'string') : null, ...modelWords(x) }));
  }
  const m = settingsView !== null ? settingsView.reviewer_models : null, chosen = settingChosen('reviewer'), claude = ['claude', 'claude-subagent'].includes(chosen);
  const provider = settingProvider(chosen); // 0393: a model provider's, from speck's list
  const read = claude || provider ? null : modelsRead(m, 'reviewer', chosen);
  const list = provider ? providerModelList(provider) : claude && settingsView !== null && Array.isArray(settingsView.claude_models) ? settingsView.claude_models
    : read && Array.isArray(read.models) ? read.models : null;
  if (list === null) return null;
  return list.filter(x => x && typeof x.slug === 'string').map(x => ({ slug: x.slug,
    efforts: Array.isArray(x.efforts) ? x.efforts.filter(e => typeof e === 'string') : claude || provider || chosen === 'cursor' ? null : [], ...modelWords(x) }));
}
// 0393: the model provider called `name` exactly, as the server listed it, or null.
function settingProvider(name) {
  const list = settingsView !== null && Array.isArray(settingsView.providers) ? settingsView.providers : [];
  return list.find(p => p.name === name) ?? null;
}
const providerModelList = p => Array.isArray(p.models) ? p.models : [];
// 0369: the models `agent` offers for the setting `of` (reviewer, builder or foreman), whose models the server read as
// `m`: those when it read them for `agent`, otherwise, for codex or cursor, the ones read since it was chosen, asking
// for them the first time. { models } or { why }, { reading: true } while they're read, or null: none to read. With no
// `m`, the server said nothing of models, so none are read.
function modelsRead(m, of, agent) {
  if (!m || typeof m !== 'object' || settingsView === null || settingsView.state !== 'ok') return null;
  // The server reads the builder's models for the saved builder, so they're its models while it's chosen.
  const readFor = of === 'builder' && agent === settingSaved('builder') ? agent : typeof m[of] === 'string' ? m[of] : null;
  if (readFor === agent && (Array.isArray(m.models) || (typeof m.why === 'string' && m.why))) return m;
  if (agent !== 'codex' && agent !== 'cursor') return null;
  if (!settingAgentModels.has(agent)) askAgentModels(agent);
  return settingAgentModels.get(agent);
}
function settingSaved(key) {
  const x = settingRows().find(r => r.key === key);
  return x ? settingNow(x) : '';
}
async function askAgentModels(agent) {
  const mine = settingsSeq;
  settingAgentModels.set(agent, { reading: true });
  let got;
  try {
    const res = await fetch(`/api/agent-models?agent=${encodeURIComponent(agent)}`, { cache: 'no-store' });
    let body = null;
    try { body = await res.json(); } catch { /* no JSON: say what we know */ }
    got = res.ok && body && Array.isArray(body.models) ? { models: body.models }
      : { why: body && typeof body.why === 'string' && body.why ? body.why : `Couldn't read ${agent}'s models (${res.status}), so type the model's name.` };
  } catch { got = { why: `Couldn't reach speck panel to read ${agent}'s models, so type the model's name.` }; }
  if (mine !== settingsSeq || settingsView === null) return; // closed, or opened again, since
  settingAgentModels.set(agent, got);
  const had = [...settingControls].find(([, c]) => c === document.activeElement);
  // 0370: only the settings that show the models just read.
  const shows = (of, chosen) => chosen === agent && modelsRead(settingsView[`${of}_models`], of, chosen) === got;
  redrawSettings([...(shows('builder', settingChosen('builder')) ? ['builder_model'] : []),
    ...(shows('reviewer', settingChosen('reviewer')) ? ['reviewer_model', 'reviewer_effort'] : []), ...(shows('foreman', foremanAgentChosen()) ? ['watch_model'] : [])]);
  const again = had ? settingControls.get(had[0]) : null;
  if (again && again.focus && again !== document.activeElement) again.focus();
}
// 0369: one line saying `agent`'s models are being read, or why they can't be, from modelsRead; null otherwise.
const readingWhy = (read, agent) => read && read.reading ? `Reading ${agent}'s models…` : read && typeof read.why === 'string' && read.why ? read.why : null;
// 0279: the models the server read for the builder, each with its words when it has them; null when it couldn't list
// them. 0369: for a builder chosen but not yet saved, Claude's model names for claude, or those read for codex or cursor.
function builderModelList() {
  const m = settingsView !== null ? settingsView.builder_models : null, chosen = settingChosen('builder');
  if (settingProvider(chosen) !== null) return providerModelList(settingProvider(chosen)).filter(x => x && typeof x.slug === 'string').map(x => ({ slug: x.slug, ...modelWords(x) })); // 0393
  const read = modelsRead(m, 'builder', chosen);
  const list = read && Array.isArray(read.models) ? read.models
    : read === null && m && typeof m === 'object' && chosen === 'claude' && Array.isArray(settingsView.claude_models) ? settingsView.claude_models : null;
  return list === null ? null : list.filter(x => x && typeof x.slug === 'string').map(x => ({ slug: x.slug, ...modelWords(x) }));
}
// 0348: the agent the Foreman runs on as chosen in the view, as foremanAgentOf in foreman-agent.mjs reads it: watch_agent
// when it's set, otherwise the builder when that's Codex or Cursor, otherwise Claude Code. 0393: or a model provider.
function foremanAgentChosen() {
  const foreman = settingChosen('watch_agent'), builder = settingChosen('builder');
  return ['claude', 'codex', 'cursor'].includes(foreman) || settingProvider(foreman) !== null ? foreman
    : ['codex', 'cursor'].includes(builder) || settingProvider(builder) !== null ? builder : 'claude';
}
// 0348: the models of that agent: Claude's model names for claude, otherwise the ones the server read, while it read
// them for that agent; null when there are none to offer.
function foremanModelList() {
  const m = settingsView !== null ? settingsView.foreman_models : null, agent = foremanAgentChosen(), provider = settingProvider(agent);
  const read = agent === 'claude' || provider ? null : modelsRead(m, 'foreman', agent); // 0369: or those read since it was chosen
  const list = provider ? providerModelList(provider) : agent === 'claude' && settingsView !== null && Array.isArray(settingsView.claude_models) ? settingsView.claude_models
    : read && Array.isArray(read.models) ? read.models : null;
  return list === null ? null : list.filter(x => x && typeof x.slug === 'string').map(x => ({ slug: x.slug, ...modelWords(x) }));
}
// 0348: why watch_model is a box to type in rather than a list, in one line, or null when it's a list or the server
// didn't say.
function foremanModelsWhy() {
  const m = settingsView !== null ? settingsView.foreman_models : null;
  if (!m || typeof m !== 'object' || foremanModelList() !== null) return null;
  const agent = foremanAgentChosen();
  const why = typeof m.why === 'string' && m.why ? m.why : null;
  if (agent === m.foreman) return why;
  return readingWhy(modelsRead(m, 'foreman', agent), agent) ?? why; // 0369: read when it's chosen; why: the server couldn't tell
}
// 0288: a model's display name and description, each null when the agent gives none.
const modelWords = x => ({ display_name: typeof x.display_name === 'string' && x.display_name ? x.display_name : null,
  description: typeof x.description === 'string' && x.description ? x.description : null });
// 0279: why builder_model is a box to type in rather than a list, in one line, or null.
function builderModelsWhy() {
  const m = settingsView !== null ? settingsView.builder_models : null, chosen = settingChosen('builder');
  if (!m || typeof m !== 'object' || builderModelList() !== null) return null;
  const read = modelsRead(m, 'builder', chosen);
  return read !== null ? readingWhy(read, chosen) : `${chosen || 'This builder'} can't list its models, so type the model's name as it names it.`;
}
// Why reviewer_model is a box to type in rather than a list, in one line, or null when it's a list or the server
// didn't say.
function modelsWhy() {
  const m = settingsView !== null ? settingsView.reviewer_models : null;
  if (!m || typeof m !== 'object' || reviewerModelList() !== null) return null;
  const chosen = settingChosen('reviewer');
  if (chosen === m.reviewer) return typeof m.why === 'string' && m.why ? m.why : null;
  return chosen === 'codex' || chosen === 'cursor' ? readingWhy(modelsRead(m, 'reviewer', chosen), chosen) // 0369: read when it's chosen
    : `${chosen} can't list its models, so type the model's name as it names it.`;
}
// 0293: what switching the builder does, said while a new one is picked, and the build_command it sets.
const BUILDER_NAMES = { claude: 'Claude Code', codex: 'Codex', cursor: 'Cursor' };
const builderName = b => BUILDER_NAMES[b] || settingProvider(b)?.label || b; // 0393: a model provider by its own name
function builderCommandWords(x, builder) {
  const own = x.build_command && x.build_command.own && typeof x.build_command.own === 'object' && Object.hasOwn(x.build_command.own, builder) ? x.build_command.own[builder] : null;
  if (typeof own !== 'string') return null;
  return own === '' ? `blank, so speck run starts each build with ${builderName(builder)}'s own command` : `${builderName(builder)}'s own command`;
}
// 0324: while the builder isn't being switched, a build_command you've written yourself builds every ticket, whichever
// builder it was made with, so the view says so.
function builderSwitchLine(x) {
  const picked = settingChosen('builder');
  if (picked === settingNow(x)) {
    const b = x.build_command;
    if (!b || b.each_ticket !== false) return null;
    return el('p', null, `build_command is one you've written yourself, '${typeof b.value === 'string' ? b.value : ''}', so speck run builds every ticket with it, whichever builder the ticket was made with. Set it to ${builderName(settingNow(x))}'s own command to build each ticket with its own builder.`);
  }
  const sets = builderCommandWords(x, picked);
  // 0388: a ticket that leaves its builder blank is built with the settings' one when its build starts.
  return el('p', null, `Saving changes who builds every ticket that doesn't name its own builder, from its next build${sets ? `, and sets build_command to ${sets}` : ''}. A ticket that names one keeps it.`);
}
// When these changes switch the builder and build_command was set by hand: what to ask before replacing it, and the
// build_command to send as confirmed; otherwise null.
function replacesCommand(changes) {
  const c = changes.find(c => c.key === 'builder'), x = settingRows().find(r => r.key === 'builder');
  if (!c || !x || !x.build_command || x.build_command.hand_set !== true) return null;
  const now = x.build_command.value, sets = builderCommandWords(x, c.value);
  if (sets === null) return null;
  return { value: typeof now === 'string' ? now : '', ask: `build_command is set by hand to '${typeof now === 'string' ? now : ''}', not ${settingNow(x)}'s own command. Switching the builder to ${c.value} replaces it: build_command will be ${sets}. Replace it?` };
}
// A setting's value as its control writes it: "low,high" for a list.
const settingNow = x => x.value === null || x.value === undefined ? '' : Array.isArray(x.value) ? x.value.join(',') : String(x.value);
// 0400: each role's one list, made of your agents' models, grouped by agent, as "<agent> · <model>". Choosing an entry
// sets the role's agent and model together. Its effort, for an agent that takes one, sits beside it.
const ROLES = { builder: { model: 'builder_model', name: 'builder' }, reviewer: { model: 'reviewer_model', name: 'reviewer' }, watch_agent: { model: 'watch_model', name: 'speck' } };
// Your agents' models, as the server read them, or null when it didn't say: then each role keeps its agent and model lists.
function yourModels() {
  const list = settingsView !== null && settingsView.state === 'ok' && Array.isArray(settingsView.agent_models) ? settingsView.agent_models : null;
  return list === null ? null : list.filter(a => a && typeof a.id === 'string' && typeof a.name === 'string');
}
const roleModelKey = key => yourModels() !== null && Object.values(ROLES).some(r => r.model === key);
// The agent a role's value runs on: the Claude subagent is Claude Code's.
const agentOfRole = id => id === 'claude-subagent' ? 'claude' : id;
const yourAgent = id => (yourModels() || []).find(a => a.id === agentOfRole(id)) ?? null;
const agentModelsOf = a => (Array.isArray(a.models) ? a.models : []).filter(m => m && typeof m.slug === 'string' && m.slug);
const modelLabel = m => typeof m.display_name === 'string' && m.display_name ? m.display_name : m.slug;
// Every agent speck knows, yours or not, from Your agents: for saying a role's agent isn't yours.
const knownAgent = id => {
  const all = settingsView !== null && settingsView.your_agents && Array.isArray(settingsView.your_agents.agents) ? settingsView.your_agents.agents : [];
  return all.find(a => a && a.id === agentOfRole(id)) ?? null;
};
const agentLabel = id => yourAgent(id)?.name ?? knownAgent(id)?.name ?? builderName(id);
// A setting's key, with its model's when it's a role whose list holds both.
const withRoleModel = key => yourModels() !== null && Object.hasOwn(ROLES, key) ? [key, ROLES[key].model] : [key];
const fromMachine = key => settingRows().some(r => r.key === key && r.for_machine === true && r.from === 'machine');
// Whether Save clears this machine's values for `role`, leaving the project's.
const roleCleared = role => { const own = withRoleModel(role).filter(fromMachine); return own.length > 0 && own.every(k => settingClear.has(k)); };
// The project's value of `key`, under this machine's own.
const projectValue = key => { const r = settingRows().find(x => x.key === key); return !r ? '' : r.for_machine === true && r.from === 'machine' ? settingNow({ value: r.repo_value }) : settingNow(r); };
// The agent the Foreman runs on when it's left to the builder's, as foremanAgentChosen reads it.
const buildersAgent = () => { const b = settingChosen('builder'); return ['codex', 'cursor'].includes(b) || settingProvider(b) !== null ? b : 'claude'; };
// 0403: the model an agent runs when its model is left blank, as the server named it, or '' when it couldn't tell.
const defaultSlug = a => a !== null && typeof a.default_model === 'string' ? a.default_model : '';
// That model by name, with " (default)", as " · Sonnet (default)", or just " (default)" when it isn't named.
function defaultWords(a) {
  const slug = defaultSlug(a), m = slug ? agentModelsOf(a).find(x => x.slug === slug) : undefined;
  return slug ? ` · ${m ? modelLabel(m) : slug} (default)` : ' (default)';
}
// `role`'s entries: { group, value, label }, each value "<agent>|<model>", a blank model being the agent's own default,
// which stands in for that model by name (0403).
function roleEntries(role) {
  const out = role === 'watch_agent' ? [{ group: null, value: '|', label: `The builder's agent, now ${agentLabel(buildersAgent())}` }] : [];
  for (const a of yourModels().filter(a => !needsClaude(a.id))) {
    const own = { group: a.name, value: `${a.id}|`, label: `${a.name}${defaultWords(a)}` }, models = agentModelsOf(a);
    if (!models.some(m => m.slug === defaultSlug(a))) out.push(own);
    for (const m of models) out.push(m.slug === defaultSlug(a) ? own : { group: a.name, value: `${a.id}|${m.slug}`, label: `${a.name} · ${modelLabel(m)}` });
    if (role === 'reviewer' && a.id === 'claude') out.push({ group: a.name, value: 'claude-subagent|', label: `${a.name} · subagent in the builder's session` });
  }
  return out;
}
const roleValue = (role, of) => `${of(role)}|${of(ROLES[role].model)}`;
// 0403: a value naming an agent's default model by name is shown as its default's entry, the one that stands in for it.
function asEntry(value) {
  const at = value.indexOf('|'), agent = value.slice(0, at), model = value.slice(at + 1), a = yourAgent(agent);
  return model !== '' && agent !== 'claude-subagent' && a !== null && model === defaultSlug(a) ? `${agent}|` : value;
}
// A value that isn't an entry, in words, as it's saved.
function roleWords(role, value) {
  const at = value.indexOf('|'), agent = value.slice(0, at), model = value.slice(at + 1);
  const a = yourAgent(agent), m = a !== null ? agentModelsOf(a).find(x => x.slug === model) : undefined;
  const who = agent === '' ? 'The builder\'s agent' : agent === 'claude-subagent' ? `${agentLabel(agent)} · subagent in the builder's session` : agentLabel(agent);
  if (model !== '') return `${who} · ${m ? modelLabel(m) : model}`;
  return `${who}${agent === '' || agent === 'claude-subagent' ? ' (default)' : defaultWords(a)}`;
}
function roleEditor(x) {
  const role = x.key;
  if (roleCleared(role)) { // 0261: this machine's value goes on Save, leaving the project's
    const shown = el('input', 'edit');
    shown.type = 'text';
    shown.value = roleWords(role, roleValue(role, projectValue));
    shown.disabled = true;
    shown.setAttribute('aria-label', role);
    return [shown];
  }
  const entries = roleEntries(role), picked = asEntry(roleValue(role, settingChosen));
  const select = el('select', 'edit');
  for (const v of [...new Set([asEntry(roleValue(role, settingSaved)), picked])].filter(v => !entries.some(e => e.value === v))) {
    // 0407: while the lists are read, or when they couldn't be, the one chosen is all there is to show
    const o = el('option', null, `${roleWords(role, v)} (${cataloguesLoading() ? 'loading the list…' : cataloguesWhy() !== null ? 'the list couldn\'t be read' : 'not offered'})`);
    o.value = v;
    o.disabled = true;
    select.appendChild(o);
  }
  let group = null, into = select;
  for (const e of entries) {
    if (e.group !== group) {
      group = e.group;
      into = select;
      if (group !== null) { into = el('optgroup'); into.label = group; select.appendChild(into); }
    }
    const o = el('option', null, e.label);
    o.value = e.value;
    into.appendChild(o);
  }
  if (cataloguesLoading()) { // 0407: every role's list says so, even with what's picked among its entries
    const o = el('option', null, 'Loading your agents\' models…');
    o.value = '';
    o.disabled = true;
    select.appendChild(o);
  }
  select.value = picked;
  select.setAttribute('aria-label', role);
  settingControls.set(role, select);
  const choose = () => {
    const v = String(select.value ?? ''), at = v.indexOf('|');
    if (at < 0) return;
    settingTyped.set(role, v.slice(0, at));
    settingTyped.set(ROLES[role].model, v.slice(at + 1));
    redrawSettings(ROLE_AFFECTS[role], role);
  };
  select.addEventListener('input', choose);
  select.addEventListener('change', choose);
  return [select];
}
// What a change to a role's list redraws: its own row, its effort, and the Foreman's, which can run on the builder's agent.
const ROLE_AFFECTS = { builder: ['builder', 'builder_effort', 'watch_agent', 'watch_effort'], reviewer: ['reviewer', 'reviewer_effort'], watch_agent: ['watch_agent', 'watch_effort'] };
// Whether the agent `role` runs on, as chosen, takes an effort: Claude Code and Codex do.
function takesEffort(role) {
  const agent = role === 'watch_agent' ? foremanAgentChosen() : agentOfRole(settingChosen(role)), a = yourAgent(agent);
  return a !== null ? a.efforts === true : ['claude', 'codex'].includes(agent);
}
// A role whose agent, as chosen, is one speck knows but not one of yours says so.
function notYoursLine(role) {
  const agent = settingChosen(role);
  if (agent === '' || yourAgent(agent) !== null || knownAgent(agent) === null) return null;
  return el('p', 'bad', `${agentLabel(agent)} isn't one of your agents on this machine any more, so choose ${role === 'watch_agent' ? '' : 'the '}${ROLES[role].name}'s model again from the list.`);
}
// 0393: speck runs a model provider's models through Claude Code, so while Claude Code isn't installed none is offered.
const needsClaude = id => settingProvider(id) !== null && knownAgent('claude') !== null && knownAgent('claude').installed === false;
function needsClaudeLine() {
  const left = (yourModels() || []).filter(a => needsClaude(a.id)).map(a => a.name);
  return left.length ? el('p', null, `Not offered: ${left.join(', ')}, as speck runs ${left.length > 1 ? 'their' : 'its'} models through Claude Code, and Claude Code isn't installed.`) : null;
}
// Why only an agent's default is offered, while it's chosen: its models couldn't be read.
function unlistedLine(role) {
  const agent = role === 'watch_agent' ? foremanAgentChosen() : settingChosen(role), a = yourAgent(agent);
  if (a === null || agentModelsOf(a).length || typeof a.why !== 'string' || !a.why) return null;
  return el('p', null, `Only ${a.name}'s default is offered: ${a.why}`);
}
// 0399: the Your agents group's box, drawn afresh.
function agentsGroup() {
  if (agentsBox === null) agentsBox = el('section', 'sgroup agents');
  drawAgents();
  return agentsBox;
}
const agentState = id => { if (!agentStates.has(id)) agentStates.set(id, { busy: null, typed: '' }); return agentStates.get(id); };
// The node in `box` whose data-focus is `key`, or null.
function focusKeyed(box, key) {
  const stack = [box];
  while (stack.length) {
    const n = stack.pop();
    if (n !== box && typeof n.getAttribute === 'function' && n.getAttribute('data-focus') === key) return n;
    for (const c of n.children || []) stack.push(c);
  }
  return null;
}
const focusable = (n, key) => { n.setAttribute('data-focus', key); return n; };
// Draws the group in its box. When the keyboard focus was in it, it goes back to the same control, or to `after` when
// that one's gone, such as the Remove button of an agent just removed, or else to Add an agent.
function drawAgents(after = null) {
  const box = agentsBox;
  if (box === null) return;
  const had = document.activeElement;
  const was = had && within(had, box) && typeof had.getAttribute === 'function' ? had.getAttribute('data-focus') : null;
  const view = settingsView !== null ? settingsView.your_agents : null;
  const kids = [el('div', 'sh', null, el('h4', null, 'Your agents'))];
  if (cataloguesLoading()) kids.push(el('div', 'arow note', null, el('p', 'loading', 'Loading your agents…'))); // 0407
  else if (cataloguesWhy() !== null) kids.push(el('div', 'arow note', null, el('p', 'bad', `Couldn't read your agents. ${cataloguesWhy()}`)));
  else if (view === null || view === undefined) kids.push(el('div', 'arow note', null, el('p', null, 'speck panel didn\'t say which agents are yours. Close Settings and open it again.')));
  else if (typeof view.why === 'string' && view.why) kids.push(el('div', 'arow note', null, el('p', 'bad', view.why)));
  else {
    const all = Array.isArray(view.agents) ? view.agents.filter(a => a && typeof a.id === 'string' && typeof a.name === 'string') : [];
    const mine = all.filter(a => a.yours === true);
    if (!mine.length) kids.push(el('div', 'arow note', null, el('p', null, 'You have no agents on this machine yet. Add one below.')));
    kids.push(...mine.map(agentRow), ...addRows(all.filter(a => a.yours !== true)));
  }
  if (agentsSaid !== null) kids.push(el('div', 'arow note', null, el('p', agentsSaid.bad ? 'bad' : 'said', agentsSaid.text)));
  box.replaceChildren(...kids);
  if (was === null) return;
  const to = [was, after, 'adding'].map(k => (k === null ? null : focusKeyed(box, k))).find(n => n);
  if (to && to.focus) to.focus({ preventScroll: true });
}
// What an agent is: installed and signed in, or a provider's key.
function agentWords(a) {
  if (a.kind === 'provider') return a.key_set === true ? 'Key set' : 'No key';
  return a.installed !== true ? 'Not installed' : a.signed_in === true ? 'Installed, signed in' : 'Installed, not signed in';
}
function agentButton(label, key, fn) {
  const b = focusable(el('button', 'save', label), key);
  b.type = 'button';
  b.addEventListener('click', fn);
  return b;
}
// One of your agents: its name, whether it's ready, and Remove. A provider's row has its key field, to replace it.
function agentRow(a) {
  const st = agentState(a.id);
  const remove = agentButton(st.busy === 'remove' ? 'Removing…' : 'Remove', `remove:${a.id}`, () => agentAction(a, 'remove'));
  remove.setAttribute('aria-label', `Remove ${a.name}`);
  return el('div', 'arow agent', null,
    el('div', 'row', null, el('span', 'label', null, el('span', 'name', a.name)), el('div', 'control', null, el('span', 'state', agentWords(a)), remove)),
    a.ready !== true && typeof a.why === 'string' && a.why ? el('p', null, a.why) : null,
    a.kind === 'provider' ? keyLine(a) : null);
}
// Add an agent: a button, or once it's pressed, each agent speck knows that isn't yours. One that's installed can be
// added and one that isn't says how to install it. An API provider is added with the form below, so one is offered only
// when its key was kept after you removed it (0408).
function addRows(all) {
  const others = all.filter(a => a.kind !== 'provider' || a.key_set === true);
  const toggle = agentButton(agentsAdding ? 'Done' : 'Add an agent', 'adding', () => { agentsAdding = !agentsAdding; agentsSaid = null; drawAgents(); });
  toggle.setAttribute('aria-expanded', String(agentsAdding));
  const head = el('div', 'arow add', null, el('div', 'row', null, el('span', 'label', null, el('span', 'name', 'Add an agent')), el('div', 'control', null, toggle)));
  if (!agentsAdding) return [head];
  return [head, ...(others.length ? [] : [el('div', 'arow note', null, el('p', null, 'Every agent speck knows is one of yours.'))]), ...others.map(a => {
    const st = agentState(a.id);
    const add = a.kind !== 'provider' && a.installed !== true ? null : agentButton(st.busy === 'add' ? 'Adding…' : 'Add', `add:${a.id}`, () => agentAction(a, 'add'));
    if (add) add.setAttribute('aria-label', `Add ${a.name}`);
    const install = a.kind !== 'provider' && a.installed !== true ? (typeof a.install === 'string' && a.install ? a.install : `Install ${a.name}, sign in, then add it here.`) : null;
    return el('div', 'arow agent offer', null,
      el('div', 'row', null, el('span', 'label', null, el('span', 'name', a.name)), el('div', 'control', null, el('span', 'state', agentWords(a)), add)),
      install !== null ? el('p', null, install) : null,
      a.kind === 'provider' ? keyLine(a) : null);
  }), providerFormRow()];
}
// 0401: Add an API provider: any provider with an OpenAI- or Anthropic-compatible API, by its name, base URL, API type,
// key and the names of its models, the first being the one speck uses unless you pick another. Saved for this machine
// only, with no commit. The key field is never filled in with a saved key, and is emptied once it's saved.
function providerFormRow() {
  const f = providerForm ??= { name: '', address: '', type: 'anthropic', key: '', models: '', busy: false };
  const field = (prop, label, placeholder, type = 'text') => {
    const input = focusable(el('input', 'edit'), `provider:${prop}`);
    input.type = type;
    input.autocomplete = 'off';
    input.value = f[prop];
    input.placeholder = placeholder;
    input.setAttribute('aria-label', label);
    input.setAttribute('data-provider-field', prop);
    input.addEventListener('input', () => { f[prop] = String(input.value ?? ''); });
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { f[prop] = String(input.value ?? ''); saveProvider(); } });
    return el('label', 'pfield', null, el('span', null, label), input);
  };
  const type = focusable(el('select', 'edit'), 'provider:type');
  for (const [v, words] of [['openai', 'OpenAI'], ['anthropic', 'Anthropic']]) {
    const o = el('option', null, words);
    o.value = v;
    type.appendChild(o);
  }
  type.value = f.type;
  type.setAttribute('aria-label', 'API type');
  type.setAttribute('data-provider-field', 'type');
  type.addEventListener('change', () => { f.type = String(type.value ?? ''); });
  const save = agentButton(f.busy ? 'Saving…' : 'Save provider and add', 'provider:save', () => saveProvider());
  return el('div', 'arow provider-form', null,
    el('div', 'row', null, el('span', 'label', null, el('span', 'name', 'Add an API provider'))),
    el('p', null, 'Any provider with an OpenAI- or Anthropic-compatible API. speck runs Anthropic-type ones so far. The key and the provider are kept on this machine only, never in git.'),
    el('div', 'pfields', null, field('name', 'Name', 'Moonshot'), field('address', 'Base URL', 'https://api.example.com/anthropic', 'url'),
      el('label', 'pfield', null, el('span', null, 'API type'), type), field('key', 'API key', 'Paste the key', 'password'),
      field('models', 'Models', 'model-one, model-two')),
    el('div', 'keyline', null, save));
}
// 0401: sends the form to be saved for this machine. Once it's saved, the form is emptied, and the view is read again,
// so the new provider is in Your agents and in each role's list.
async function saveProvider() {
  const f = providerForm, mine = settingsSeq;
  if (f === null || f.busy) return;
  f.busy = true;
  agentsSaid = null;
  drawAgents();
  const out = await agentPost('/api/providers', { headers: { 'X-Speck-Token': TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: f.name, address: f.address, type: f.type, key: f.key, models: f.models }) });
  if (mine !== settingsSeq || settingsView === null) return; // closed, or opened again, since
  f.busy = false;
  const saved = out !== null && out.ok && out.body !== null && typeof out.body === 'object' && out.body.ok === true;
  if (saved) providerForm = null;
  agentsTook(out === null ? null : { ...out, ok: saved, said: typeof out.body?.said === 'string' ? out.body.said : `Saved ${f.name.trim()}.` },
    'Couldn\'t reach speck panel to save the provider. Try again.');
  drawAgents(saved ? null : 'provider:save');
  if (saved) loadSettings();
}
// 0393's key field, in a provider's row: never filled in with a saved key. Saving it saves only the key, for this
// machine, apart from the view's Save, and adds the provider to your agents.
function keyLine(a) {
  const st = agentState(a.id);
  const input = focusable(el('input', 'edit'), `key:${a.id}`);
  input.type = 'password';
  input.autocomplete = 'off';
  input.value = st.typed;
  input.placeholder = a.key_set === true ? 'Paste a new key to replace it' : 'Paste the key';
  input.setAttribute('aria-label', `${a.name} API key`);
  input.setAttribute('data-provider', a.id);
  input.addEventListener('input', () => { st.typed = String(input.value ?? ''); });
  input.addEventListener('keydown', e => { if (e.key === 'Enter') { st.typed = String(input.value ?? ''); saveKey(a); } });
  const save = agentButton(st.busy === 'key' ? 'Saving…' : a.key_set === true ? 'Replace key' : a.yours === true ? 'Save key' : 'Save key and add', `keysave:${a.id}`,
    () => { st.typed = String(input.value ?? ''); saveKey(a); });
  save.setAttribute('data-provider', a.id);
  return el('div', 'keyline', null, input, save);
}
// Takes the server's answer to a change: the group as it is now, and what it did or why it was refused.
function agentsTook(out, unreached) {
  const body = out !== null && out.body !== null && typeof out.body === 'object' ? out.body : null;
  if (body !== null && body.your_agents !== null && typeof body.your_agents === 'object') settingsView.your_agents = body.your_agents;
  if (out === null) agentsSaid = { text: unreached, bad: true };
  else if (!out.ok) agentsSaid = { text: body !== null && typeof body.error === 'string' && body.error ? body.error : `${unreached.replace(/^Couldn't reach speck panel to /, 'Couldn\'t ').replace(/ Try again\.$/, '')} (${out.status}).`, bad: true };
  else agentsSaid = { text: out.said, bad: false };
}
async function agentPost(url, init) {
  try {
    const res = await fetch(url, { method: 'POST', ...init });
    let body = null;
    try { body = await res.json(); } catch { /* no JSON: say what we know */ }
    return { ok: res.ok, status: res.status, body };
  } catch { return null; }
}
// Adds or removes agent `a` on this machine: the server refuses to remove one a role uses, saying which.
async function agentAction(a, action) {
  const st = agentState(a.id), mine = settingsSeq;
  if (st.busy) return;
  st.busy = action;
  agentsSaid = null;
  drawAgents();
  const out = await agentPost(`/api/agents/${encodeURIComponent(a.id)}/${action}`, { headers: { 'X-Speck-Token': TOKEN } });
  if (mine !== settingsSeq || settingsView === null) return; // closed, or opened again, since
  st.busy = null;
  const ok = out !== null && out.ok && out.body !== null && out.body.ok === true;
  agentsTook(out === null ? null : { ...out, ok, said: typeof out.body?.said === 'string' ? out.body.said : `${action === 'add' ? 'Added' : 'Removed'} ${a.name}.` },
    `Couldn't reach speck panel to ${action} ${a.name}. Try again.`);
  drawAgents(ok ? (action === 'add' ? `remove:${a.id}` : 'adding') : null);
}
// Sends the typed key to be saved for this machine. Once saved it's forgotten here, and the field is empty again.
async function saveKey(a) {
  const st = agentState(a.id), mine = settingsSeq;
  if (st.busy) return;
  if (!st.typed.trim()) { agentsSaid = { text: `Paste the ${a.name} API key first.`, bad: true }; drawAgents(); return; }
  st.busy = 'key';
  agentsSaid = null;
  drawAgents();
  const out = await agentPost(`/api/keys/${encodeURIComponent(a.id)}`, { headers: { 'X-Speck-Token': TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify({ key: st.typed }) });
  if (mine !== settingsSeq || settingsView === null) return; // closed, or opened again, since
  st.busy = null;
  const saved = out !== null && out.body !== null && typeof out.body === 'object' && out.body.key_set === true;
  if (saved) {
    st.typed = '';
    const p = settingProvider(a.id);
    if (p !== null) p.key_set = true;
  }
  const said = `Saved the ${a.name} API key for this machine only.${a.yours === true ? '' : ` Added ${a.name} to your agents.`}`;
  agentsTook(out === null ? null : { ...out, ok: saved && out.ok, said }, `Couldn't reach speck panel to save the ${a.name} API key. Try again.`);
  drawAgents(saved ? `key:${a.id}` : null);
}
// 0261: in the explanation of a setting that uses this machine's own value (0397), the project's value and a button to
// clear this machine's on Save. Pressing it keeps the explanation open, to show what it did.
function machineLine(x, tip = x.key) {
  const clear = el('button', 'save', 'Clear this machine\'s value');
  clear.type = 'button';
  clear.addEventListener('click', () => {
    for (const k of withRoleModel(x.key).filter(fromMachine)) settingClear.add(k);
    for (const k of withRoleModel(x.key)) { settingTyped.delete(k); settingRefused.delete(k); }
    keepSettingTip(tip);
    renderSettings();
  });
  const project = withRoleModel(x.key).length > 1 ? roleWords(x.key, roleValue(x.key, projectValue)) : `${settingValue(x.repo_value)}${x.default ? ', speck\'s default' : ''}`; // 0400
  return el('span', 'line', null, el('span', null, `This is your machine's own value, used over the project's: ${project}.`), clear);
}
function clearLine(x, tip = x.key) {
  const keep = el('button', 'save', 'Keep this machine\'s value');
  keep.type = 'button';
  keep.addEventListener('click', () => { for (const k of withRoleModel(x.key)) { settingClear.delete(k); settingRefused.delete(k); } keepSettingTip(tip); renderSettings(); });
  const value = withRoleModel(x.key).length > 1 ? roleWords(x.key, roleValue(x.key, settingSaved)) : settingValue(x.value); // 0400
  return el('span', 'line', null, el('span', null, `This machine's value, ${value}, is cleared when you save.`), keep);
}
const keepSettingTip = key => { settingTip = key; settingTipKept = true; };
const settingRows = () => settingsView !== null && Array.isArray(settingsView.groups)
  ? settingsView.groups.flatMap(g => Array.isArray(g.settings) ? g.settings : []) : [];
// 0274: each setting whose value differs from the one the view read, as { key, value, machine }: what Save sends.
function settingChanges() {
  const out = [];
  for (const x of settingRows()) {
    if (x.editable !== true) continue;
    if (settingClear.has(x.key)) { out.push({ key: x.key, value: '', machine: true, clear: true }); continue; }
    if (!settingTyped.has(x.key)) continue;
    const value = settingTyped.get(x.key), now = settingNow(x);
    const same = x.key === 'auto_ship_risk' ? value.split(',').filter(Boolean).sort().join() === now.split(',').filter(Boolean).sort().join() : value === now;
    if (same) continue;
    out.push({ key: x.key, value, machine: x.for_machine === true }); // 0387: your own settings, for this machine
  }
  return out;
}
// 0274: the view's one Save, kept in view at the bottom of the pane however far it's scrolled.
function saveBar() {
  const save = el('button', 'save-all', 'Save');
  save.type = 'button';
  save.addEventListener('click', saveSettings);
  settingsBar = save;
  return el('div', 'savebar', null, settingsFailed !== null ? el('p', 'bad', settingsFailed) : null, settingsSaid !== null ? el('p', 'said', settingsSaid) : null, save);
}
// After each change: Save is pressable only while something differs and nothing is being saved.
function refreshSettings() {
  if (settingsView === null || settingsView.state !== 'ok') return;
  const changes = settingChanges();
  if (settingsBar !== null) {
    settingsBar.disabled = changes.length === 0 || settingsView.saving === true;
    settingsBar.textContent = settingsView.saving === true ? 'Saving…' : 'Save';
  }
}
// 0259: auto_ship and auto_ship_risk as the view last read them, as the ship queue reads them.
function shippingNow() {
  const of = key => (settingRows().find(x => x.key === key) || {}).value;
  return { on: of('auto_ship') === true, risks: [].concat(of('auto_ship_risk') ?? []).map(String) };
}
// When these changes let more tickets ship by themselves than now, the risks that would then ship ("low,high"), which
// the server checks against its own reading, and the tickets in words; otherwise null.
function shipsMore(changes) {
  const was = shippingNow(), will = { ...was };
  // 0387: clearing this machine's value leaves speck/config.yml's.
  const to = c => c.clear ? (settingRows().find(x => x.key === c.key) || {}).repo_value : c.key === 'auto_ship' ? c.value === 'true' : c.value.split(',');
  for (const c of changes) if (c.key === 'auto_ship') will.on = to(c) === true; else if (c.key === 'auto_ship_risk') will.risks = [].concat(to(c) ?? []).map(String);
  if (!changes.some(c => c.key === 'auto_ship' || c.key === 'auto_ship_risk')) return null;
  if (!will.on || (was.on && will.risks.every(r => was.risks.includes(r)))) return null;
  const risks = ['low', 'high'].filter(r => will.risks.includes(r));
  return { risks: risks.join(','), words: `approved ${risks.map(r => `${r}-risk`).join(' and ')} tickets` };
}
// 0511: whether these changes turn allow_same_model_review on, from off as the view last read it. Clearing this
// machine's value leaves speck/config.yml's.
function allowsSameModel(changes) {
  const x = settingRows().find(r => r.key === 'allow_same_model_review'), c = changes.find(c => c.key === 'allow_same_model_review');
  if (!x || !c || x.value === true) return false;
  return c.clear ? x.repo_value === true : c.value === 'true';
}
// 0274: Save sends every change in one request, and the server saves all of them or none. 0275: true once saved.
// A Save pressed while one from the same view is being sent waits for that one.
let settingsSending = null; // { view, done }
function saveSettings() {
  if (settingsSending !== null && settingsSending.view === settingsView) return settingsSending.done;
  const sending = { view: settingsView, done: sendSettings() };
  settingsSending = sending;
  sending.done.finally(() => { if (settingsSending === sending) settingsSending = null; });
  return sending.done;
}
async function sendSettings() {
  if (settingsView === null || settingsView.state !== 'ok' || settingsView.saving) return;
  const changes = settingChanges(), mine = settingsSeq;
  if (!changes.length) return;
  // Checked here first, so nothing is sent: auto_ship_risk with nothing ticked (0259).
  const unticked = changes.find(c => c.key === 'auto_ship_risk' && c.value === '' && !c.clear);
  if (unticked) {
    settingRefused.set(unticked.key, 'Tick at least one risk. To stop tickets shipping by themselves, turn auto_ship off instead.');
    renderSettings();
    return;
  }
  const more = shipsMore(changes);
  if (more !== null) {
    const ask = `Let more tickets ship by themselves? With this change, speck run's ship queue will merge ${more.words} and push them to the base branch without waiting for you.`;
    if (typeof confirm !== 'function' || !confirm(ask)) { // cancelled: nothing is saved, and auto_ship and auto_ship_risk go back as they were
      for (const k of ['auto_ship', 'auto_ship_risk']) { settingTyped.delete(k); settingRefused.delete(k); settingClear.delete(k); }
      renderSettings();
      return;
    }
  }
  if (allowsSameModel(changes)) { // 0511
    const ask = 'Let the reviewer run the same model as the builder? With this on, a review is no longer by a different model, so it may catch less of what the builder missed.';
    if (typeof confirm !== 'function' || !confirm(ask)) { // cancelled: nothing is saved, and it goes back as it was
      settingTyped.delete('allow_same_model_review'); settingRefused.delete('allow_same_model_review'); settingClear.delete('allow_same_model_review');
      renderSettings();
      return;
    }
  }
  const replacing = replacesCommand(changes);
  if (replacing !== null && (typeof confirm !== 'function' || !confirm(replacing.ask))) { // 0293: cancelled: the builder goes back as it was
    for (const k of withRoleModel('builder')) settingTyped.delete(k); // 0400: and the model chosen with it
    settingRefused.delete('builder');
    renderSettings();
    return;
  }
  settingsView.saving = true;
  settingRefused = new Map();
  settingsFailed = settingsSaid = null;
  refreshSettings();
  let refused = null, why = null, ask = false, again = false, said = null;
  // 0387: machine:<key>= clears this machine's value, so a blank one for this machine is sent as blank:<key>=.
  const query = [...changes.map(c => `${!c.machine ? 'repo' : c.value === '' && !c.clear ? 'blank' : 'machine'}%3A${encodeURIComponent(c.key)}=${encodeURIComponent(c.value)}`),
    ...(more !== null ? [`confirm=${encodeURIComponent(more.risks)}`] : []),
    ...(replacing !== null ? [`replace=${encodeURIComponent(replacing.value)}`] : [])].join('&');
  try {
    const res = await fetch(`/api/settings/save?${query}`, { method: 'POST', headers: { 'X-Speck-Token': TOKEN } });
    if (!res.ok) {
      let body = null;
      try { body = await res.json(); } catch { /* no JSON: say what we know */ }
      why = body && typeof body.error === 'string' && body.error ? body.error : `The server refused (${res.status}).`;
      refused = body && body.refused !== null && typeof body.refused === 'object' ? body.refused : null;
      ask = res.status === 409 && body !== null && body.confirm === true;
      again = res.status === 409 && body !== null && body.replace === true; // 0293: build_command changed since
    } else {
      let body = null;
      try { body = await res.json(); } catch { /* saved all the same */ }
      const cleared = body && body.cleared !== null && typeof body.cleared === 'object' ? body.cleared.builder_model : undefined;
      if (typeof cleared === 'string' && cleared) said = `builder_model was cleared, because ${cleared}.`; // 0311
    }
  } catch { why = "Couldn't reach the panel server, so nothing was saved."; }
  if (mine !== settingsSeq || settingsView === null) return; // closed, or opened again, since
  settingsView.saving = false;
  if (why !== null) {
    // Each refusal beside its setting, or under Save when it's no one setting's; what you changed stays as it is.
    const mineToo = refused === null ? [] : Object.entries(refused).filter(([k, v]) => changes.some(c => c.key === k) && typeof v === 'string');
    for (const [k, v] of mineToo) settingRefused.set(k, v);
    if (!mineToo.length) settingsFailed = why;
    if (ask) { for (const k of ['auto_ship', 'auto_ship_risk']) { settingTyped.delete(k); settingClear.delete(k); } loadSettings(); return; } // 0259: changed since: read them again
    if (again) { loadSettings(); return; } // 0293: read build_command again, keeping the builder picked
    renderSettings();
    return;
  }
  // Saved: forget what was sent, keeping any change made while it was being saved, which Save sends next.
  settingsSaid = said;
  for (const c of changes) {
    if (c.clear) settingClear.delete(c.key);
    else if (settingTyped.get(c.key) === c.value) settingTyped.delete(c.key);
  }
  loadSettings(); // the values speck now reads
  return true;
}

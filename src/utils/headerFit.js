// Our header widgets sit in Salesforce's global header row (logo | search | actions) as real flex
// items, so the search box shrinks to make room instead of us painting over its neighbours. When
// even that isn't enough (zoomed in, narrow window), the widgets step down through compact levels.
// Levels are cumulative: at level N the header has classes slae-fit-1 … slae-fit-N (see content.css).
//   1 Record/Org Id collapses to a label · 2 narrower Launch by ID · 3 Launch by ID as a button
//   4 Record/Org Id as a small "ID" chip
const MAX_LEVEL = 4;
const MARGIN = 8;
const watched = new WeakSet();

function overflows(header) {
  const bounds = header.getBoundingClientRect();
  let prevRight = bounds.left;
  for (const child of header.children) {
    const rect = child.getBoundingClientRect();
    if (rect.width === 0) continue;
    if (rect.left < prevRight - 0.5) return true;
    prevRight = rect.right;
  }
  return prevRight > bounds.right + 0.5;
}

export function refitHeader(header) {
  if (!header?.isConnected) return;
  // On narrow windows Salesforce stops using a flex row and stacks the header items; ours then
  // get their own rows and the full display fits.
  const stacked = getComputedStyle(header).display !== 'flex';
  header.classList.toggle('slae-fit-stacked', stacked);
  const setLevel = (level) => {
    for (let i = 1; i <= MAX_LEVEL; i++) header.classList.toggle(`slae-fit-${i}`, i <= level);
  };
  let level = 0;
  setLevel(level);
  if (stacked) return;
  while (level < MAX_LEVEL && overflows(header)) setLevel(++level);
}

function watch(header) {
  if (watched.has(header)) return;
  watched.add(header);
  // Fires on window resize and zoom, and when our widgets change size (e.g. a new Record Id).
  const observer = new ResizeObserver(() => refitHeader(header));
  observer.observe(header);
  for (const child of header.children) observer.observe(child);
  new MutationObserver(() => {
    for (const child of header.children) observer.observe(child);
    refitHeader(header);
  }).observe(header, { childList: true });
}

// Inserts el beside the global search item ('before' or 'after') and keeps the header fitted.
export function placeBesideSearch(el, searchItem, side) {
  const header = searchItem.parentElement;
  if (side === 'before') searchItem.before(el);
  else searchItem.after(el);
  watch(header);
  refitHeader(header);
}

// Shifts an open dropdown sideways so it stays fully on screen. Call on open and on resize.
export function keepInViewport(panel) {
  panel.style.translate = '';
  if (panel.hidden || !panel.isConnected) return;
  const rect = panel.getBoundingClientRect();
  let dx = 0;
  if (rect.left < MARGIN) dx = MARGIN - rect.left;
  else if (rect.right > window.innerWidth - MARGIN) dx = window.innerWidth - MARGIN - rect.right;
  if (dx) panel.style.translate = `${dx}px 0`;
}

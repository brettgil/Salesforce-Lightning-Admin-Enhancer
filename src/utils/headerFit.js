// Our header widgets sit in Salesforce's global header row (logo | search | actions) as real flex
// items, so the search box shrinks to make room instead of us painting over its neighbours. When
// even that isn't enough (zoomed in, narrow window), the widgets step down through compact levels.
// Levels are cumulative: at level N the header has classes slae-fit-1 … slae-fit-N (see content.css).
//   1 Record/Org Id collapses to a label · 2 Launch by ID narrows to a short hint (it expands on focus)
//   3 Record/Org Id as an "ID" chip
const MAX_LEVEL = 3;
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

// Stacked header: pin our widgets out of flow, since Salesforce gives the stacked header a fixed
// height and extra rows would spill over the nav bar. The Record/Org Id goes right of the search
// box; Launch by ID and User Search go left of toolsAnchor (the search box, or the global actions
// row above it when the search row is too narrow).
function pinStacked(header, searchItem, toolsAnchor) {
  const bounds = header.getBoundingClientRect();
  const middle = (rect) => `${rect.top + rect.height / 2 - bounds.top}px`;
  const search = searchItem.getBoundingClientRect();
  const anchor = toolsAnchor.getBoundingClientRect();
  const tools = header.querySelector(':scope > #slae-search-tools');
  if (tools) Object.assign(tools.style, { top: middle(anchor), right: `${bounds.right - anchor.left + MARGIN}px` });
  for (const badge of header.querySelectorAll(':scope > .slae-org-id-wrapper')) {
    Object.assign(badge.style, { top: middle(search), left: `${search.right - bounds.left + MARGIN}px` });
  }
}

function unpin(header) {
  for (const el of header.querySelectorAll(':scope > #slae-search-tools, :scope > .slae-org-id-wrapper')) {
    Object.assign(el.style, { top: '', left: '', right: '' });
  }
}

function stackedOverflows(header) {
  const tools = header.querySelector(':scope > #slae-search-tools');
  if (tools && tools.getBoundingClientRect().left < MARGIN) return true;
  for (const badge of header.querySelectorAll(':scope > .slae-org-id-wrapper')) {
    if (badge.getBoundingClientRect().right > window.innerWidth - MARGIN) return true;
  }
  return false;
}

export function refitHeader(header) {
  if (!header?.isConnected) return;
  const searchItem = header.querySelector(':scope > .slds-global-header__item_search');
  // On narrow windows Salesforce stacks the header items (a block, or a column-reverse flex at
  // medium widths).
  const style = getComputedStyle(header);
  const stacked = !!searchItem && (style.display !== 'flex' || style.flexDirection.startsWith('column'));
  header.classList.toggle('slae-fit-stacked', stacked);
  const setLevel = (level) => {
    for (let i = 1; i <= MAX_LEVEL; i++) header.classList.toggle(`slae-fit-${i}`, i <= level);
  };
  // Steps down until fits() holds; false if even the most compact level doesn't fit.
  const fitLevel = (fits) => {
    let level = 0;
    setLevel(level);
    while (level < MAX_LEVEL && !fits()) setLevel(++level);
    return fits();
  };

  if (!stacked) {
    unpin(header);
    fitLevel(() => !overflows(header));
    return;
  }
  const actions = header.querySelector('.slds-global-actions');
  for (const anchor of [searchItem, actions]) {
    if (!anchor) continue;
    pinStacked(header, searchItem, anchor);
    if (fitLevel(() => !stackedOverflows(header))) return;
  }
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

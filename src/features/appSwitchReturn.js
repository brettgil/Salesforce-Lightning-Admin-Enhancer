const LAST_RECORD_KEY = 'slae-app-last-record';
const BANNER_ID = 'slae-app-switch-banner';

function isRecordUrl(url) {
  return /\/lightning\/r\/[^/]+\/[^/]+\/(view|edit)/.test(url);
}

function removeBanner() {
  document.getElementById(BANNER_ID)?.remove();
}

function showBanner(name, url) {
  if (document.getElementById(BANNER_ID)) return;

  const banner = document.createElement('div');
  banner.id = BANNER_ID;
  banner.className = 'slae-app-switch-banner';

  const msg = document.createElement('span');
  msg.className = 'slae-app-switch-msg';
  msg.textContent = 'You were viewing ';

  const link = document.createElement('a');
  link.href = url;
  link.className = 'slae-app-switch-link';
  link.textContent = name;
  link.addEventListener('click', (e) => {
    e.preventDefault();
    removeBanner();
    window.location.assign(url);
  });

  const closeBtn = document.createElement('button');
  closeBtn.className = 'slae-app-switch-close';
  closeBtn.innerHTML = '&times;';
  closeBtn.addEventListener('click', removeBanner);

  msg.appendChild(link);
  banner.append(msg, closeBtn);
  document.body.appendChild(banner);

  setTimeout(removeBanner, 8000);
}

function applyBehavior(behavior) {
  const saved = sessionStorage.getItem(LAST_RECORD_KEY);
  if (!saved) return;
  sessionStorage.removeItem(LAST_RECORD_KEY);
  const { url, name } = JSON.parse(saved);
  if (behavior === 'auto') {
    window.location.assign(url);
  } else if (behavior === 'banner') {
    showBanner(name, url);
  }
}

function whenReady(callback) {
  const el = document.querySelector('.slds-global-header, .oneGlobalHeader, .slds-icon-waffle');
  if (el) { callback(); return; }
  const observer = new MutationObserver(() => {
    const ready = document.querySelector('.slds-global-header, .oneGlobalHeader, .slds-icon-waffle');
    if (ready) { observer.disconnect(); callback(); }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

export function init(behavior) {
  // On page load: if a record was saved before an app switch, apply behavior.
  if (sessionStorage.getItem(LAST_RECORD_KEY)) {
    if (!isRecordUrl(window.location.href)) {
      whenReady(() => applyBehavior(behavior));
    } else {
      // Landed on a record directly — clear it
      sessionStorage.removeItem(LAST_RECORD_KEY);
    }
  }

  // Listen for clicks on app launcher items (a.al-menu-item with /lightning/app/ href).
  // When an app is selected, save the current page URL so we can return to it.
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a.al-menu-item[href^="/lightning/app/"]');
    if (!link) return;
    if (!isRecordUrl(window.location.href)) return;
    const name = document.title.split(' | ')[0].trim() || 'the previous record';
    sessionStorage.setItem(LAST_RECORD_KEY, JSON.stringify({ url: window.location.href, name }));
  }, true);
}

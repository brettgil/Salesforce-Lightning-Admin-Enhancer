const LAST_RECORD_KEY = 'slae-last-record';
const PENDING_KEY = 'slae-app-switch-pending';
const BANNER_ID = 'slae-app-switch-banner';

function isRecordUrl(url) {
  return /\/lightning\/r\/[^/]+\/[^/]+\/(view|edit)/.test(url);
}


function saveRecord(url) {
  const name = document.title.split(' | ')[0].trim() || 'the previous record';
  sessionStorage.setItem(LAST_RECORD_KEY, JSON.stringify({ url, name }));
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

  sessionStorage.removeItem(PENDING_KEY);
  const { url, name } = JSON.parse(saved);

  if (behavior === 'auto') {
    window.location.assign(url);
  } else if (behavior === 'banner') {
    showBanner(name, url);
  }
}

function isAppLauncherClick(e) {
  // composedPath pierces shadow DOM — check if any ancestor tag suggests app launcher
  return e.composedPath().some((el) => {
    const tag = el.tagName?.toLowerCase() || '';
    return tag.startsWith('one-app-launcher') || tag === 'runtime_platform_app_launcher-app-launcher-bar';
  });
}

function whenReady(callback) {
  // Wait for Salesforce's global header to exist before injecting the banner,
  // so it doesn't get wiped out by the framework's initial render.
  const el = document.querySelector('.slds-global-header, .oneGlobalHeader, .slds-icon-waffle');
  if (el) { callback(); return; }

  const observer = new MutationObserver(() => {
    const ready = document.querySelector('.slds-global-header, .oneGlobalHeader, .slds-icon-waffle');
    if (ready) { observer.disconnect(); callback(); }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

export function init(behavior) {
  const currentUrl = window.location.href;

  // On full page load after an app switch: if pending and not on a record, apply behavior.
  if (sessionStorage.getItem(PENDING_KEY)) {
    if (isRecordUrl(currentUrl)) {
      sessionStorage.removeItem(PENDING_KEY);
    } else {
      whenReady(() => applyBehavior(behavior));
    }
  }

  // App switches are soft navigations — detect via slae-navigate and apply behavior.
  window.addEventListener('slae-navigate', (e) => {
    const url = e.detail?.url || window.location.href;
    if (sessionStorage.getItem(PENDING_KEY)) {
      if (isRecordUrl(url)) {
        sessionStorage.removeItem(PENDING_KEY);
      } else {
        whenReady(() => applyBehavior(behavior));
      }
    }
  });

  // When on a record page, save current URL at click time then mark as pending.
  // We save immediately so the correct record is captured before navigation happens.
  document.addEventListener('click', (e) => {
    if (!isRecordUrl(window.location.href)) return;
    if (isAppLauncherClick(e)) {
      saveRecord(window.location.href);
      sessionStorage.setItem(PENDING_KEY, '1');
    }
  }, true);
}

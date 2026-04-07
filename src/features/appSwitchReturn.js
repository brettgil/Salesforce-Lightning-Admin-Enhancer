const LAST_RECORD_KEY = 'slae-last-record';
const PENDING_KEY = 'slae-app-switch-pending';
const BANNER_ID = 'slae-app-switch-banner';

function isRecordUrl(url) {
  return /\/lightning\/r\/[^/]+\/[^/]+\/(view|edit)/.test(url);
}


function saveRecord(url) {
  const existing = JSON.parse(sessionStorage.getItem(LAST_RECORD_KEY) || '{}');
  sessionStorage.setItem(LAST_RECORD_KEY, JSON.stringify({ url, name: existing.name || 'the previous record' }));

  setTimeout(() => {
    const name = document.title.split(' | ')[0].trim() || 'the previous record';
    sessionStorage.setItem(LAST_RECORD_KEY, JSON.stringify({ url, name }));
  }, 2000);
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

  console.log('[SLAE] appSwitchReturn init | behavior:', behavior, '| url:', currentUrl);
  console.log('[SLAE] appSwitchReturn | PENDING_KEY present:', !!sessionStorage.getItem(PENDING_KEY));
  console.log('[SLAE] appSwitchReturn | LAST_RECORD_KEY:', sessionStorage.getItem(LAST_RECORD_KEY));

  // On fresh page load after an app switch: if pending and we didn't land on a record, apply behavior.
  if (sessionStorage.getItem(PENDING_KEY)) {
    if (isRecordUrl(currentUrl)) {
      sessionStorage.removeItem(PENDING_KEY);
    } else {
      whenReady(() => applyBehavior(behavior));
    }
  }

  if (isRecordUrl(currentUrl)) {
    saveRecord(currentUrl);
  }

  // Watch for soft navigations (pushState) via nav-interceptor
  window.addEventListener('slae-navigate', (e) => {
    const url = e.detail?.url || window.location.href;
    console.log('[SLAE] appSwitchReturn slae-navigate | url:', url, '| pending:', !!sessionStorage.getItem(PENDING_KEY));
    if (sessionStorage.getItem(PENDING_KEY)) {
      if (isRecordUrl(url)) {
        sessionStorage.removeItem(PENDING_KEY);
      } else {
        whenReady(() => applyBehavior(behavior));
      }
    }
    if (isRecordUrl(url)) {
      saveRecord(url);
    }
  });

  // When on a record page, watch for clicks within the App Launcher
  document.addEventListener('click', (e) => {
    const onRecord = isRecordUrl(window.location.href);
    const isLauncher = isAppLauncherClick(e);
    console.log('[SLAE] appSwitchReturn click | onRecord:', onRecord, '| isLauncher:', isLauncher, '| path tags:', e.composedPath().map(el => el.tagName?.toLowerCase()).filter(Boolean).slice(0, 8));
    if (!onRecord) return;
    if (isLauncher) {
      console.log('[SLAE] appSwitchReturn | setting PENDING_KEY');
      sessionStorage.setItem(PENDING_KEY, '1');
    }
  }, true);
}

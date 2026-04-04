const STORAGE_KEY = 'slaeLoginAsReturn';

function getUserIdFromHref(href) {
  try {
    const params = new URL(href, window.location.origin).searchParams;
    return params.get('suorgadminid');
  } catch {
    return null;
  }
}

function getUserIdFromOnclick(onclick) {
  const match = onclick.match(/suorgadminid=([0-9A-Za-z]+)/);
  return match ? match[1] : null;
}

function getNameFromTitle(title) {
  // "Login - Record 1 - Estrella, Cristina" → "Estrella, Cristina"
  const parts = title.split(' - ');
  return parts.length >= 3 ? parts.slice(2).join(' - ') : null;
}

function buildReturnUrl(origin, userId) {
  if (origin.includes('salesforce-setup.com')) {
    const encoded = encodeURIComponent(`/${userId}?noredirect=1&isUserEntityOverride=1`);
    return `${origin}/lightning/setup/ManageUsers/page?address=${encoded}`;
  }
  return `/lightning/r/User/${userId}/view`;
}

function saveLoginAs(userId, name) {
  chrome.storage.local.set({
    [STORAGE_KEY]: { userId, name, origin: window.location.origin }
  });
}

function setReturning() {
  chrome.storage.local.get(STORAGE_KEY, (data) => {
    const stored = data[STORAGE_KEY];
    if (stored?.userId) {
      chrome.storage.local.set({ [STORAGE_KEY]: { ...stored, returning: true } });
    }
  });
}

export function init() {
  // On page load: if returning from Login As, redirect to user detail page
  chrome.storage.local.get(STORAGE_KEY, (data) => {
    const stored = data[STORAGE_KEY];
    if (stored?.returning && stored?.userId) {
      chrome.storage.local.remove(STORAGE_KEY);
      window.location.assign(buildReturnUrl(stored.origin || '', stored.userId));
    }
  });

  // Watch for Login As button/link clicks
  document.addEventListener('click', (e) => {
    // <a href="/servlet/servlet.su?...suorgadminid=xxx...">Login</a>
    const link = e.target.closest('a[href*="servlet.su"]');
    if (link) {
      const userId = getUserIdFromHref(link.href);
      const name = getNameFromTitle(link.title || '');
      if (userId) saveLoginAs(userId, name);
      return;
    }

    // <input name="login" type="button" onclick="...servlet.su?...suorgadminid=xxx...">
    const btn = e.target.closest('input[name="login"]');
    if (btn) {
      const userId = getUserIdFromOnclick(btn.getAttribute('onclick') || '');
      if (userId) saveLoginAs(userId, null);
      return;
    }

    // "Log out as [name]" → triggers the redirect on next load
    const logoutLink = e.target.closest('a[href="/secur/logout.jsp"]');
    if (logoutLink) {
      setReturning();
    }
  }, true);
}

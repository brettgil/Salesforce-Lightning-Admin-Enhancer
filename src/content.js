(async () => {
  const { migrateIfNeeded } = await import(chrome.runtime.getURL('src/utils/migrate.js'));
  await migrateIfNeeded();

  const { getSettings } = await import(chrome.runtime.getURL('src/utils/storage.js'));
  const settings = await getSettings();

  async function load(key, path, run) {
    if (!settings[key]) return;
    try {
      const { init } = await import(chrome.runtime.getURL(path));
      run ? run(init) : init();
    } catch (e) {
      console.warn(`[SLAE] Failed to load ${key}:`, e);
    }
  }

  await load('clickableLogo',    'src/features/clickableLogo.js');
  await load('launchById',       'src/features/launchById.js');
  await load('quickFindLayout',  'src/features/quickFindLayout.js');
  await load('quickFocus',       'src/features/quickFocus.js');

  if (settings.navFavorites) {
    try {
      const { init } = await import(chrome.runtime.getURL('src/features/navFavorites.js'));
      init(settings.navFavoritesLinks);
      const { init: initNavPin } = await import(chrome.runtime.getURL('src/features/setupNavPin.js'));
      initNavPin();
    } catch (e) {
      console.warn('[SLAE] Failed to load navFavorites:', e);
    }
  }

  await load('processBuilder',   'src/features/processBuilder.js');
  await load('orgIdHeader',      'src/features/orgIdHeader.js');
  await load('setupFavorites',   'src/features/setupFavorites.js');

  if (settings.appSwitchBehavior !== 'off') {
    try {
      const { init } = await import(chrome.runtime.getURL('src/features/appSwitchReturn.js'));
      init(settings.appSwitchBehavior);
    } catch (e) {
      console.warn('[SLAE] Failed to load appSwitchReturn:', e);
    }
  }

  await load('loginAsReturn',    'src/features/loginAsReturn.js');
  await load('recordIdHeader',   'src/features/recordIdHeader.js');
  await load('userSearch', 'src/features/userSearch.js', (init) => init(settings.userSearchDestination ?? 'setup'));
  await load('fieldApiName',     'src/features/fieldApiName.js');
  await load('loadAll',          'src/features/loadAll.js');
})();

(async () => {
  const { migrateIfNeeded } = await import(chrome.runtime.getURL('src/utils/migrate.js'));
  await migrateIfNeeded();

  const { getSettings } = await import(chrome.runtime.getURL('src/utils/storage.js'));
  const settings = await getSettings();

  if (settings.clickableLogo) {
    const { init } = await import(chrome.runtime.getURL('src/features/clickableLogo.js'));
    init();
  }

  if (settings.launchById) {
    const { init } = await import(chrome.runtime.getURL('src/features/launchById.js'));
    init();
  }

  if (settings.quickFindLayout) {
    const { init } = await import(chrome.runtime.getURL('src/features/quickFindLayout.js'));
    init();
  }

  if (settings.quickFocus) {
    const { init } = await import(chrome.runtime.getURL('src/features/quickFocus.js'));
    init();
  }

  if (settings.navFavorites) {
    const { init } = await import(chrome.runtime.getURL('src/features/navFavorites.js'));
    init(settings.navFavoritesLinks);
  }

  if (settings.processBuilder) {
    const { init } = await import(chrome.runtime.getURL('src/features/processBuilder.js'));
    init();
  }

  if (settings.orgIdHeader) {
    const { init } = await import(chrome.runtime.getURL('src/features/orgIdHeader.js'));
    init();
  }

  if (settings.setupFavorites) {
    const { init } = await import(chrome.runtime.getURL('src/features/setupFavorites.js'));
    init();
  }

  if (settings.appSwitchBehavior !== 'off') {
    const { init } = await import(chrome.runtime.getURL('src/features/appSwitchReturn.js'));
    init(settings.appSwitchBehavior);
  }
})();

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
})();

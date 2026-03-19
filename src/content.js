(async () => {
  const { getSettings } = await import(chrome.runtime.getURL('src/utils/storage.js'));
  const settings = await getSettings();

  if (settings.clickableLogo) {
    const { init } = await import(chrome.runtime.getURL('src/features/clickableLogo.js'));
    init();
  }
})();

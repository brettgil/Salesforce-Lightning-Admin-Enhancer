import { onElement } from '../utils/observer.js';

function isSetupPage() {
  return window.location.hostname.endsWith('.my.salesforce-setup.com') ||
         window.location.pathname.includes('/lightning/setup/');
}

function getActiveSearchInput() {
  return document.querySelector('.onesetupNavTreeFilter input[type="search"]') ||
         document.querySelector('.filter-box.input') ||
         document.querySelector('#globalQuickfind') ||
         document.querySelector('.search-button');
}

export function init() {
  // Setup > Home: focus the sidebar Quick Find filter on arrival
  onElement('.filter-box.input', (input) => {
    setTimeout(() => input.focus(), 1500);
  });

  // Setup > Sidebar nav: focus the Quick Find filter on arrival
  onElement('.onesetupNavTreeFilter input[type="search"]', (input) => {
    setTimeout(() => input.focus(), 1500);
  });

  // Setup > Object Manager: focus the Quick Find input on arrival
  onElement('#globalQuickfind', (input) => {
    setTimeout(() => input.focus(), 1500);
  });

  // Non-setup Lightning pages: focus the global search button on arrival
  onElement('.search-button', (button) => {
    if (!isSetupPage()) setTimeout(() => button.focus(), 1500);
  });

  // The Guidance Center button loads late and steals focus — reclaim it
  onElement('[part="sidebarGCButton"]', () => {
    setTimeout(() => getActiveSearchInput()?.focus(), 100);
  });

  // When a nav tab is clicked, focus the appropriate Quick Find
  // after a short delay to let the view settle
  document.addEventListener('click', () => {
    setTimeout(() => {
      const tabHasFocus = document.querySelector('li.tabItem.slds-has-focus');
      if (!tabHasFocus) return;

      const isSplitView = document.querySelector('.main-content.split');
      const selector = isSplitView ? '.filter-box.input' : '#globalQuickfind';
      document.querySelector(selector)?.focus();
    }, 1000);
  });
}

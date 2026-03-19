import { onElement } from '../utils/observer.js';

function getLightningHomeUrl() {
  const host = window.location.hostname;

  // On the setup domain, derive the equivalent lightning.force.com host
  // e.g. cvent--b2bdev.sandbox.my.salesforce-setup.com
  //   -> cvent--b2bdev.sandbox.lightning.force.com
  if (host.endsWith('.my.salesforce-setup.com')) {
    const org = host.slice(0, host.indexOf('.my.salesforce-setup.com'));
    return `https://${org}.lightning.force.com/`;
  }

  return '/';
}

export function init() {
  onElement('.slds-global-header__logo', (logo) => {
    logo.classList.add('slae-clickable-logo');
    logo.addEventListener('click', (e) => {
      e.preventDefault();
      window.open(getLightningHomeUrl(), '_blank');
    });
  });
}

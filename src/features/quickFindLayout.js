import { onElement } from '../utils/observer.js';

export function init() {
  onElement('#globalQuickfind', (input) => {
    // Object Manager Home: .bRight / .bLeft float layout
    const bRight = input.closest('.bRight');
    if (bRight) {
      bRight.classList.add('slae-qf-right');
      bRight.parentElement.querySelector('.bLeft')?.classList.add('slae-qf-left');
      return;
    }

    // Object Manager detail pages (Fields & Relationships, Page Layouts, etc.):
    // move Quick Find out of the right column into the outer grid, leaving buttons on the right
    const pageHeader = input.closest('.slds-page-header');
    if (!pageHeader || pageHeader.dataset.slaeInit) return;
    pageHeader.dataset.slaeInit = 'true';

    const outerGrid = pageHeader.querySelector(':scope > .slds-grid');
    const rightCol = outerGrid?.querySelector(':scope > .slds-col.slds-no-flex');
    const searchCol = input.closest('.slds-col');
    if (!outerGrid || !rightCol || !searchCol) return;

    outerGrid.querySelector(':scope > .slds-has-flexi-truncate')?.classList.add('slae-qf-header');
    searchCol.classList.add('slae-qf-search-col');
    outerGrid.insertBefore(searchCol, rightCol);
  });
}

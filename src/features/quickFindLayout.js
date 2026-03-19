import { onElement } from '../utils/observer.js';

export function init() {
  onElement('#globalQuickfind', (input) => {
    // Object Manager Home: move the bRight container (which holds Quick Find)
    // to the left so it sits alongside the other filters in bLeft
    const bRight = input.closest('.bRight');
    if (!bRight) return;

    bRight.classList.add('slae-qf-right');
    bRight.parentElement.querySelector('.bLeft')?.classList.add('slae-qf-left');

    // Object Manager detail pages: make the page header grid inline-flex
    // so the Quick Find input sits inline with other header elements
    bRight.closest('.objectManagerVirtualRelatedListCard')
      ?.querySelectorAll('.slds-page-header .slds-grid')
      .forEach(grid => grid.classList.add('slae-qf-grid'));
  });
}

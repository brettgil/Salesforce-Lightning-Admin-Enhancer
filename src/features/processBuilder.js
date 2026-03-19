import { onElement } from '../utils/observer.js';

// --- Drag-to-Resize ---

function initResize(panelContainer) {
  if (panelContainer.querySelector('#slae-pb-handle')) return;

  panelContainer.style.position = 'absolute';
  panelContainer.style.right = '0';
  panelContainer.style.height = 'calc(100% - 150px)';

  const handle = document.createElement('div');
  handle.id = 'slae-pb-handle';
  handle.style.cssText = 'position:absolute; border-left:solid 1px #cfcfcf; border-right:solid 1px #cfcfcf; height:100%; width:8px; cursor:col-resize; z-index:100;';

  const grip = document.createElement('div');
  grip.style.cssText = 'position:absolute; top:46%; border:solid 1px #cfcfcf; width:4px; height:35px; left:1px; background:#cfcfcf;';

  handle.appendChild(grip);
  panelContainer.prepend(handle);

  panelContainer.querySelectorAll('.processuicommonPanel .panelBody, .panelBodyContent, .panelBodyContent table').forEach(el => {
    el.style.width = '100%';
  });

  const container = panelContainer.closest('.wrapper');
  const left = container?.querySelector('.ruleContainer');

  let isResizing = false;

  handle.addEventListener('mousedown', (e) => {
    isResizing = true;
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isResizing || !container) return;
    const offsetRight = container.clientWidth - (e.clientX - container.getBoundingClientRect().left);
    if (left) left.style.right = offsetRight + 'px';
    panelContainer.style.width = offsetRight + 'px';
    panelContainer.querySelectorAll('.processuicommonPanel .panelBody, .panelBodyContent, .panelBodyContent table').forEach(el => {
      el.style.width = '100%';
    });
  });

  document.addEventListener('mouseup', () => {
    isResizing = false;
  });
}

// --- Full API Name in Modals ---

function initModalFix(modal) {
  modal.style.width = 'auto';
  modal.querySelectorAll('.selectedText span').forEach(span => {
    span.style.whiteSpace = 'normal';
    span.style.overflowWrap = 'break-word';
  });
}

// --- Copy Text Buttons ---

function getTextToCopy(label) {
  if (label.classList.contains('processuicommonInputText')) {
    return label.querySelector('input')?.value ?? '';
  }
  if (label.classList.contains('processuicommonInputSelect')) {
    return null; // dropdowns can't be copied
  }
  return label.querySelector('span.tooltip-body')?.textContent ?? '';
}

function addCopyButton(label) {
  if (label.nextElementSibling?.classList.contains('slae-pb-copy-btn')) return;

  const btn = document.createElement('div');
  btn.style.cssText = 'display:block; font-size:xx-small; cursor:pointer; color:grey;';
  btn.textContent = 'Copy Text';

  btn.addEventListener('click', () => {
    const text = getTextToCopy(label);
    if (text === null) return;
    navigator.clipboard.writeText(text);
  });

  label.after(btn);
}

// --- Init ---

export function init() {
  onElement('.wrapper.processuiLayout .panelContainer', initResize);

  onElement(
    '.summaryRenderer.processuicommonSummaryRenderer.processuicommonTraverserModalBody',
    initModalFix
  );

  onElement(
    '.panelContainer .processuicommonActionPanel .panelBodyContent td:nth-child(3) label',
    addCopyButton
  );

  onElement(
    '.panelContainer .processuicommonOutcomePanel .panelBodyContent td:nth-child(5) label',
    addCopyButton
  );
}

export function init() {
  if (window.location.hostname.includes('salesforce-setup.com')) return;

  document.addEventListener('contextmenu', (e) => {
    const el = e.target.closest('[data-target-selection-name]');
    if (!el) return;

    const raw = el.getAttribute('data-target-selection-name');
    // format: "sfdc:RecordField.ObjectName.FieldApiName__c"
    const parts = raw.split('.');
    const apiName = parts.length >= 2 ? parts[parts.length - 1] : null;
    if (!apiName) return;

    const labelContainer = el.querySelector('.test-id__field-label-container');
    if (!labelContainer) return;

    // Toggle off if already shown
    const existing = labelContainer.querySelector('.slae-field-api-name');
    if (existing) {
      existing.previousSibling?.remove(); // remove the <br>
      existing.remove();
      return;
    }

    const br = document.createElement('br');
    const span = document.createElement('span');
    span.className = 'slae-field-api-name';
    span.textContent = apiName;
    span.title = 'Click to copy';

    span.addEventListener('click', (clickEvent) => {
      clickEvent.stopPropagation();
      navigator.clipboard.writeText(apiName);
      span.textContent = 'Copied!';
      setTimeout(() => { span.textContent = apiName; }, 1500);
    });

    labelContainer.append(br, span);
  });
}

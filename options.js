
// Saves options to chrome.storage
//https://developer.chrome.com/extensions/storage#type-StorageArea
function save_options() {
  var minify = document.getElementById('minify').checked;
  var quickFocus = document.getElementById('quickFocus').checked;
  var addEdit = document.getElementById('addEdit').checked;
  chrome.storage.sync.set({
    minify: minify,
    quickFocus: quickFocus,
    addEdit: addEdit
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved. Reload the Salesforce page.';
    setTimeout(function() {
      status.textContent = '';
    }, 2000);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  // Use default values
  chrome.storage.sync.get({
    minify: true,
    quickFocus: true,
    addEdit: false
  }, function(items) {
    document.getElementById('minify').checked = items.minify;
    document.getElementById('quickFocus').checked = items.quickFocus;
    document.getElementById('addEdit').checked = items.addEdit;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',save_options);


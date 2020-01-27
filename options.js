
// Saves options to chrome.storage
//https://developer.chrome.com/extensions/storage#type-StorageArea
function save_options() {
  var quickFocus = document.getElementById('quickFocus').checked;
  var moveQuickFind = document.getElementById('moveQuickFind').checked;
  var minify = document.getElementById('minify').checked;
  var resizePB = document.getElementById('resizePB').checked;
  var navFavs = document.getElementById('navFavs').checked;
  //var addEdit = document.getElementById('addEdit').checked;
  chrome.storage.sync.set({
    quickFocus: quickFocus,
    moveQuickFind: moveQuickFind,
    minify: minify,
    resizePB: resizePB,
    navFavs: navFavs
    //addEdit: addEdit
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
    quickFocus: true,
    moveQuickFind: true,
    minify: true,
    resizePB: true,
    navFavs: true
    //addEdit: false
  }, function(items) {
    document.getElementById('quickFocus').checked = items.quickFocus;
    document.getElementById('moveQuickFind').checked = items.moveQuickFind;
    document.getElementById('minify').checked = items.minify;
    document.getElementById('resizePB').checked = items.resizePB;
    document.getElementById('navFavs').checked = items.navFavs;
    //document.getElementById('addEdit').checked = items.addEdit;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',save_options);
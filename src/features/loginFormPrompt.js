const PROMPT_ID = 'slae-login-form-prompt';
const ANCHOR_TIMEOUT_MS = 5000;

// Where to put the checkbox: under Salesforce's own "Remember Me" checkbox.
function findAnchor() {
  const lwcCheckbox = document.querySelector('identitylogin-checkbox');
  if (lwcCheckbox) return lwcCheckbox;
  return document.getElementById('rememberUn')?.parentElement ?? null;
}

function buildPrompt(key, form, saved, onDismiss) {
  const wrap = document.createElement('div');
  wrap.id = PROMPT_ID;
  wrap.className = 'slae-login-prompt';

  const label = document.createElement('label');
  label.className = 'slae-login-prompt-label';

  const box = document.createElement('input');
  box.type = 'checkbox';
  box.className = 'slae-login-prompt-box';

  const text = document.createElement('span');
  text.textContent = 'Always use this login option';

  label.append(box, text);

  const note = document.createElement('div');
  note.className = 'slae-login-prompt-note';

  const dismiss = document.createElement('button');
  dismiss.type = 'button';
  dismiss.className = 'slae-login-prompt-dismiss';
  dismiss.textContent = "Don't ask again";

  function render() {
    note.textContent = box.checked
      ? `Saved. ${location.hostname} will open the ${form} form from now on. Change it any time in Admin Enhancer settings.`
      : `Tick to open the ${form} form every time you visit ${location.hostname} (Admin Enhancer).`;
    dismiss.hidden = box.checked;
  }

  box.addEventListener('change', () => {
    chrome.storage.sync.set({ [key]: box.checked ? form : saved });
    render();
  });

  dismiss.addEventListener('click', () => {
    chrome.storage.sync.set({ loginFormPrompt: false });
    onDismiss();
  });

  render();
  wrap.append(label, note, dismiss);
  return wrap;
}

/**
 * Offers "Always use this login option" on a login page that was opened on
 * the non-default form (?login=1 or ?email_login=1). Ticking it saves that
 * form as the user's Preferred Login Form for this host.
 *
 * @param {string} key    loginFormTest | loginFormProd
 * @param {'username'|'email'} form  the form this page shows
 * @param {string} saved  the current setting, restored if the box is unticked
 */
export function init(key, form, saved) {
  if (document.getElementById(PROMPT_ID)) return;
  let timedOut = false;

  // The login page renders late and may re-render, so keep the prompt under
  // "Remember Me". If that never appears, float the prompt instead.
  const observer = new MutationObserver(place);
  const prompt = buildPrompt(key, form, saved, () => {
    observer.disconnect();
    prompt.remove();
  });

  function place() {
    const anchor = findAnchor();
    if (anchor) {
      prompt.classList.remove('slae-login-prompt--floating');
      if (prompt.previousElementSibling !== anchor) anchor.after(prompt);
    } else if (timedOut && !prompt.isConnected) {
      prompt.classList.add('slae-login-prompt--floating');
      document.body.append(prompt);
    }
  }

  observer.observe(document.body, { childList: true, subtree: true });
  place();
  setTimeout(() => { timedOut = true; place(); }, ANCHOR_TIMEOUT_MS);
}

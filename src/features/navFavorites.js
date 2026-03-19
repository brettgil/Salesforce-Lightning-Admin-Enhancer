import { onElement } from '../utils/observer.js';

function buildFavorites(linksJson) {
  let links;
  try {
    links = JSON.parse(linksJson);
  } catch {
    console.warn('[SLAE] navFavorites: invalid JSON in links setting');
    return null;
  }

  const wrapper = document.createElement('div');
  wrapper.id = 'slae-nav-favs';
  wrapper.className = 'slae-nav-favs';

  const heading = document.createElement('h4');
  heading.className = 'slae-nav-favs-heading slds-text-title_caps';
  heading.textContent = 'Favorites';

  const list = document.createElement('ul');
  list.className = 'slae-nav-favs-list';

  for (const [label, url] of Object.entries(links)) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = url;
    a.className = 'slae-nav-favs-link';
    a.textContent = label;
    li.appendChild(a);
    list.appendChild(li);
  }

  wrapper.append(heading, list);
  return wrapper;
}

export function init(linksJson) {
  onElement('.tree-filter.onesetupNavTreeFilter', (filter) => {
    if (document.getElementById('slae-nav-favs')) return;

    const favs = buildFavorites(linksJson);
    if (favs) filter.before(favs);
  });
}

import { placeBesideSearch } from './headerFit.js';

// Shared container left of the global search box. Our search-adjacent widgets (Launch by ID,
// User Search) live here instead of inside Salesforce's search input, whose internals keep
// changing (Ask button, Agentforce Coworker search bar). CSS `order` keeps them in a stable
// sequence regardless of which feature loads first. It is a sibling of the search item in the
// header's flex row so the header makes room for it (see headerFit.js).
const TOOLS_ID = 'slae-search-tools';

export function getSearchTools(searchItem) {
  let tools = document.getElementById(TOOLS_ID);
  if (!tools) {
    tools = document.createElement('div');
    tools.id = TOOLS_ID;
    tools.className = 'slae-search-tools';
    placeBesideSearch(tools, searchItem, 'before');
  }
  return tools;
}

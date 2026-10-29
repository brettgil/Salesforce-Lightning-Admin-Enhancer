// Shared container left of the global search box. Our search-adjacent widgets (Launch by ID,
// User Search) live here instead of inside Salesforce's search input, whose internals keep
// changing (Ask button, Agentforce Coworker search bar). CSS `order` keeps them in a stable
// sequence regardless of which feature loads first.
const TOOLS_ID = 'slae-search-tools';

export function getSearchTools(searchItem) {
  let tools = searchItem.querySelector(`#${TOOLS_ID}`);
  if (!tools) {
    tools = document.createElement('div');
    tools.id = TOOLS_ID;
    tools.className = 'slae-search-tools';
    searchItem.style.position = 'relative';
    searchItem.prepend(tools);
  }
  return tools;
}

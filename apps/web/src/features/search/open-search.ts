/** Opens the search dialog from anywhere (the Ask dock's "Search the site"), optionally with a query typed in. */
export const SEARCH_OPEN_EVENT = "v1c:search-open";

export interface SearchOpenDetail {
  query?: string;
}

export function openSearch(query?: string) {
  window.dispatchEvent(new CustomEvent<SearchOpenDetail>(SEARCH_OPEN_EVENT, { detail: query === undefined ? {} : { query } }));
}

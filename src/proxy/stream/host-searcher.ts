/**
 * Searcher for Host HTTP Header
 */
export const hostSearcher = (chunk: string) => {
  const res = new RegExp("^Host: ([a-zA-Z0-9.]+)$", "m").exec(chunk);

  return res !== null ? res[1] : null;
};

/**
 * Searcher for Host HTTP Header
 */
export const hostSearcher = (chunk: Uint8Array) => {
  const chunkStr = Buffer.from(chunk).toString();

  const res = new RegExp("^Host: ([a-zA-Z0-9.]+)$", "m").exec(chunkStr);

  return res !== null ? res[1] : null;
};

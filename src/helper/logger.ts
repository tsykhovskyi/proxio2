export function log(...args) {
  console.log(`[${new Date().toLocaleString()}]`, ...args);
}

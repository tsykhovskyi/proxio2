export function log(...args) {
  const dt = new Date();
  const timeStr = `[${dt.getHours().toString().padEnd(2, "0")}:${dt
    .getMinutes()
    .toString()
    .padEnd(2, "0")}:${dt.getSeconds().toString().padEnd(2, "0")}.${dt
    .getMilliseconds()
    .toString()
    .padEnd(3, "0")}]`;

  console.log(timeStr, ...args);
}

export function logger(namespace: string) {
  return (...args) => {
    log(`[${namespace}]`.padEnd(12), ...args);
  };
}

export class Renderer {
  private BYTES_PER_KB = 1024;
  private BYTES_PER_MB = 1024 * 1024;
  private BYTES_PER_GB = 1024 * 1024 * 1024;

  /**
   * Fill string into cell size.
   * Fill empty positions with spaces. last position will always be a space
   */
  public limitedString(str: string, length: number): string {
    return str.length < length
      ? str.padEnd(length)
      : str.substring(0, length - 4) + "... ";
  }

  public readableBytes(bytes: number): string {
    const toReadable = (v: number, units: string) => `${v.toFixed(2)} ${units}`;
    if (bytes > this.BYTES_PER_GB) {
      return toReadable(bytes / this.BYTES_PER_GB, "GB");
    }
    if (bytes > this.BYTES_PER_MB) {
      return toReadable(bytes / this.BYTES_PER_MB, "MB");
    }
    if (bytes > this.BYTES_PER_KB) {
      return toReadable(bytes / this.BYTES_PER_KB, "KB");
    }

    return `${bytes} b`;
  }

  public readableTime(ms: number): string {
    if (ms > 1000) {
      return `${(ms / 1000).toFixed(2)} s`;
    }
    return `${ms} ms`;
  }
}

import { Duplex } from 'stream';
import { Buffer } from 'buffer';

type BufferSearcher<T> = (chunk: Uint8Array) => T | null;

/**
 * Duplex proxy for stream origin with reread logic.
 *
 * Writable stream is a proxy to origin.
 * Consumes readable stream until target will be found or stream ended. Then target promise is resolved
 * with result or null if target was not found. Emits repeated reading from origin after target resolved.
 */
export class DuplexReadableSearcher<T> extends Duplex {
  public readonly target: Promise<T | null>;

  private targetResolve: (result: T | null) => void = () => {};
  private buffer: Buffer[] = [];
  private targetFulfilled = false;

  constructor(private origin: Duplex, private readStreamChecker: BufferSearcher<T>) {
    super();
    this.target = new Promise<T | null>(resolve => this.targetResolve = resolve);
    this.target.then(() => this.targetFulfilled = true);
  }

  _construct(callback: (error?: (Error | null)) => void) {
    this.origin.on('data', (chunk) => {
      if(!this.targetFulfilled) {
        const targetResult = this.readStreamChecker(chunk);
        if (targetResult !== null) {
          this.targetResolve(targetResult);
        }
      }

      this.buffer.push(chunk);
      this.flushReadable();
    });
    this.origin.on('end', () => {
      this.targetResolve(null);
      this.flushReadable();
    });
    callback();
  }

  _write(chunk: any, encoding?: BufferEncoding, cb?: (error: (Error | null | undefined)) => void): boolean {
    return this.origin.write(chunk, encoding, cb)
  }

  _final(callback: (error?: (Error | null)) => void) {
    this.origin.end();
    callback();
  }

  _read() {
    this.flushReadable();
  }

  private flushReadable() {
    if (!this.targetFulfilled) {
      return;
    }

    while(this.buffer.length > 0) {
      const chunk = this.buffer.shift()
      this.push(chunk);
    }

    if (this.origin.readableEnded) {
      this.push(null);
    }
  }
}

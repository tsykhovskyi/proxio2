import { Duplex } from 'stream';
import { Buffer } from 'buffer';

export class DuplexReadableSearcher extends Duplex {
  buffer: Buffer[] = [];
  allow = true;

  constructor(private origin: Duplex, private readStreamChecker: (chunk) => string | null) {
    super();
  }

  _construct(callback: (error?: (Error | null)) => void) {
    this.origin.on('data', (chunk) => {
      console.log('read', Buffer.from(chunk).toString());
      this.buffer.push(chunk);
      this.check();
    });
    this.origin.on('end', () => {
      this.check();
    });
    callback();
  }


  _write(chunk: any, encoding?: BufferEncoding, cb?: (error: (Error | null | undefined)) => void): boolean {
    const res = this.origin.write(chunk, encoding, cb)
    console.log('_write', res);
    return res;
  }

  _final(callback: (error?: (Error | null)) => void) {
    this.origin.end();
    callback();
  }

  _read() {
    this.check();
  }

  private check() {
    if (!this.allow) {
      return;
    }

    while(this.buffer.length > 0) {
      const chunk = this.buffer.shift()
      console.log('_pushed');
      this.push(chunk);
    }

    if (this.origin.readableEnded) {
      console.log('_pushed null');
      this.push(null);
    }
  }
}

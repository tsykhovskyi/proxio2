import { Readable, Writable, Transform, TransformCallback } from 'stream';
import { Buffer } from 'buffer';

const records = [
  'test1',
  'test2',
  'test3',
  'Host: localhost',
  'test4',
  'test5'
];

const source = new class extends Readable {
  i: number = -1;

  constructor() {
    super();
  }

  _read(size: number) {
    if (++this.i < records.length) {
      this.push(records[this.i]);
      return
    }
    this.push(null);
  }
};

/**
 * Search for specific chunk in stream. Return stream duplicate
 */
function defineStreamCondition(origin: Readable, conditionCb: (chunk: Buffer) => string | null): Promise<string | null> {
  return new Promise((resolve, reject) => {
    // Pause pipe in case of reading flow
    origin.pause();
    const buffer: Buffer[] = [];
    const readableHandler = () => {
      const chunk = origin.read();
      buffer.push(chunk);
      if (chunk === null) {
        return resetOrigin(null);
      }
      return resetOrigin(conditionCb(chunk));
    };
    const resetOrigin = (conditionResult: string | null) => {
      // Unshift chunks that were read back to stream buffer.
      while (buffer.length > 0) {
        origin.unshift(buffer.pop());
      }
      // "readable" listener should be removed to open stream for reading flow activation
      origin.removeListener('readable', readableHandler);
      resolve(conditionResult);
    };

    origin.on('readable', readableHandler);
  });
}

export function defineStreamHost(origin: Readable) {
  return defineStreamCondition(origin, chunk => {
    const payload = Buffer.from(chunk).toString();
    return validateHttpAndExtractHost(payload);
  });
}

function validateHttpAndExtractHost(payload: string): string | null {
  const res = new RegExp('^Host: ([a-zA-Z0-9.]+)$', 'm').exec(payload);
  if (res !== null) {
    return res[1];
  }

  return null;
}


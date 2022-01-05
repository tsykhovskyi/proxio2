import { Readable, Duplex } from 'stream';
import { Buffer } from 'buffer';

/**
 * Search for specific chunk in stream. Return original stream.
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

    const res = new RegExp('^Host: ([a-zA-Z0-9.]+)$', 'm').exec(payload);
    if (res !== null) {
      return res[1];
    }

    return null;
  });
}

export const responseDuplexHandlers = {
  mute: () => new Duplex(),
  tunnelNotFound: (attemptedTunnelName: string) => new Duplex({
    read(size: number) {
      this.push(`HTTP/1.1 404 Not Found
Host: localhost
Connection: close
Content-type: text/html; charset=UTF-8

<h1>Tunnel not found</h1>
<span>Tunnel for host <b style="color: darkred">${attemptedTunnelName}</b> not found.</span>      
      `);
      this.push(null);
    },
    write(chunk: any, encoding: BufferEncoding, callback: (error?: (Error | null)) => void) {
    }
  })
}

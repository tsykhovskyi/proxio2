import { Duplex } from 'stream';
import { DuplexReadableSearcher } from './stream/duplex-readable-searcher';

export function defineStreamHost(origin: Duplex): Promise<{ host: string, stream: DuplexReadableSearcher<string> }> {
  return new Promise(resolve => resolve({host: 'localhost', stream: new DuplexReadableSearcher(origin, () => '')}))
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

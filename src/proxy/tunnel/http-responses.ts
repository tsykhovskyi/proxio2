import { Duplex } from "stream";

export function emptyResponse() {
  return httpResponseStream();
}

export function httpProxyNotFoundResponse(expectedTunnelName: string) {
  return httpResponseStream(`
HTTP/1.1 404 Not Found
Host: ${expectedTunnelName}
Connection: close
Content-type: text/html; charset=UTF-8

<h1>Tunnel not found</h1>
<p>Tunnel for host <b style="color: darkred">${expectedTunnelName}</b> not found.</p>
  `);
}

export function remoteHostIsUnreachableResponse(
  expectedTunnelName: string,
  err: Error
) {
  return httpResponseStream(`
HTTP/1.1 504 Bad Gateway
Host: ${expectedTunnelName}
Connection: close
Content-type: text/html; charset=UTF-8

<h1>Tunnel destination is unreachable</h1>
<p>Unable to reach destination service.</p>
<p style="color: darkred">${err}</p>
  `);
}

function httpResponseStream(response?: string): Duplex {
  return new Duplex({
    read() {
      if (response !== undefined) {
        this.push(response.trim());
      }
      this.push(null);
    },
    write(
      chunk: any,
      encoding: BufferEncoding,
      callback: (error?: Error | null) => void
    ) {
      return null;
    },
  });
}

export function mutualPipe(duplex1: Duplex, duplex2: Duplex) {
  duplex1.pipe(duplex2).pipe(duplex1);
}

import { TunnelInterface } from '../ssh/server';
import { defineStreamHost, responseDuplexHandlers } from './stream';
import { Server, createServer } from 'net';
import { log } from '../helper/logger';
import { DuplexReadableSearcher } from './stream/duplex-readable-searcher';
import { hostSearcher } from './stream/host-searcher';

export class ProxyServer {
  private sshTunnels: TunnelInterface[] = [];
  private server: Server;

  constructor() {
    this.server = createServer();
  }

  addTunnel(tunnel: TunnelInterface) {
    this.sshTunnels.push(tunnel);
  }

  run() {
    let counter = 0;
    this.server.on('connection', async socket => {
      if (socket.remoteAddress === undefined || socket.remotePort === undefined) {
        return socket.end();
      }
      socket[Symbol.for('socket')] = counter++;
      log('socket opened', socket[Symbol.for('socket')]);

      const searchableSocket = new DuplexReadableSearcher(socket, hostSearcher);
      const host = await searchableSocket.target;
      console.log('Host is found: ', host);

      if (host === null) {
        socket.pipe(responseDuplexHandlers.mute()).pipe(socket);
        return;
      }

      const targetTunnel = this.sshTunnels.find(tunnel => tunnel.bindAddr === host);
      if (targetTunnel === undefined) {
        socket.pipe(responseDuplexHandlers.tunnelNotFound(host)).pipe(socket);
        return;
      }

      log('forwarding traffic...', socket[Symbol.for('socket')])
      targetTunnel.sshConnection.forwardOut(
        targetTunnel.bindAddr,
        targetTunnel.bindPort,
        socket.remoteAddress ?? '',
        socket.remotePort ?? 0,
        (err, sshChannel) => {
          if (err) {
            searchableSocket.end();
            return console.error('not working: ' + err);
          }
          searchableSocket.pipe(sshChannel).pipe(searchableSocket);
          // socket.pipe(consoleRequest, {end: false});
          // upstream.pipe(consoleResponse, {end: false});
        });
    })
    this.server.listen(80);
  }

  stop() {
    this.server.close();
  }
}
//
// function ConsoleStdout(name: string) {
//   return new Stream.Writable({
//     write: (chunk: any, encoding: BufferEncoding, next: (error?: Error | null) => void) => {
//       process.stdout.write("\n" + name + "\n");
//       process.stdout.write(chunk);
//       next();
//     }
//   });
//
// }

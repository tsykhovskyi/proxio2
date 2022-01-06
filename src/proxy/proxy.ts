import { TunnelInterface } from '../ssh/server';
import { defineStreamHost, responseDuplexHandlers } from './stream';
import { Server, createServer } from 'net';
import { log } from '../helper/logger';

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
    this.server.on('connection', socket => {
      if (socket.remoteAddress === undefined || socket.remotePort === undefined) {
        return socket.end();
      }
      socket[Symbol.for('socket')] = counter++;
      log('socket opened', socket[Symbol.for('socket')])
      defineStreamHost(socket).then(({host, stream}) => {
        if (!socket.readable) {
          return;
        }

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
              stream.end();
              return console.error('not working: ' + err);
            }
            stream.pipe(sshChannel).pipe(stream);
            // socket.resume();
            // socket.pipe(consoleRequest, {end: false});
            // upstream.pipe(consoleResponse, {end: false});
          });
      })
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

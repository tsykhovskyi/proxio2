import http from 'http';
import Stream from 'stream';
import { TunnelInterface } from './server';
import { AddressInfo } from 'net';
import net from 'net';
import zlib from 'zlib';
import { defineStreamHost } from './stream';


export function RunHttpProxy(tunnels: TunnelInterface[]) {
  const consoleRequest = ConsoleStdout('Request:');
  const consoleResponse = ConsoleStdout('Response:');

  const server = net.createServer();
  server.on('connection', socket => {
    if (socket.remoteAddress === undefined || socket.remotePort === undefined) {
      return socket.end();
    }

    defineStreamHost(socket).then((host) => {
      console.log('\n\nHost defined: ' + host);
      const t = tunnels[0];

      t.sshConnection.forwardOut(
        t.bindAddr,
        t.bindPort,
        socket.remoteAddress ?? '',
        socket.remotePort ?? 0,
        (err, upstream) => {
          if (err) {
            socket.end();
            return console.error('not working: ' + err);
          }
          socket.pipe(upstream).pipe(socket);
          socket.resume();
          // socket.pipe(consoleRequest, {end: false});
          // upstream.pipe(consoleResponse, {end: false});
        });
    })
  })
  server.listen(80);
}


function ConsoleStdout(name: string) {
  return new Stream.Writable({
    write: (chunk: any, encoding: BufferEncoding, next: (error?: Error | null) => void) => {
      process.stdout.write("\n" + name + "\n");
      process.stdout.write(chunk);
      next();
    }
  });

}

import ssh2, { Connection } from 'ssh2';
import path from 'path';
import { readFileSync } from 'fs';


export interface TunnelInterface {
  /**
   * address requested by user as a proxy
   */
  bindAddr: string;
  /**
   * proxy port requested by user
   */
  bindPort: number;

  /**
   *
   */
  sshConnection: Connection;
}


export function RunSshServer() {
  const tunnels: TunnelInterface[] = [];

  const server = new ssh2.Server({
    hostKeys: [readFileSync(path.resolve(__dirname + '/../assets/server_key'))]
  }, (client) => {
    console.log('Client connected!');

    client
      .on('authentication', (ctx) => {
        ctx.accept();
      })
      .on('ready', () => {
        console.log('Client authenticated!');
      })
      .on('session', (accept, reject) => {
        const session = accept();

        session.on('shell', (accept, reject) => {
          const chan = accept();
          chan.on('data', (chunk) => {
            const buf = Buffer.from(chunk);
            chan.stdout.write('answerw: ' + buf.toString());
          })
          chan.on('end', () => {
            console.log('end');
          })
          chan.on('exit', (code) => {
            console.log('Exit with', code);
          })
          chan.write('AAAAAAAAAa\n')
        })

        session.on('pty', (accept, reject, info) => {
          reject?.();
        })

        session.on('close', () => {
          return;
        })
      })
      .on('end', () => {
        console.log('Client disconnected');
      });

    client.on('request', (accept, reject, name, info) => {
      if (accept === undefined || reject === undefined) {
        throw new Error();
      }

      if (name === 'tcpip-forward') {
          if (info.bindAddr == undefined || info.bindPort == undefined) {
            reject();
            return;
          }

          tunnels.push({bindAddr: info.bindAddr, bindPort: info.bindPort, sshConnection: client});

          accept();
          return

      //   net.createServer(socket => {
      //     client.forwardOut(
      //       info.bindAddr,
      //       info.bindPort,
      //       socket.remoteAddress ?? '',
      //       socket.remotePort ?? 0,
      //       (err, upstream) => {
      //         if (err) {
      //           socket.end();
      //           return console.error('not working: ' + err);
      //         }
      //         upstream.pipe(process.stdout);
      //         upstream.pipe(socket).pipe(upstream);
      //       }
      //     )
      //   }).listen(info.bindPort);
      //
      //   accept();
      } else {
        reject();
      }
    });

    client.on('error', err => {
      console.error(err);
      client.end();
    });

    client.on('openssh.streamlocal', (accept, reject, info) => {
      console.log()
    })

    client.on('tcpip', (accept, reject, info) => {
      console.log('TCP/IP');
    });

  });

  server.listen(2233, '127.0.0.1', function () {
    console.log('Listening on port ' + server.address().port);
  });

  return tunnels;
}



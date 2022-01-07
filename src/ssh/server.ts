import { Server } from "ssh2";
import path from "path";
import { readFileSync } from "fs";
import EventEmitter from "events";
import { TunnelInterface } from "../proxy/tunnel-storage";

export interface SshServerInterface {
  run(): void;

  stop(): void;

  on(
    event: "tunnel-requested",
    listener: (
      tunnel: TunnelInterface,
      accept: () => void,
      reject: () => void
    ) => void
  ): this;
}

export class SshServer extends EventEmitter implements SshServerInterface {
  private server: Server;

  constructor() {
    super();
    this.server = new Server({
      hostKeys: [readFileSync(path.join(__dirname, "../../assets/server_key"))],
    });
  }

  run() {
    this.server.on("connection", (client) => {
      console.log("Client connected!");

      client
        .on("authentication", (ctx) => {
          ctx.accept();
        })
        .on("ready", () => {
          console.log("Client authenticated!");
        })
        .on("session", (accept, reject) => {
          const session = accept();

          session.on("shell", (accept, reject) => {
            const chan = accept();
            chan.on("data", (chunk) => {
              const buf = Buffer.from(chunk);
              chan.stdout.write("answerw: " + buf.toString());
            });
            chan.on("end", () => {
              console.log("end");
            });
            chan.on("exit", (code) => {
              console.log("Exit with", code);
            });
            chan.write("AAAAAAAAAa\n");
          });

          session.on("pty", (accept, reject, info) => {
            reject?.();
          });

          session.on("close", () => {
            return;
          });
        })
        .on("end", () => {
          console.log("Client disconnected");
        });

      client.on("request", (accept, reject, name, info) => {
        if (accept === undefined || reject === undefined) {
          throw new Error();
        }

        if (name === "tcpip-forward") {
          if (info.bindAddr == undefined || info.bindPort == undefined) {
            reject();
            return;
          }

          // this.tunnels.push({bindAddr: info.bindAddr, bindPort: info.bindPort, sshConnection: client});
          // this.emit('tunnel-opened', {bindAddr: info.bindAddr, bindPort: info.bindPort, sshConnection: client});
          this.emit(
            "tunnel-requested",
            {
              bindAddr: info.bindAddr,
              bindPort: info.bindPort,
              sshConnection: client,
            },
            () => accept(),
            () => reject()
          );
        } else {
          reject();
        }
      });

      // client.on('error', err => {
      //   console.error(err);
      //   client.end();
      // });
      //
      // client.on('openssh.streamlocal', (accept, reject, info) => {
      //   console.log();
      // })
      //
      // client.on('tcpip', (accept, reject, info) => {
      //   console.log('TCP/IP');
      // });
    });

    this.server.listen(2233, "127.0.0.1", () => {
      console.log("Listening on port " + this.server.address().port);
    });
  }

  stop() {
    this.server.close();
  }
}

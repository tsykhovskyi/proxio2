import { Server, Connection } from "ssh2";
import path from "path";
import { readFileSync } from "fs";
import EventEmitter from "events";
import { SshTunnel } from "./tunnel";
import { TunnelRequest } from "../proxy";
import { Tunnel } from "../proxy/tunnel";

export interface SshServerInterface {
  run(): void;

  stop(): void;

  on(
    event: "tunnel-requested",
    listener: (request: TunnelRequest) => void
  ): this;

  on(event: "tunnel-opened", listener: (tunnel: Tunnel) => void): this;
}

export class SshServer extends EventEmitter implements SshServerInterface {
  private server: Server;
  private connections = new Map<Connection, SshTunnel>();

  constructor() {
    super();
    this.server = new Server({
      hostKeys: [
        readFileSync(path.join(__dirname, "../../assets/ssh/server_key")),
      ],
    });
  }

  run() {
    this.server.on("connection", (connection) => {
      console.log("Client connected!");

      connection
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
            this.tunnelCmd(connection, (tunnel) => tunnel.setChannel(chan));
            // chan.on("data", (chunk) => {
            //   const buf = Buffer.from(chunk);
            //   chan.stdout.write("answerw: " + buf.toString());
            // });
            // chan.on("end", () => {
            //   console.log("end");
            // });
            // chan.on("exit", (code) => {
            //   console.log("Exit with", code);
            // });
            // chan.write("AAAAAAAAAa\n");
          });

          session.on("pty", (accept, reject, info) => {
            reject?.();
          });

          session.on("close", () => {
            return;
          });
        });

      connection.on("request", (accept, reject, name, info) => {
        if (accept === undefined || reject === undefined) {
          throw new Error();
        }

        if (name === "tcpip-forward") {
          if (info.bindAddr == undefined || info.bindPort == undefined) {
            reject();
            return;
          }

          this.emit("tunnel-requested", <TunnelRequest>{
            bindAddr: info.bindAddr,
            bindPort: info.bindPort,
            accept: () => {
              accept();
              const tunnel = new SshTunnel(
                info.bindAddr,
                info.bindPort,
                connection
              );
              this.connections.set(connection, tunnel);

              this.emit("tunnel-opened", tunnel);
            },
            reject: reject.bind(this),
          });
        } else {
          reject();
        }
      });

      connection.on("error", (err: Error) =>
        this.tunnelCmd(connection, (tunnel) => {
          this.connections.delete(connection);
          tunnel.close("An error occurred. " + err.message);
        })
      );
      // connection.on("close", () => this.tunnelCmd(connection, (tunnel) =>
      //   tunnel.close("The client socket was closed.")
      // ));

      connection.on("end", () =>
        this.tunnelCmd(connection, (tunnel) => {
          this.connections.delete(connection);
          tunnel.close("The client socket disconnected");
        })
      );
    });

    this.server.listen(2233, "127.0.0.1", () => {
      console.log("Listening on port " + this.server.address().port);
    });
  }

  stop() {
    this.server.close();
  }

  private tunnelCmd(connection: Connection, cmd: (tunnel: SshTunnel) => void) {
    const tunnel = this.connections.get(connection);
    if (!tunnel) {
      return;
    }
    cmd(tunnel);
  }
}

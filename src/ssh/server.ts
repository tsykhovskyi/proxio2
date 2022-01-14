import { Connection, Server } from "ssh2";
import { readFileSync } from "fs";
import EventEmitter from "events";
import { HttpSshTunnel, SshTunnel, TcpSshTunnel } from "./tunnel";
import { config } from "../config";
import { Tunnel } from "../proxy/contracts/tunnel";

export interface TunnelRequest {
  bindAddr: string;
  bindPort: number;
  accept: (address?: string, port?: number) => void;
  reject: () => void;
}

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
      hostKeys: [readFileSync(config.sshPrivateKeyPath)],
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
            accept: (address?: string, port?: number) => {
              accept();
              let tunnel: SshTunnel;
              if (address) {
                tunnel = new HttpSshTunnel(
                  address,
                  config.httpPort,
                  connection
                );
              } else if (port) {
                tunnel = new TcpSshTunnel("127.0.0.1", port, connection);
              } else {
                throw new Error("Undefined tunnel type");
              }
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

    this.server.listen(config.sshPort, "127.0.0.1", () => {
      console.log("Listening on port " + config.sshPort);
    });
  }

  stop() {
    this.server.close(() => console.log("SSH server is closed"));
  }

  private tunnelCmd(connection: Connection, cmd: (tunnel: SshTunnel) => void) {
    const tunnel = this.connections.get(connection);
    if (!tunnel) {
      return;
    }
    cmd(tunnel);
  }
}

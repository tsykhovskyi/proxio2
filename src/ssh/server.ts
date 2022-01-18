import { Server } from "ssh2";
import { readFileSync } from "fs";
import EventEmitter from "events";
import { SshTunnel } from "./tunnel";
import { config } from "../config";
import { Tunnel } from "../proxy/contracts/tunnel";
import { ChannelFactory } from "./pty/channel-factory";
import { createTunnel } from "./tunnel-factory";

export interface TunnelRequest {
  bindAddr: string;
  bindPort: number;
  username: string;
  accept: (address: string, port: number) => void;
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

  constructor() {
    super();
    this.server = new Server({
      hostKeys: [readFileSync(config.sshPrivateKeyPath)],
    });
  }

  run() {
    this.server.on("connection", (connection) => {
      console.log("Client connected!");
      let username = "";
      let tunnel: SshTunnel | null = null;
      const ptyChannelFactory = new ChannelFactory();
      ptyChannelFactory.result.then((pty) => {
        pty.init();
        pty.on("close", () => connection.end());
      });

      connection
        .on("authentication", (ctx) => {
          username = ctx.username;
          ctx.accept();
        })
        .on("session", (accept, reject) => {
          const session = accept();

          session
            .on("shell", (accept, reject) => {
              const channel = accept();
              ptyChannelFactory.setChannel(channel);
            })
            .on("pty", (accept, reject, info) => {
              accept?.();
              ptyChannelFactory.setPtyInfo(info);
            })
            .on("window-change", (accept, reject, info) => {
              accept?.();
              ptyChannelFactory.result.then((pty) => {
                pty.windowResize(info);
              });
            });

          session.on("close", () => {
            console.log("session closed");
            return;
          });
        })
        .on("request", (accept, reject, name, info) => {
          if (accept === undefined || reject === undefined) {
            return;
          }

          if (name === "tcpip-forward") {
            if (info.bindAddr == undefined || info.bindPort == undefined) {
              reject();
              return;
            }

            this.emit("tunnel-requested", <TunnelRequest>{
              bindAddr: info.bindAddr,
              bindPort: info.bindPort,
              username,
              accept: (address: string, port: number) => {
                accept(port ?? 0);
                tunnel = createTunnel(connection, address, info.bindAddr, port);
                ptyChannelFactory.setTunnel(tunnel);
                this.emit("tunnel-opened", tunnel);
              },
              reject: () => {
                reject();
                connection.end();
              },
            });
          } else {
            reject();
          }
        })
        .on("error", (err: Error) =>
          tunnel?.close("An error occurred. " + err.message)
        )
        .on("end", () => {
          tunnel?.close("The client socket disconnected");
        });
    });

    this.server.listen(config.sshPort, () => {
      console.log("Listening on port " + config.sshPort);
    });
  }

  stop() {
    this.server.close(() => console.log("SSH server is closed"));
  }
}

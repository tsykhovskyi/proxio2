import { Server } from "ssh2";
import { readFileSync } from "fs";
import EventEmitter from "events";
import { HttpSshTunnel, SshTunnel, TcpSshTunnel } from "./tunnel";
import { config } from "../config";
import { Tunnel } from "../proxy/contracts/tunnel";
import { ChannelFactory } from "./pty/channel-factory";

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

  constructor() {
    super();
    this.server = new Server({
      hostKeys: [readFileSync(config.sshPrivateKeyPath)],
    });
  }

  run() {
    this.server.on("connection", (connection) => {
      console.log("Client connected!");
      let tunnel: SshTunnel | null = null;

      const ptyChannelFactory = new ChannelFactory();
      ptyChannelFactory.getPtyChannel().then((pty) => pty.init());

      connection
        .on("authentication", (ctx) => {
          ctx.accept();
        })
        .on("ready", () => {
          console.log("Client authenticated!");
        })
        .on("session", (accept, reject) => {
          const session = accept();

          session.on("signal", (accept1, reject1, info) => {
            console.log("SIGNAL", info);
          });

          session.on("shell", (accept, reject) => {
            const chan = accept();
            ptyChannelFactory.setChannel(chan);
          });

          session
            .on("pty", (accept, reject, info) => {
              accept?.();
              ptyChannelFactory.setPtyInfo(info);
            })
            .on("window-change", (accept, reject, info) => {
              accept?.();
              console.log("updated size", info);
              ptyChannelFactory.getPtyChannel().then((pty) => {
                pty.windowResize(info);
              });
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

              ptyChannelFactory.setTunnel(tunnel);
              this.emit("tunnel-opened", tunnel);
            },
            reject: reject.bind(this),
          });
        } else {
          reject();
        }
      });

      connection.on("error", (err: Error) =>
        tunnel?.close("An error occurred. " + err.message)
      );
      connection.on("end", () =>
        tunnel?.close("The client socket disconnected")
      );
    });

    this.server.listen(config.sshPort, () => {
      console.log("Listening on port " + config.sshPort);
    });
  }

  stop() {
    this.server.close(() => console.log("SSH server is closed"));
  }
}

import { emptyResponse, httpProxyNotFoundResponse, mutualPipe } from "./stream";
import { createServer, Server, Socket } from "net";
import { hostSearcher } from "./stream/host-searcher";
import { readablePreProcess } from "./stream/readable-pre-process";
import { Tunnel } from "./tunnel";
import * as tls from "tls";
import * as fs from "fs";
import path from "path";
import EventEmitter from "events";

export declare interface ServersController {
  on(
    event: "http-connection",
    listener: (host: string, socket: Socket) => void
  );
  on(event: "tcp-connection", listener: (port: number, socket: Socket) => void);
}

export class ServersController extends EventEmitter {
  private servers = new Map<number, Server>();

  addTunnel(tunnel: Tunnel): void {
    // tunnel.on("tcp-forward-error", (err) => {
    //   console.log("error forwarding...", err);
    // });
    tunnel.on("close", () => {
      if (!tunnel.http) {
        this.stopTcpServer(tunnel.port);
      }
    });

    if (!tunnel.http) {
      this.runTcpServer(tunnel.port);
    }
  }

  run() {
    this.runHttpServer();
  }

  stop() {
    for (const server of this.servers.values()) {
      server.close();
    }
  }

  private async onConnection(socket: Socket) {
    socket.on("error", (err) => {
      console.log(err.stack);
    });

    const { remoteAddress, remotePort } = socket;
    if (remoteAddress == undefined || remotePort == undefined) {
      return socket.end();
    }

    const host = await readablePreProcess(socket, hostSearcher);
    if (host === null) {
      mutualPipe(socket, emptyResponse());
      return;
    }

    this.emit("http-connection", host, socket);

    // const targetTunnel = this.tunnelStorage.find(host, 80);
    // if (targetTunnel === null) {
    //   mutualPipe(socket, httpProxyNotFoundResponse(host));
    //   return;
    // }
    //
    // targetTunnel.serve(socket);
  }

  private runHttpServer() {
    const httpServer = createServer();
    httpServer.on("connection", this.onConnection.bind(this));
    httpServer.listen(80, () => console.log("Proxy port 80 is listening..."));
    this.servers.set(80, httpServer);

    const tlsServer = tls.createServer(
      {
        key: fs.readFileSync(
          path.join(__dirname, "../../assets/tls/server-key.pem")
        ),
        cert: fs.readFileSync(
          path.join(__dirname, "../../assets/tls/server-cert.pem")
        ),
      },
      this.onConnection.bind(this)
    );
    tlsServer.listen(443, () => console.log("Proxy port 443 is listening..."));
    this.servers.set(443, tlsServer);
  }

  private runTcpServer(bindPort: number) {
    if (this.servers.has(bindPort)) {
      return;
    }

    const tcpServer = createServer();
    tcpServer.on("connection", (socket) => {
      const { remoteAddress, remotePort } = socket;
      if (remoteAddress == undefined || remotePort == undefined) {
        return socket.end();
      }
      this.emit("tcp-connection", bindPort, socket);

      // const targetTunnel = this.tunnelStorage.find(null, bindPort);
      // if (targetTunnel === null) {
      //   return socket.end();
      // }

      // targetTunnel.serve(socket);
    });

    this.servers.set(bindPort, tcpServer);
    tcpServer.listen(bindPort, () =>
      console.log(`Proxy port ${bindPort} is listening...`)
    );
  }

  private stopTcpServer(bindPort: number) {
    const server = this.servers.get(bindPort);
    if (server === undefined) {
      return;
    }
    server.close(() => console.log(`Proxy port ${bindPort} is released`));
    this.servers.delete(bindPort);
  }
}

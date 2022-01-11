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
  private httpAddresses = new Set<string>();
  private servers = new Map<number, Server>();

  addTunnel(tunnel: Tunnel): void {
    if (tunnel.http) {
      this.httpAddresses.add(tunnel.address);
    } else {
      this.runTcpServer(tunnel.port);
    }
  }

  deleteTunnel(tunnel: Tunnel) {
    if (tunnel.http) {
      this.httpAddresses.delete(tunnel.address);
    } else {
      this.stopTcpServer(tunnel.port);
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
      return mutualPipe(socket, emptyResponse());
    }

    if (host === "monitor.localhost") {
      // Forward to express app socket
      const forwarder = new Socket();
      forwarder.connect(8080, "localhost", () => {
        socket.pipe(forwarder).pipe(socket);
      });
      return;
    }

    if (!this.httpAddresses.has(host)) {
      return mutualPipe(socket, httpProxyNotFoundResponse(host));
    }

    this.emit("http-connection", host, socket);
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
      if (!this.servers.has(remotePort)) {
        socket.end();
      }
      this.emit("tcp-connection", bindPort, socket);
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

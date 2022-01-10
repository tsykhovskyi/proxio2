import { emptyResponse, httpProxyNotFoundResponse, mutualPipe } from "./stream";
import { createServer, Server } from "net";
import { hostSearcher } from "./stream/host-searcher";
import { log } from "../helper/logger";
import { TunnelStorage } from "./tunnel-storage";
import { readablePreProcess } from "./stream/readable-pre-process";
import { Tunnel } from "./tunnel";
import { TunnelRequest } from "./index";

export class ProxyServer {
  private servers = new Map<number, Server>();
  private tunnelStorage: TunnelStorage;

  constructor() {
    this.tunnelStorage = new TunnelStorage();
  }

  canCreate(request: TunnelRequest): boolean {
    return null === this.tunnelStorage.find(request.bindAddr, request.bindPort);
  }

  addTunnel(tunnel: Tunnel): boolean {
    tunnel.on("tcp-forward-error", (err) => {
      console.log("error forwarding...", err);
    });
    tunnel.on("close", () => {
      if (tunnel.bindPort !== 80) {
        this.stopTcpServer(tunnel.bindPort);
      }
      return this.tunnelStorage.delete(tunnel);
    });

    if (tunnel.bindPort !== 80) {
      this.runTcpServer(tunnel.bindPort);
    }
    return this.tunnelStorage.add(tunnel);
  }

  run() {
    this.runHttpServer();
  }

  stop() {
    for (const server of this.servers.values()) {
      server.close();
    }
  }

  private runHttpServer() {
    const httpServer = createServer();
    httpServer.on("connection", async (socket) => {
      const { remoteAddress, remotePort } = socket;
      if (remoteAddress == undefined || remotePort == undefined) {
        return socket.end();
      }

      const host = await readablePreProcess(socket, hostSearcher);
      log("Host header is found: ", host);

      if (host === null) {
        mutualPipe(socket, emptyResponse());
        return;
      }

      const targetTunnel = this.tunnelStorage.find(host, 80);
      if (targetTunnel === null) {
        mutualPipe(socket, httpProxyNotFoundResponse(host));
        return;
      }

      targetTunnel.serve(socket);
    });

    this.servers.set(80, httpServer);
    httpServer.listen(80, () => console.log("Proxy port 80 is listening..."));
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
      const targetTunnel = this.tunnelStorage.find(null, bindPort);
      if (targetTunnel === null) {
        return socket.end();
      }

      targetTunnel.serve(socket);
      // this.forwardTraffic(socket, targetTunnel, remoteAddress, remotePort, () =>
      //   emptyResponse()
      // );
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

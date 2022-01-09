import {
  emptyResponse,
  httpProxyNotFoundResponse,
  mutualPipe,
  remoteHostIsUnreachableResponse,
} from "./stream";
import { createServer, Server } from "net";
import { hostSearcher } from "./stream/host-searcher";
import { log } from "../helper/logger";
import { TunnelRequest, TunnelStorage } from "./tunnel-storage";
import { Duplex } from "stream";
import { readablePreProcess } from "./stream/readable-pre-process";

export class ProxyServer {
  private servers = new Map<number, Server>();
  private tunnelStorage: TunnelStorage;

  constructor() {
    this.tunnelStorage = new TunnelStorage();
  }

  addTunnel(tunnel: TunnelRequest): boolean {
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

      this.forwardTraffic(
        socket,
        targetTunnel,
        remoteAddress,
        remotePort,
        (err) => remoteHostIsUnreachableResponse(host, err)
      );
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

      this.forwardTraffic(socket, targetTunnel, remoteAddress, remotePort, () =>
        emptyResponse()
      );
    });

    this.servers.set(bindPort, tcpServer);
    tcpServer.listen(bindPort, () =>
      console.log(`Proxy port ${bindPort} is listening...`)
    );
  }

  private forwardTraffic(
    socket: Duplex,
    tunnel: TunnelRequest,
    remoteAddress: string,
    remotePort: number,
    errorCb: (error: Error) => Duplex
  ) {
    tunnel.sshConnection.forwardOut(
      tunnel.bindAddr,
      tunnel.bindPort,
      remoteAddress,
      remotePort,
      (err, sshChannel) => {
        if (err) {
          const forwardErrorResponse = errorCb(err);
          mutualPipe(socket, forwardErrorResponse);
          // socket.end();
          return;
        }
        mutualPipe(socket, sshChannel);
        // socket.pipe(consoleRequest, {end: false});
        // upstream.pipe(consoleResponse, {end: false});
      }
    );
  }
}

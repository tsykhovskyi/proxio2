import {
  emptyResponse,
  httpProxyNotFoundResponse,
  mutualPipe,
} from "./tunnel/http-responses";
import { createServer, Server, Socket } from "net";
import { hostSearcher } from "./stream/host-searcher";
import { readablePreProcess } from "./stream/readable-pre-process";
import * as tls from "tls";
import * as fs from "fs";
import EventEmitter from "events";
import { config } from "../config";
import { Tunnel } from "./contracts/tunnel";
import { logger } from "../helper/logger";

const log = logger("Proxy SC");

/**
 * Responsible for open/close tcp ports and definition of http tunnel from traffic payload
 */
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
      this.httpAddresses.add(tunnel.hostname);
    } else {
      this.runTcpServer(tunnel.port);
    }
  }

  deleteTunnel(tunnel: Tunnel) {
    if (tunnel.http) {
      this.httpAddresses.delete(tunnel.hostname);
    } else {
      this.stopTcpServer(tunnel.port);
    }
  }

  run() {
    this.runHttpServer();
  }

  stop() {
    for (const [port, server] of this.servers.entries()) {
      server.close(() => log(`Port ${port}  is released`));
    }
  }

  private async onHttpConnection(socket: Socket) {
    socket.on("error", (err) => {
      log(err.stack);
    });

    const { remoteAddress, remotePort } = socket;
    if (remoteAddress == undefined || remotePort == undefined) {
      return socket.end();
    }

    const host = await readablePreProcess(socket, hostSearcher);
    if (host === null) {
      return mutualPipe(socket, emptyResponse());
    }

    if (host === config.domainName || host === config.monitorDomainName) {
      // Forward to monitor app private socket
      const forwarder = new Socket();
      forwarder.connect(config.monitorPrivatePort, "127.0.0.1", () => {
        socket.pipe(forwarder).pipe(socket);
      });
      forwarder.on("close", (hadError) => {});
      return;
    }

    if (!this.httpAddresses.has(host)) {
      return mutualPipe(socket, httpProxyNotFoundResponse(host));
    }

    this.emit("http-connection", host, socket);
  }

  private runHttpServer() {
    const httpServer = createServer();
    httpServer.on("connection", this.onHttpConnection.bind(this));
    httpServer.listen(config.httpPort, () =>
      log(`Proxy port ${config.httpPort} is listening...`)
    );
    this.servers.set(config.httpPort, httpServer);

    const tlsServer = tls.createServer(
      {
        key: fs.readFileSync(config.sslCertificateKeyPath),
        cert: fs.readFileSync(config.sslCertificatePath),
      },
      this.onHttpConnection.bind(this)
    );
    tlsServer.listen(config.httpsPort, () =>
      log(`Proxy port ${config.httpsPort} is listening...`)
    );
    this.servers.set(config.httpsPort, tlsServer);
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
    });

    this.servers.set(bindPort, tcpServer);
    tcpServer.listen(bindPort, () =>
      log(`Proxy port ${bindPort} is listening...`)
    );
  }

  private stopTcpServer(bindPort: number) {
    const server = this.servers.get(bindPort);
    if (server === undefined) {
      return;
    }
    server.close(() => log(`Proxy port ${bindPort} is released`));
    this.servers.delete(bindPort);
  }
}

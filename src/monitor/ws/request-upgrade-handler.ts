import { IncomingMessage } from "http";
import { Duplex } from "stream";
import { WebSocketServer, WebSocket } from "ws";
import { logger } from "../../helper/logger";
import { TunnelStorage } from "../../proxy/tunnel-storage";
import { encodeTunnelChunk, encodeTunnelConnection } from "./encoders";
import { config } from "../../config";
import { Tunnel } from "../../proxy/contracts/tunnel";

const log = logger("MONITOR_WS");

export class RequestUpgradeHandler {
  private ws: WebSocketServer;

  constructor(private tunnelStorage: TunnelStorage) {
    this.ws = new WebSocketServer({ noServer: true });
    this.ws.on("connection", this.onConnection.bind(this));
  }

  handle(req: IncomingMessage, socket: Duplex, head: Buffer) {
    log("url ", req.url);
    if (!req.url?.startsWith("/traffic")) {
      socket.end();
      return;
    }
    this.ws.handleUpgrade(req, socket, head, (wsClient) => {
      this.ws.emit("connection", wsClient, req);
    });
  }

  private onConnection(socket: WebSocket, request: IncomingMessage) {
    const tunnel = this.getTunnelByUrl(request.url ?? "");
    if (!tunnel) {
      socket.close(1002);
      return;
    }

    log(`New WS listener for: ${tunnel.hostname}`);
    tunnel.on("connection", (packet) => {
      socket.send(encodeTunnelConnection(packet));
    });
    tunnel.on("connection-chunk", (chunk) => {
      socket.send(encodeTunnelChunk(chunk));
    });
    tunnel.on("close", () => {
      socket.close(1001);
    });
  }

  private getTunnelByUrl(url: string): Tunnel | null {
    const query = url.split("?")[1] ?? "";
    const hostnameKeyValue =
      query
        .split("&")
        .map((kv) => kv.split("="))
        .find(([k, v]) => k === "hostname") ?? null;
    if (!hostnameKeyValue) {
      return null;
    }

    const hostname = hostnameKeyValue[1] + "." + config.domainName;
    return this.tunnelStorage.findHttp(hostname);
  }
}

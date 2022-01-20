import express from "express";
import { Server } from "http";
import { config } from "../config";
import { WebSocket, WebSocketServer } from "ws";
import { Tunnel } from "../proxy/contracts/tunnel";
import { encodeTunnelChunk } from "./buffer";
import { logger } from "../helper/logger";

const log = logger("MONITOR");

export class Monitor {
  private server: Server | null = null;
  private sockets = new Set<WebSocket>();

  onTunnelOpened(tunnel: Tunnel) {
    tunnel.on("tunnel-packet", (packet) => {
      this.sockets.forEach((socket) => socket.send(JSON.stringify(packet)));
    });
    tunnel.on("tunnel-packet-data", (chunk) => {
      this.sockets.forEach((socket) => {
        socket.send(encodeTunnelChunk(chunk));
      });
    });
    tunnel.on("close", () => {});
  }

  run() {
    const wss = this.createWebSocketServer();
    this.runServer(wss);
  }

  runServer(wss: WebSocketServer) {
    const app = express();

    app.use(express.static(config.monitorApplicationDist));

    const server = app.listen(config.monitorPrivatePort, () =>
      log(`Monitor set up on port ${config.monitorPrivatePort}`)
    );
    server.on("upgrade", (req, socket, head) => {
      if (req.url !== "/traffic") {
        socket.end();
      }
      wss.handleUpgrade(req, socket, head, (wsClient) => {
        wss.emit("connection", wsClient, req);
      });
    });

    this.server = server;
  }

  stop() {
    this.server?.close(() => log("Monitor is closed"));
  }

  private createWebSocketServer() {
    const wss = new WebSocketServer({ noServer: true });
    wss.on("connection", (socket, request) => {
      this.sockets.add(socket);
      log("new connection");
      socket.on("close", (code) => {
        log("remove connection");
        this.sockets.delete(socket);
      });
    });

    return wss;
  }
}

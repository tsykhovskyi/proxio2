import express from "express";
import { Server } from "http";
import { config } from "../config";
import path from "path";
import { WebSocket, WebSocketServer } from "ws";
import { Tunnel } from "../proxy/contracts/tunnel";
import { encodeTunnelChunk } from "./buffer";

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

    app.get("/", express.static(path.join(__dirname, "public")));

    const server = app.listen(config.monitorServerPort, () =>
      console.log(`Monitor set up on port ${config.monitorServerPort}`)
    );
    server.on("upgrade", (req, socket, head) => {
      wss.handleUpgrade(req, socket, head, (wsClient) => {
        wss.emit("connection", wsClient, req);
      });
    });

    this.server = server;
  }

  stop() {
    this.server?.close(() => console.log("Monitor is closed"));
  }

  private createWebSocketServer() {
    const wss = new WebSocketServer({ noServer: true });
    wss.on("connection", (socket, request) => {
      this.sockets.add(socket);
    });

    return wss;
  }
}

import express from "express";
import { Server } from "http";
import { config } from "../config";
import path from "path";
import { WebSocketServer } from "ws";

export class Monitor {
  private server: Server | null = null;

  traffic(
    chunk: Buffer,
    direction: "inbound" | "outbound",
    address: string | null,
    port: string | null
  ) {
    console.log(direction, address, port);
    console.log(chunk.toString());
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
    // const url = `ws://${config.monitorSubDomain}.${config.domainName}/ws`;
    const wss = new WebSocketServer({ noServer: true });
    wss.on("connection", (socket, request) => {
      socket.send("Hi there");
      setTimeout(() => socket.close(1000, "Bye!"), 10000);
    });

    return wss;
  }
}

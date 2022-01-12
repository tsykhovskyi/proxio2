import express from "express";
import { Server } from "http";
import { config } from "../config";
import path from "path";

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
    const app = express();

    app.get("/", express.static(path.join(__dirname, "public")));

    this.server = app.listen(config.monitorServerPort, () =>
      console.log(`Monitor set up on port ${config.monitorServerPort}`)
    );
  }

  stop() {
    this.server?.close(() => console.log("Monitor is closed"));
  }
}

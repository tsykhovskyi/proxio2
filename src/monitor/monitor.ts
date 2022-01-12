import express from "express";
import { Server } from "http";
import { config } from "../config";

export class Monitor {
  private server: Server | null = null;

  run() {
    const app = express();

    app.get("/", (req, res) => {
      res.send("Hello monitor system");
    });

    this.server = app.listen(config.monitorServerPort, () =>
      console.log(`Monitor set up on port ${config.monitorServerPort}`)
    );
  }

  stop() {
    this.server?.close(() => console.log("Monitor is closed"));
  }
}

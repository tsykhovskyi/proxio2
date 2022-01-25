import express from "express";
import { Server } from "http";
import { config } from "../config";
import { logger } from "../helper/logger";
import { RequestUpgradeHandler } from "./ws/request-upgrade-handler";
import { TunnelStorage } from "../proxy/tunnel-storage";

const log = logger("MONITOR");

export class Monitor {
  private server: Server | null = null;

  constructor(private tunnelStorage: TunnelStorage) {}

  run() {
    this.runServer();
  }

  runServer() {
    const app = express();

    const requestUpgradeHandler = new RequestUpgradeHandler(this.tunnelStorage);

    app.use(express.static(config.monitorApplicationDist));

    const server = app.listen(config.monitorPrivatePort, () =>
      log(`Monitor set up on port ${config.monitorPrivatePort}`)
    );
    server.on(
      "upgrade",
      requestUpgradeHandler.handle.bind(requestUpgradeHandler)
    );

    this.server = server;
  }

  stop() {
    this.server?.close(() => log("Monitor is closed"));
  }
}

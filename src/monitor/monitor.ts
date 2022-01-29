import express from "express";
import { Server } from "http";
import path from "path";
import { config } from "../config";
import { logger } from "../helper/logger";
import { RequestUpgradeHandler } from "./ws/request-upgrade-handler";
import { TunnelStorage } from "../proxy/tunnel-storage";

const log = logger("MONITOR");

export class Monitor {
  private server: Server | null = null;

  constructor(private tunnelStorage: TunnelStorage) {}

  runServer() {
    const app = express();

    const requestUpgradeHandler = new RequestUpgradeHandler(this.tunnelStorage);

    app.use("*", (req, res) => {
      let publicPath;
      if (req.hostname === config.domainName) {
        publicPath = config.frontPageDist;
      } else if (req.hostname === config.monitorDomainName) {
        publicPath = config.monitorApplicationDist;
      } else {
        res.statusCode = 404;
        res.end();
      }

      const staticMatch = req.originalUrl.match(/^\/[a-z0-9.]+\.[a-z]{2,4}$/);
      if (staticMatch) {
        return res.sendFile(publicPath + staticMatch[0]);
      }
      return res.sendFile(publicPath + "/index.html");
    });

    const server = app.listen(config.monitorPrivatePort, () =>
      log(`Monitor set up on port ${config.monitorPrivatePort}`)
    );
    server.on(
      "upgrade",
      requestUpgradeHandler.handle.bind(requestUpgradeHandler)
    );

    this.server = server;
  }

  run() {
    this.runServer();
  }

  stop() {
    this.server?.close(() => log("Monitor is closed"));
  }
}

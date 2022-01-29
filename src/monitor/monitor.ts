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

    // app.use(/^\/([a-z0-9.]+\.(js|css|ico))$/, (req, res) => {
    //   const path = req.params[0];
    //   res.sendFile(config.monitorApplicationDist + "/" + path);
    // });

    app.use("*", (req, res) => {
      if (req.hostname === config.domainName) {
        return res.sendFile(path.resolve(__dirname, "./public/index.html"));
      }

      // Monitor application
      if (req.hostname === config.monitorDomainName) {
        const staticMatch = req.originalUrl.match(
          /^\/[a-z0-9.]+\.(js|css|ico)$/
        );
        if (staticMatch) {
          return res.sendFile(config.monitorApplicationDist + staticMatch[0]);
        }
        return res.sendFile(config.monitorApplicationDist + "/index.html");
      }
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

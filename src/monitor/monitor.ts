import express from "express";
import { Server } from "http";

export class Monitor {
  private server: Server | null = null;

  run(port: number) {
    const app = express();

    app.get("/", (req, res) => {
      res.send("Hello monitor system");
    });

    this.server = app.listen(port, () =>
      console.log(`Monitor set up on port ${port}`)
    );
  }

  stop() {
    this.server?.close(() => console.log("Monitor is closed"));
  }
}

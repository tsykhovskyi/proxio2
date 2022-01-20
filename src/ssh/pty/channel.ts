import { Tunnel } from "../../proxy/contracts/tunnel";
import { PseudoTtyInfo, ServerChannel } from "ssh2";
import { Terminal, WindowSize } from "./terminal";
import EventEmitter from "events";
import {
  tunnelHttpsUrl,
  tunnelHttpUrl,
  tunnelMonitorUrl,
} from "../../proxy/urls";

export declare interface Channel {
  on(event: "close", listener: () => void);
}

export class Channel extends EventEmitter {
  private terminal: Terminal;

  constructor(
    private tunnel: Tunnel,
    sshChannel: ServerChannel,
    info: PseudoTtyInfo
  ) {
    super();
    this.terminal = new Terminal(sshChannel, info, () => this.emit("close"));
  }

  init() {
    this.terminal.setTitle(`Proxio tunnel: ${this.tunnel.hostname}`);

    this.updateStatistics();
    this.addEventListeners();
  }

  private updateStatistics() {
    if (this.tunnel.http) {
      this.terminal.setInfo([
        ["{bold}{green-fg}Proxio{/green-fg}{/bold}", ""],
        null,
        ["Web interface", tunnelMonitorUrl(this.tunnel)],
        ["Http forwarding", tunnelHttpUrl(this.tunnel)],
        ["Https forwarding", tunnelHttpsUrl(this.tunnel)],
        null,
        ["Traffic", ["Inbound", "Outbound"].map((s) => s.padEnd(12)).join("")],
        [
          "",
          [
            this.tunnel.statistic.inboundTraffic,
            this.tunnel.statistic.outboundTraffic,
          ]
            .map((s) => s.toString().padEnd(12))
            .join(""),
        ],
      ]);
    } else {
      this.terminal.setInfo([
        ["{bold}{green-fg}Proxio{/green-fg}{/bold}", ""],
        null,
        ["TCP forwarding", `Port: ${this.tunnel.port}`],
        ["Traffic", ["Inbound", "Outbound"].map((s) => s.padEnd(12)).join("")],
        [
          "",
          [
            this.tunnel.statistic.inboundTraffic,
            this.tunnel.statistic.outboundTraffic,
          ]
            .map((s) => s.toString().padEnd(12))
            .join(""),
        ],
      ]);
    }
  }

  windowResize(size: WindowSize) {
    this.updateStatistics();
    this.terminal.resize(size);
  }

  private addEventListeners() {
    this.tunnel.on("connection-chunk", (packet) => {
      this.updateStatistics();
    });
  }
}

import { Tunnel } from "../../proxy/contracts/tunnel";
import { PseudoTtyInfo, ServerChannel } from "ssh2";
import { Terminal, WindowSize } from "./terminal";

export class Channel {
  private terminal: Terminal;

  constructor(
    private tunnel: Tunnel,
    sshChannel: ServerChannel,
    info: PseudoTtyInfo
  ) {
    this.terminal = new Terminal(sshChannel, info);
  }

  init() {
    this.terminal.setTitle(`Proxio tunnel: ${this.tunnel.address}`);

    this.updateStatistics();
    this.addEventListeners();
  }

  private updateStatistics() {
    this.terminal.setInfo([
      ["{bold}{green-fg}Proxio{/green-fg}{/bold}", ""],
      null,
      ["Web interface", "https://monitor.localhost:3000"],
      ["Http forwarding", `http://${this.tunnel.address}`],
      ["Https forwarding", `https://${this.tunnel.address}`],
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
  }

  windowResize(size: WindowSize) {
    this.updateStatistics();
    this.terminal.resize(size);
  }

  private addEventListeners() {
    this.tunnel.on("tunnel-packet-data", (packet) => {
      this.updateStatistics();
    });
  }
}

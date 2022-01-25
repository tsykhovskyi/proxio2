import { Tunnel, TunnelChunk } from "../../../proxy/contracts/tunnel";
import EventEmitter from "events";

export declare interface TcpTunnelView {
  on(event: "update", listener: () => void);
}

export class TcpTunnelView extends EventEmitter {
  constructor(protected tunnel: Tunnel) {
    super();

    this.tunnel.on("connection-chunk", (chunk: TunnelChunk) =>
      this.onConnectionChunk(chunk)
    );
  }

  title(): string {
    return `Proxio tunnel: ${this.tunnel.hostname}`;
  }

  render(): string[] {
    return [
      "{bold}{green-fg}Proxio{/green-fg}{/bold}",
      "",
      "TCP forwarding".padEnd(20) + `Port: ${this.tunnel.port}`,
      "",
      "Traffic".padEnd(20) +
        ["Inbound", "Outbound"].map((s) => s.padEnd(12)).join(""),
      "".padEnd(20) +
        [
          this.tunnel.statistic.inboundTraffic,
          this.tunnel.statistic.outboundTraffic,
        ]
          .map((s) => s.toString().padEnd(12))
          .join(""),
    ];
  }

  protected onConnectionChunk(chunk: TunnelChunk) {
    this.emitUpdate();
  }

  protected emitUpdate(): void {
    this.emit("update");
  }
}

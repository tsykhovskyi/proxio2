import {
  Tunnel,
  TunnelChunk,
  TunnelConnection,
} from "../../../proxy/contracts/tunnel";
import EventEmitter from "events";
import { TunnelView } from "./tunnel-view";
import { config } from "../../../config";
import { Renderer } from "./utility/renderer";

export declare interface TcpTunnelView {
  on(event: "update", listener: () => void);
}

export class TcpTunnelView extends EventEmitter implements TunnelView {
  protected connectionsCnt = 0;
  private r: Renderer;

  constructor(protected tunnel: Tunnel) {
    super();

    this.r = new Renderer();

    this.tunnel.on("connection-chunk", (chunk: TunnelChunk) =>
      this.onConnectionChunk(chunk)
    );
    this.tunnel.on("connection", (packet) => this.onConnection(packet));
  }

  title(): string {
    return `Proxio tunnel: ${this.tunnel.hostname}`;
  }

  render(): string[] {
    return [
      "{bold}{green-fg}Proxio{/green-fg}{/bold} by tsykhovskyi",
      "",
      "TCP forwarding".padEnd(20) +
        `tcp://${config.domainName}:${this.tunnel.port}`,
      "",
      "Traffic".padEnd(20) +
        ["Inbound", "Outbound"].map((s) => s.padEnd(12)).join(""),
      "".padEnd(20) +
        [
          this.tunnel.statistic.inboundTraffic,
          this.tunnel.statistic.outboundTraffic,
        ]
          .map((s) => this.r.limitedString(this.r.readableBytes(s), 12))
          .join(""),
      "",
      "Connections".padEnd(20) + this.connectionsCnt,
    ];
  }

  protected onConnectionChunk(chunk: TunnelChunk) {
    this.emitUpdate();
  }

  protected emitUpdate(): void {
    this.emit("update");
  }

  private onConnection(packet: TunnelConnection) {
    if (packet.state === "open") {
      this.connectionsCnt++;
    }
  }
}

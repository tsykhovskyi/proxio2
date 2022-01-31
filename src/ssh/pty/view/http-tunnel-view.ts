import { Tunnel, TunnelChunk } from "../../../proxy/contracts/tunnel";
import {
  tunnelHttpsUrl,
  tunnelHttpUrl,
  tunnelMonitorUrl,
} from "../../../helper/urls";
import { ChunkParser } from "./parser/chunk-parser";
import EventEmitter from "events";
import { TunnelView } from "./tunnel-view";
import { Renderer } from "./utility/renderer";

export declare interface HttpTunnelView {
  on(event: "update", listener: () => void);
}

export class HttpTunnelView extends EventEmitter implements TunnelView {
  private chunkParser = new ChunkParser(15);
  private r: Renderer;

  constructor(protected tunnel: Tunnel) {
    super();
    this.r = new Renderer();

    this.tunnel.on("connection-chunk", (chunk: TunnelChunk) =>
      this.onConnectionChunk(chunk)
    );
  }

  title(): string {
    return `Proxio tunnel: ${this.tunnel.hostname}`;
  }

  render(): string[] {
    const lines = [
      "{bold}{green-fg}Proxio{/green-fg}{/bold} by tsykhovskyi",
      "",
      "Web interface: ".padEnd(20) + tunnelMonitorUrl(this.tunnel),
      "Http forwarding".padEnd(20) + tunnelHttpUrl(this.tunnel),
      "Https forwarding".padEnd(20) + tunnelHttpsUrl(this.tunnel),
      "Traffic".padEnd(20) +
        ["Inbound", "Outbound"]
          .map((s) => this.r.limitedString(s, 12))
          .join(""),
      "".padEnd(20) +
        [
          this.tunnel.statistic.inboundTraffic,
          this.tunnel.statistic.outboundTraffic,
        ]
          .map((s) => this.r.limitedString(this.r.readableBytes(s), 12))
          .join(""),
      "",
    ];

    const requests = this.chunkParser.requestsInfo();
    if (requests.length) {
      for (const { request, responseStatus, time } of requests) {
        lines.push(
          this.r.limitedString(request, 40) +
            (responseStatus !== ""
              ? this.r.limitedString(responseStatus, 20) +
                this.r.readableTime(time)
              : "")
        );
      }
    } else {
      lines.push("{grey-fg}No requests yet...{/grey-fg}");
    }

    return lines;
  }

  protected onConnectionChunk(chunk: TunnelChunk) {
    const updated = this.chunkParser.chunk(chunk);
    if (updated) {
      this.emit("update");
    }
  }
}

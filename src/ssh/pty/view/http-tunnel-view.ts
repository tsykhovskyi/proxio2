import { TunnelChunk } from "../../../proxy/contracts/tunnel";
import {
  tunnelHttpsUrl,
  tunnelHttpUrl,
  tunnelMonitorUrl,
} from "../../../proxy/urls";
import { TcpTunnelView } from "./tcp-tunnel-view";
import { ChunkParser } from "./parser/chunk-parser";

export declare interface HttpTunnelView {
  on(event: "update", listener: () => void);
}

export class HttpTunnelView extends TcpTunnelView {
  private chunkParser = new ChunkParser(15);

  title(): string {
    return `Proxio tunnel: ${this.tunnel.hostname}`;
  }

  render(): string[] {
    const lines = [
      "{bold}{green-fg}Proxio{/green-fg}{/bold}",
      "",
      "Web interface: ".padEnd(20) + tunnelMonitorUrl(this.tunnel),
      "Http forwarding".padEnd(20) + tunnelHttpUrl(this.tunnel),
      "Https forwarding".padEnd(20) + tunnelHttpsUrl(this.tunnel),
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
      "Requests:",
    ];

    const requests = this.chunkParser.requestsInfo();
    for (const req of requests) {
      const time = req[2] !== 0 ? req[2].toString() + " ms" : "";

      lines.push(this.cell(req[0], 40) + this.cell(req[1], 20) + time);
    }

    return lines;
  }

  /**
   * Fill string into cell size.
   * Fill empty positions with spaces. last position will always be a space
   */
  protected cell(cell: string, length: number): string {
    return cell.length < length
      ? cell.padEnd(length)
      : cell.substring(0, length - 4) + "... ";
  }

  protected onConnectionChunk(chunk: TunnelChunk) {
    if (this.chunkParser.chunk(chunk)) {
      this.emitUpdate();
    }
  }
}

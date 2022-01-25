import { Tunnel, TunnelChunk } from "../../../proxy/contracts/tunnel";
import {
  tunnelHttpsUrl,
  tunnelHttpUrl,
  tunnelMonitorUrl,
} from "../../../proxy/urls";
import { TcpTunnelView } from "./tcp-tunnel-view";

export declare interface HttpTunnelView {
  on(event: "update", listener: () => void);
}

export interface Request {
  method: string;
  uri: string;
  statusCode?: string;
  statusMessage?: string;
}

export class HttpTunnelView extends TcpTunnelView {
  private requests = new Map<string, Request>();

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
    ];

    for (const req of [...this.requests.values()].reverse()) {
      lines.push(
        `${req.method} ${req.uri}`.padEnd(40) +
          (req.statusCode ? `${req.statusCode} ${req.statusMessage}` : "")
      );
    }

    return lines;
  }

  protected onConnectionChunk(chunk: TunnelChunk) {
    if (chunk.chunkNumber !== 0) {
      // Only analyze first chunk
      return;
    }

    const startLine = this.readFirstLine(chunk.chunk);
    if (startLine == null) {
      return;
    }

    if (chunk.direction === "inbound") {
      const req: Request = { method: startLine[0], uri: startLine[1] };
      this.requests.set(chunk.connectionId, req);
    } else {
      let req = this.requests.get(chunk.connectionId);
      if (!req) {
        return;
      }
      this.requests.set(chunk.connectionId, {
        ...req,
        statusCode: startLine[1],
        statusMessage: startLine[2],
      });
    }

    this.emitUpdate();
  }

  private readFirstLine(buffer: Uint8Array): [string, string, string] | null {
    let end = buffer.findIndex((v) => v === 0xa);
    if (end === -1) {
      return null;
    }
    if (buffer[end - 1] === 0xd) {
      end--;
    }

    const str = new TextDecoder().decode(buffer.slice(0, end));
    const parts = str.split(" ");
    if (parts.length < 3) {
      return null;
    }

    return [parts[0], parts[1], parts.slice(2).join(" ")];
  }
}

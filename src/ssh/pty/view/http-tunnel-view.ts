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
  time: number;
  response?: {
    statusCode: string;
    statusMessage: string;
    time: number;
  };
}

class RequestsCollection {
  private requests = new Map<string, Request>();
  private limit = 15;

  get(connectionId: string): Request | null {
    return this.requests.get(connectionId) ?? null;
  }

  add(connectionId: string, request: Request) {
    for (let key of this.requests.keys()) {
      if (this.requests.size < this.limit) {
        break;
      }
      this.requests.delete(key);
    }
    this.requests.set(connectionId, request);
  }

  allReversed() {
    return [...this.requests.values()].reverse();
  }
}

export class HttpTunnelView extends TcpTunnelView {
  private requests = new RequestsCollection();

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

    for (const req of this.requests.allReversed()) {
      let line = `${req.method} ${req.uri}`.padEnd(40);
      const res = req.response;
      if (res) {
        line += `${res.statusCode} ${res.statusMessage}`.padEnd(15);
        const spentTime = res.time - req.time;
        line +=
          spentTime > 1000
            ? (spentTime / 1000).toPrecision(2) + " s"
            : spentTime + " ms";
      }

      lines.push(line);
    }

    return lines;
  }

  protected onConnectionChunk(chunk: TunnelChunk) {
    if (chunk.chunkNumber !== 0) {
      // Only analyze first chunk
      return;
    }
    // todo multiple http on same connection

    const startLine = this.readFirstLine(chunk.chunk);
    if (!startLine) {
      return;
    }
    const req = {
      method: startLine[0],
      uri: startLine[1],
      time: chunk.time,
    };
    this.requests.add(chunk.connectionId, req);

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

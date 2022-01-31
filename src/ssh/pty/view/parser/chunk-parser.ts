import { TunnelChunk } from "../../../../proxy/contracts/tunnel";

interface Request {
  connectionId: string;
  method: string;
  uri: string;
  time: number;
  response?: {
    statusCode: string;
    statusMessage: string;
    time: number;
  };
}

export interface RequestInfo {
  request: string;
  responseStatus: string;
  time: number;
}

export class ChunkParser {
  private maximumStartLineLength = 256;
  private decoder = new TextDecoder();

  constructor(private requestsLimit: number) {}

  private requests: Request[] = [];

  /**
   * Process chunk and define if requests info was updated
   */
  chunk(chunk: TunnelChunk): boolean {
    const startLine = this.readFirstLine(chunk.chunk);
    if (!startLine) {
      return false;
    }

    this.applyStartLine(chunk, startLine);

    if (this.requests.length > this.requestsLimit) {
      this.requests = this.requests.slice(-this.requestsLimit);
    }

    return true;
  }

  /**
   * Request method&url, response status code with message, request timing
   */
  requestsInfo(): RequestInfo[] {
    return [...this.requests].reverse().map((r) => ({
      request: `[${r.method}] ${r.uri}`,
      responseStatus: r.response
        ? `${r.response.statusCode} ${r.response.statusMessage}`
        : "",
      time: r.response ? r.response.time - r.time : 0,
    }));
  }

  private applyStartLine(
    chunk: TunnelChunk,
    startLine: [string, string, string]
  ) {
    const pendingRequestI = this.requests.findIndex(
      (r) => r.connectionId === chunk.connectionId && !r.response
    );
    const isRequest = chunk.direction === "inbound";

    if (isRequest) {
      // todo check request error states
      // if (pendingRequestI !== -1) {
      //   this.requests[pendingRequestI].response = {};
      // }

      this.requests.push({
        connectionId: chunk.connectionId,
        method: startLine[0],
        uri: startLine[1],
        time: chunk.time,
      });
    } else {
      if (pendingRequestI === -1) {
        return;
      }

      this.requests[pendingRequestI] = {
        ...this.requests[pendingRequestI],
        response: {
          statusCode: startLine[1],
          statusMessage: startLine[2],
          time: chunk.time,
        },
      };
    }
  }

  private readFirstLine(buffer: Uint8Array): [string, string, string] | null {
    let end = buffer
      .subarray(0, this.maximumStartLineLength)
      .findIndex((v) => v === 0xa);
    if (end === -1) {
      return null;
    }

    if (buffer[--end] !== 0xd) {
      return null;
    }

    const str = this.decoder.decode(buffer.subarray(0, end));
    const parts = str.split(" ");
    if (parts.length < 3) {
      return null;
    }

    return [parts[0], parts[1], parts.slice(2).join(" ")];
  }
}

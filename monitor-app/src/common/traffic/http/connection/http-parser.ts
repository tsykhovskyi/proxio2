import { readHeadersBlock } from "./headers";
import { EventEmitter } from "../../event-emitter";
import { RequestImpl } from "./models/request";
import { ResponseImpl } from "./models/response";
import { HttpRequest } from "../tunnel-parser";

class Payload {
  public readonly chunks = new Map<number, Uint8Array>();
  public current = -1;

  next(): Uint8Array | null {
    const currChunk = this.chunks.get(this.current + 1);
    if (currChunk) {
      this.current++;
      return currChunk;
    }
    return null;
  }
}

export declare interface HttpParser {
  on(event: "request", listener: (request: HttpRequest) => void): void;

  removeAllListeners(event: "request"): void;
}

export class HttpParser extends EventEmitter {
  private request: RequestImpl | null = null;
  private response: ResponseImpl | null = null;

  private inboundChunks = new Payload();
  private outboundChunks = new Payload();

  private closed: boolean = false;

  chunk(
    direction: "inbound" | "outbound",
    chunk: Uint8Array,
    chunkNum: number
  ) {
    if (this.closed) {
      return;
    }
    const payload =
      direction === "inbound" ? this.inboundChunks : this.outboundChunks;

    payload.chunks.set(chunkNum, chunk);
    this.check();
  }

  private check() {
    let chunk;
    while (null !== (chunk = this.inboundChunks.next())) {
      if (this.inboundChunks.current === 0) {
        this.initRequest(chunk);
      } else {
        this.request?.data(chunk);
      }
    }

    while (null !== (chunk = this.outboundChunks.next())) {
      if (this.outboundChunks.current === 0) {
        this.initResponse(chunk);
      } else {
        this.response?.data(chunk);
      }
    }
  }

  private initRequest(chunk: Uint8Array) {
    const headersBlock = readHeadersBlock(chunk);
    if (headersBlock === null) {
      return this.close();
    }

    const [method, uri, protocol] = headersBlock.startLine;
    this.request = new RequestImpl(method, uri, protocol, headersBlock.headers);
    this.emit("request", this.request);

    if (headersBlock.blockEnd < chunk.byteLength) {
      this.request.data(chunk.subarray(headersBlock.blockEnd));
    }
  }

  private initResponse(chunk: Uint8Array) {
    const headersBlock = readHeadersBlock(chunk);
    if (headersBlock === null) {
      return this.close();
    }

    const [protocol, statusCode, statusMessage] = headersBlock.startLine;

    this.response = new ResponseImpl(
      protocol,
      parseInt(statusCode),
      statusMessage,
      headersBlock.headers
    );
    this.request?.response(this.response);
    if (headersBlock.blockEnd < chunk.byteLength) {
      this.response.data(chunk.subarray(headersBlock.blockEnd));
    }
  }

  private close() {
    this.closed = true;
  }
}

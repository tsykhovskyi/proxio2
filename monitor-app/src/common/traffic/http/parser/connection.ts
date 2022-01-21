import { HttpRequest, Headers, HttpResponse } from "../interfaces";
import { readHeadersBlock } from "./headers";
import { EventEmitter } from "../../event-emitter";

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

class HttpRequestImpl extends EventEmitter implements HttpRequest {
  constructor(
    public method: string,
    public uri: string,
    public protocol: string,
    public headers: Headers
  ) {
    super();
  }

  data(chunk: Uint8Array) {
    this.emit("data", chunk);
  }

  close() {
    this.emit("close");
  }

  response(response: HttpResponse) {
    this.emit("response", response);
  }
}

class HttpResponseImpl extends EventEmitter implements HttpResponse {
  constructor(
    public protocol: string,
    public statusCode: number,
    public statusMessage: string,
    public headers: Headers
  ) {
    super();
  }

  data(chunk: Uint8Array) {
    console.log("response data");
    this.emit("data", chunk);
  }

  close() {
    this.emit("close");
  }
}

export declare interface ConnectionParser {
  on(event: "request", listener: (request: HttpRequest) => void): void;

  removeAllListeners(event: "request"): void;
}

export class ConnectionParser extends EventEmitter {
  private request: HttpRequestImpl | null = null;
  private response: HttpResponseImpl | null = null;

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
      console.log("Read in chunk", chunk);
      if (this.inboundChunks.current === 0) {
        this.initRequest(chunk);
      } else {
        this.request?.data(chunk);
      }
    }

    while (null !== (chunk = this.outboundChunks.next())) {
      console.log("Read out chunk", chunk);
      if (this.outboundChunks.current === 0) {
        this.initResponse(chunk);
      } else {
        console.log("response data");
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
    this.request = new HttpRequestImpl(
      method,
      uri,
      protocol,
      headersBlock.headers
    );
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

    console.log("Response created", headersBlock);
    const [protocol, statusCode, statusMessage] = headersBlock.startLine;

    this.response = new HttpResponseImpl(
      protocol,
      parseInt(statusCode),
      statusMessage,
      headersBlock.headers
    );
    this.request?.response(this.response);
    if (headersBlock.blockEnd < chunk.byteLength) {
      console.log("response data");
      this.response.data(chunk.subarray(headersBlock.blockEnd));
    }
  }

  private close() {
    this.closed = true;
  }
}

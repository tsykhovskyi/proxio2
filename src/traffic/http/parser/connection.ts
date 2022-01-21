import { HttpRequest, Headers, HttpResponse } from "../interfaces";
import { TunnelConnection } from "../../contracts";
import { readHeadersBlock } from "./headers";
import EventEmitter from "events";

class Payload {
  public readonly chunks = new Map<number, Buffer>();
  public current = -1;

  next(): Buffer | null {
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

  data(chunk: Buffer) {
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

  data(chunk: Buffer) {
    this.emit("data", chunk);
  }

  close() {
    this.emit("close");
  }
}

export declare interface ConnectionParser {
  on(event: "request", listener: (request: HttpRequest) => void);

  removeAllListeners(event: "request");
}

export class ConnectionParser extends EventEmitter {
  private request: HttpRequestImpl | null = null;
  private response: HttpResponseImpl | null = null;

  private inboundChunks = new Payload();
  private outboundChunks = new Payload();

  private closed: boolean = false;

  connectionUpdate(upd: TunnelConnection) {}

  chunk(direction: "inbound" | "outbound", chunk: Buffer, chunkNum: number) {
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

  private initRequest(chunk: Buffer) {
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

    if (headersBlock.blockEnd < chunk.length) {
      this.request.data(chunk.subarray(headersBlock.blockEnd));
    }
  }

  private initResponse(chunk: Buffer) {
    const headersBlock = readHeadersBlock(chunk);
    if (headersBlock === null) {
      return this.close();
    }

    const [protocol, statusCode, statusMessage] = headersBlock.startLine;

    this.response = new HttpResponseImpl(
      protocol,
      parseInt(statusCode),
      statusMessage,
      headersBlock.headers
    );
    this.request?.response(this.response);
    if (headersBlock.blockEnd < chunk.length) {
      this.response.data(chunk.subarray(headersBlock.blockEnd));
    }
  }

  private close() {
    this.closed = true;
  }
}

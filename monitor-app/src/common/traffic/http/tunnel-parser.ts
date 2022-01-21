import { TunnelChunk, TunnelEventsSource } from "../contracts";
import { HttpParser } from "./connection/http-parser";
import { EventEmitter } from "../event-emitter";

export interface HttpHeaders {
  entries: [string, string][];

  find(name: string): string | null;
}

export interface HttpResponse {
  protocol: string;
  statusCode: number;
  statusMessage: string;
  headers: HttpHeaders;

  bodyLength: number;

  on(event: "data", listener: (chunk: Uint8Array) => void): void;

  on(event: "close", listener: () => void): void;
}

export interface HttpRequest {
  method: string;
  uri: string;
  protocol: string;
  headers: HttpHeaders;

  bodyLength: number;

  on(event: "data", listener: (chunk: Uint8Array) => void): void;

  on(event: "close", listener: () => void): void;

  on(event: "response", listener: (response: HttpResponse) => void): void;
}

export declare interface TunnelParser {
  on(event: "request", listener: (request: HttpRequest) => void): void;
}

export class TunnelParser extends EventEmitter {
  private httpParsers = new Map<string, HttpParser>();

  constructor(private source: TunnelEventsSource) {
    super();
    this.subscribe();
  }

  private onConnectionChunk(chunk: TunnelChunk) {
    let httpParser = this.httpParsers.get(chunk.connectionId);
    if (httpParser === undefined) {
      httpParser = new HttpParser();
      console.log("parser init");
      httpParser.on("request", (request) => {
        // todo check connection close event from server
        request.on("response", (response) =>
          response.on("close", () =>
            this.httpParsers.delete(chunk.connectionId)
          )
        );
        this.emit("request", request);
      });
      this.httpParsers.set(chunk.connectionId, httpParser);
    }

    httpParser.chunk(chunk.direction, chunk.chunk, chunk.chunkNumber);
  }

  private subscribe() {
    this.source.on("connection-chunk", this.onConnectionChunk.bind(this));
  }
}

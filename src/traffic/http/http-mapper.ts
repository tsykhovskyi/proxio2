import {
  TunnelChunk,
  TunnelConnection,
  TunnelEventsSource,
} from "../contracts";
import { ConnectionParser } from "./parser/connection";
import { HttpRequest } from "./interfaces";
import EventEmitter from "events";

export declare interface HttpMapper {
  on(event: "request", listener: (request: HttpRequest) => void);
}

export class HttpMapper extends EventEmitter {
  private connectionParsers = new Map<string, ConnectionParser>();

  constructor(private source: TunnelEventsSource) {
    super();
    this.subscribe();
  }

  private onConnection(connection: TunnelConnection) {
    if (connection.state === "open") {
      const parser = new ConnectionParser();
      parser.on("request", (request) => this.onParserRequest(request));
      this.connectionParsers.set(connection.id, parser);
    } else {
      this.connectionParsers.get(connection.id)?.removeAllListeners("request");
      this.connectionParsers.delete(connection.id);
    }
  }

  private onConnectionChunk(chunk: TunnelChunk) {
    const parser = this.connectionParsers.get(chunk.connectionId);
    if (parser === undefined) {
      return;
    }

    parser.chunk(chunk.direction, chunk.chunk, chunk.chunkNumber);
  }

  private onParserRequest(request: HttpRequest) {
    this.emit("request", request);
  }

  private subscribe() {
    this.source.on("connection", this.onConnection.bind(this));
    this.source.on("connection-chunk", this.onConnectionChunk.bind(this));
  }
}

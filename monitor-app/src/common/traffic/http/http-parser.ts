import {
  TunnelChunk,
  TunnelConnection,
  TunnelEventsSource,
} from "../contracts";
import { ConnectionParser } from "./parser/connection";
import { HttpRequest } from "./interfaces";
import { EventEmitter } from "../event-emitter";

export declare interface HttpParser {
  on(event: "request", listener: (request: HttpRequest) => void): void;
}

export class HttpParser extends EventEmitter {
  private connectionParsers = new Map<string, ConnectionParser>();

  constructor(private source: TunnelEventsSource) {
    super();
    this.subscribe();
  }

  private onConnection(connection: TunnelConnection) {
    console.log(connection);
    if (connection.state === "open") {
      console.log("parser registered", connection.id);
      const parser = new ConnectionParser();
      this.connectionParsers.set(connection.id, parser);
      parser.on("request", (request) =>
        this.onConnectionParserRequest(request)
      );
    } else {
      this.connectionParsers.get(connection.id)?.removeAllListeners("request");
      // this.connectionParsers.delete(connection.id);
    }
  }

  private onConnectionParserRequest(request: HttpRequest) {
    console.log("REQUEST extracted");
    this.emit("request", request);
  }

  private onConnectionChunk(chunk: TunnelChunk) {
    const parser = this.connectionParsers.get(chunk.connectionId);
    if (parser === undefined) {
      console.log("parser not found", chunk.connectionId);
      return;
    }

    parser.chunk(chunk.direction, chunk.chunk, chunk.chunkNumber);
  }

  private subscribe() {
    this.source.on("connection", this.onConnection.bind(this));
    this.source.on("connection-chunk", this.onConnectionChunk.bind(this));
  }
}

import {
  TunnelChunk,
  TunnelConnection,
  TunnelEventsSource,
} from "../contracts";

export class HttpMapper {
  constructor(private source: TunnelEventsSource) {
    this.subscribe();
  }

  onConnection(connection: TunnelConnection) {
    // register new connection
  }

  onConnectionChunk(chunk: TunnelChunk) {
    // check direction
    // handle request state
    // handle response state
  }

  private subscribe() {
    this.source.on("connection", this.onConnection.bind(this));
    this.source.on("connection-chunk", this.onConnectionChunk.bind(this));
  }
}

import { TunnelParser } from "./http/tunnel-parser";
import { TunnelEventsSource } from "./contracts";
import { EventEmitter } from "./event-emitter";
import {
  decodeTunnelChunk,
  decodeTunnelConnection,
  TunnelChunkBuffer,
} from "./transformer/ws";

export function createHttpParserFromWs(ws: WebSocket): TunnelParser {
  const source: TunnelEventsSource & EventEmitter = new EventEmitter();

  ws.addEventListener("open", (ev) => {});
  ws.addEventListener("message", (ev) => {
    if (ev.data instanceof Blob) {
      ev.data.arrayBuffer().then((buf) => {
        const chunk = decodeTunnelChunk(buf as TunnelChunkBuffer);
        if (chunk === null) {
          console.log("Unable to parse chunk");
          return;
        }

        source.emit("connection-chunk", chunk);
      });
    } else {
      const conn = decodeTunnelConnection(ev.data);
      if (conn === null) {
        return;
      }
      source.emit("connection", conn);
    }
  });

  return new TunnelParser(source);
}

import { HttpParser } from "../common/traffic/http/http-parser";
import { TunnelEventsSource } from "../common/traffic/contracts";
import { EventEmitter } from "../common/traffic/event-emitter";
import { decodeTunnelChunk } from "../common/traffic";
import {
  decodeTunnelConnection,
  TunnelChunkBuffer,
} from "../common/traffic/transformer/ws";

export function createHttpParserFromWs(ws: WebSocket) {
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

  return new HttpParser(source);
}

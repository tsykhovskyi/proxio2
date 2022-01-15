import { TunnelChunk } from "../proxy/contracts/tunnel";
import { TunnelChunkBuffer } from "./monitor";

export function encodeTunnelChunk(data: TunnelChunk): TunnelChunkBuffer {
  const packetChunk: TunnelChunkBuffer = new Buffer(13 + data.chunk.byteLength);
  const packetChunkDV = new DataView(packetChunk.buffer);

  packetChunkDV.setUint8(data.direction === "inbound" ? 0 : 1, 0);
  packetChunk.set(Buffer.from(data.connectionId.slice(0, 16), "hex"), 1);
  packetChunkDV.setUint32(9, data.chunkNumber); // chunk sequence number
  packetChunk.set(data.chunk, 13);

  return packetChunk;
}

export function decodeTunnelChunk(payload: TunnelChunkBuffer): TunnelChunk {
  const dv = new DataView(payload);
  const buffer = new Buffer(payload);

  const direction = dv.getUint8(0) === 0 ? "inbound" : "outbound";
  const connectionId = buffer.slice(1, 9).toString("hex");
  const chunkNumber = dv.getUint32(9);
  const chunk = buffer.slice(13).buffer;

  return <TunnelChunk>{
    connectionId,
    direction,
    chunkNumber,
    chunk,
  };
}

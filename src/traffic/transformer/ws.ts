import { Buffer } from "buffer";
import { TunnelChunk, TunnelConnection } from "../contracts";

export function encodeTunnelConnection(conn: TunnelConnection) {
  return JSON.stringify(conn);
}

/**
 * Offset    Length
 * 0         1 byte    - direction: 0 - incoming, 1 - outgoing
 * 1         8 bytes   - chunk id
 * 9         4 bytes   - chunk sequence number
 * 13        4 bytes   - time in ms after connection was opened
 * 17        ...       - chunk payload
 */
export interface TunnelChunkBuffer extends Buffer {}

export function encodeTunnelChunk(data: TunnelChunk): TunnelChunkBuffer {
  const packetChunk: TunnelChunkBuffer = Buffer.alloc(
    17 + data.chunk.byteLength
  );
  const packetChunkDV = new DataView(packetChunk.buffer);

  packetChunkDV.setUint8(0, data.direction === "inbound" ? 0 : 1);
  packetChunk.set(Buffer.from(data.connectionId.slice(0, 16), "hex"), 1);
  packetChunkDV.setUint32(9, data.chunkNumber); // chunk sequence number
  packetChunkDV.setUint32(13, data.time);
  packetChunk.set(data.chunk, 17);

  return packetChunk;
}

export function decodeTunnelChunk(payload: TunnelChunkBuffer): TunnelChunk {
  const dv = new DataView(payload);
  const buffer = new Buffer(payload);

  const direction = dv.getUint8(0) === 0 ? "inbound" : "outbound";
  const connectionId = buffer.slice(1, 9).toString("hex");
  const chunkNumber = dv.getUint32(9);
  const time = dv.getUint32(3);
  const chunk = buffer.slice(17).buffer;

  return <TunnelChunk>{
    connectionId,
    direction,
    chunkNumber,
    time,
    chunk,
  };
}

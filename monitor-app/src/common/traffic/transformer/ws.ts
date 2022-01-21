import { TunnelChunk, TunnelConnection } from "../contracts";

export function encodeTunnelConnection(conn: TunnelConnection) {
  return JSON.stringify(conn);
}

export function decodeTunnelConnection(
  payload: string
): TunnelConnection | null {
  const conn = JSON.parse(payload);
  if (
    typeof conn["id"] === "string" &&
    typeof conn["timestamp"] === "number" &&
    typeof conn["state"] === "string" &&
    typeof conn["chunksCnt"] === "number" &&
    typeof conn["trafficBytes"] === "number"
  ) {
    return conn;
  }

  return null;
}

/**
 * Offset    Length
 * 0         1 byte    - direction: 0 - incoming, 1 - outgoing
 * 1         8 bytes   - chunk id
 * 9         4 bytes   - chunk sequence number
 * 13        4 bytes   - time in ms after connection was opened
 * 17        ...       - chunk payload
 */
export interface TunnelChunkBuffer extends Uint8Array {}

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

export function decodeTunnelChunk(
  payload: TunnelChunkBuffer
): TunnelChunk | null {
  const dv = new DataView(payload);
  const buffer = new Uint8Array(payload);

  const directionByte = dv.getUint8(0);
  if (directionByte !== 0 && directionByte !== 1) {
    return null;
  }
  const direction = directionByte === 0 ? "inbound" : "outbound";
  const connectionId = [...buffer.slice(1, 9)]
    .map((v) => v.toString(16).padEnd(2, "0"))
    .join("");
  const chunkNumber = dv.getUint32(9);
  const time = dv.getUint32(3);
  const chunk = buffer.slice(17);

  return <TunnelChunk>{
    connectionId,
    direction,
    chunkNumber,
    time,
    chunk,
  };
}

import { TunnelChunk, TunnelConnection } from '../contracts';

export function decodeTunnelConnection(
  payload: string
): TunnelConnection | null {
  const conn = JSON.parse(payload);
  if (
    typeof conn['id'] === 'string' &&
    typeof conn['timestamp'] === 'number' &&
    typeof conn['state'] === 'string' &&
    typeof conn['chunksCnt'] === 'number' &&
    typeof conn['trafficBytes'] === 'number'
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

export function decodeTunnelChunk(
  payload: TunnelChunkBuffer
): TunnelChunk | null {
  const dv = new DataView(payload);
  const buffer = new Uint8Array(payload);

  const directionByte = dv.getUint8(0);
  if (directionByte !== 0 && directionByte !== 1) {
    return null;
  }
  const direction = directionByte === 0 ? 'inbound' : 'outbound';
  const connectionId = [...buffer.slice(1, 9)]
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('');
  const chunkNumber = dv.getUint32(9);
  const time = dv.getUint32(13);
  const chunk = buffer.slice(17);

  return <TunnelChunk>{
    connectionId,
    direction,
    chunkNumber,
    time,
    chunk,
  };
}

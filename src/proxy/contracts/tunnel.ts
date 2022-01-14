import { Socket } from "net";
import { Buffer } from "buffer";

export interface Statistic {
  inboundTraffic: number;
  outboundTraffic: number;
  traffic: number;
  requests: number;
  responses: number;
}

export type TunnelPacketState = "open" | "closed" | "active";

export interface TunnelPacket {
  id: string; // hexadecimal, length: 16
  connectionId: string;
  time: number; // in ms
  type: "http" | "tcp";
  direction: "in" | "out";
  state: TunnelPacketState;
  chunksNumber: number;
  trafficBytes: number;
}

/**
 * Length   Position
 * 8 bytes: 0 - 7    - chunk id
 * 4 bytes: 8 - 11   - chunk sequence number
 * ...      12 - end - chunk payload
 */
export interface TunnelPacketChunk extends Buffer {}

export interface Tunnel {
  /**
   * If tunnel HTTP or TCP
   */
  http: boolean;

  readonly address: string;
  readonly port: number;

  statistic: Readonly<Statistic>;

  serve(socket: Socket);

  on(event: "tunnel-packet", listener: (packet: TunnelPacket) => void);
  on(event: "tunnel-packet-data", listener: (chunk: TunnelPacketChunk) => void);
  on(event: "close", listener: () => void);
  on(event: "tcp-forward-error", listener: (err: Error) => void);
}

import { Socket } from "net";

export interface Statistic {
  inboundTraffic: number;
  outboundTraffic: number;
  traffic: number;
  requests: number;
  responses: number;
}

export type TunnelPacketState = "open" | "closed" | "error";

export interface TunnelPacket {
  id: string;
  time: number; // in ms
  type: "http" | "tcp";
  state: TunnelPacketState;
  chunksCnt: number;
  trafficBytes: number;
}

export interface TunnelChunk {
  connectionId: string;
  direction: "inbound" | "outbound";
  chunkNumber: number;
  chunk: Buffer;
}

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

  on(event: "tunnel-packet-data", listener: (chunk: TunnelChunk) => void);

  on(event: "close", listener: () => void);

  on(event: "tcp-forward-error", listener: (err: Error) => void);
}

import { Socket } from "net";

export interface Statistic {
  inboundTraffic: number;
  outboundTraffic: number;
  traffic: number;
  requests: number;
  responses: number;
}

export interface TunnelRequest {
  bindAddr: string;
  bindPort: number;
  username: string;
  accept: (address: string, port: number) => void;
  reject: () => void;
}

export type TunnelPacketState = "open" | "closed" | "error";

export interface TunnelPacket {
  id: string; // hexadecimal with length 16
  timestamp: number; // in ms
  state: TunnelPacketState;
  chunksCnt: number;
  trafficBytes: number;
}

export interface TunnelChunk {
  connectionId: string; // hexadecimal with length 16
  direction: "inbound" | "outbound";
  chunkNumber: number;
  time: number; // time lasts after connection was opened in ms
  chunk: Buffer;
}

export interface Tunnel {
  /**
   * If tunnel HTTP or TCP
   */
  http: boolean;

  /**
   * Proxy public address (for HTTP connections)
   */
  readonly hostname: string;

  /**
   * Proxy public port(for TCP connections)
   */
  readonly port: number;

  statistic: Readonly<Statistic>;

  serve(socket: Socket);

  on(event: "tunnel-packet", listener: (packet: TunnelPacket) => void);

  on(event: "tunnel-packet-data", listener: (chunk: TunnelChunk) => void);

  on(event: "close", listener: () => void);

  on(event: "tcp-forward-error", listener: (err: Error) => void);
}

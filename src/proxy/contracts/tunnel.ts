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
  reject: (err: string) => void;
}

export interface Tunnel extends TunnelEventsSource {
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

  on(event: "connection", listener: (packet: TunnelConnection) => void);

  on(event: "connection-chunk", listener: (chunk: TunnelChunk) => void);

  on(event: "close", listener: () => void);

  on(event: "tcp-forward-error", listener: (err: Error) => void);
}

export type TunnelPacketState = "open" | "closed" | "error";

export interface TunnelConnection {
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
  chunk: Uint8Array;
}

export interface TunnelEventsSource {
  on(
    event: "connection",
    listener: (connection: TunnelConnection) => void
  ): void;

  on(event: "connection-chunk", listener: (chunk: TunnelChunk) => void): void;
}

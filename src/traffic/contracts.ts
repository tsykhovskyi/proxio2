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
  chunk: Buffer;
}

export interface TunnelEventsSource {
  on(event: "connection", listener: (connection: TunnelConnection) => void);

  on(event: "connection-chunk", listener: (chunk: TunnelChunk) => void);
}

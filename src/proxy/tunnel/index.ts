import { Socket } from "net";

export interface Statistic {
  inboundTraffic: number;
  outboundTraffic: number;
  traffic: number;
  requests: number;
  responses: number;
}

// type Traffic = Property<>;

export interface Tunnel {
  /**
   * If tunnel HTTP or TCP
   */
  http: boolean;

  readonly address: string;
  readonly port: number;

  statistic: Readonly<Statistic>;

  serve(socket: Socket);

  channelWrite(message: string): void;

  on(
    event: "data",
    listener: (
      chunk: Buffer,
      direction: "inbound" | "outbound",
      address: string | null,
      port: string | null
    ) => void
  );

  on(event: "close", listener: () => void);

  on(event: "tcp-forward-error", listener: (err: Error) => void);
}

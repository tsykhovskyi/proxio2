import { Socket } from "net";

export interface Statistic {
  incomingTraffic: number;
  outgoingTraffic: number;
  traffic: number;
}

export interface Tunnel {
  readonly bindAddr: string;
  readonly bindPort: number;
  statistic: Readonly<Statistic>;

  serve(socket: Socket);
  channelWrite(message: string): void;

  on(event: "close", listener: () => void);
  on(event: "tcp-forward-error", listener: (err: Error) => void);
}

import { Socket } from "net";

export interface Statistic {
  incomingTraffic: number;
  outgoingTraffic: number;
  traffic: number;
}

export interface Tunnel {
  /**
   * If tunnel HTTP or TCP
   */
  readonly http: boolean;

  readonly address: string;
  readonly port: number;

  statistic: Readonly<Statistic>;

  serve(socket: Socket);
  channelWrite(message: string): void;

  on(event: "close", listener: () => void);
  on(event: "tcp-forward-error", listener: (err: Error) => void);
}

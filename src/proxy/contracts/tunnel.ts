import { Socket } from "net";
import {
  TunnelChunk,
  TunnelConnection,
} from "../../../monitor-app/src/common/traffic";
import { TunnelEventsSource } from "../../../monitor-app/src/common/traffic/contracts";

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

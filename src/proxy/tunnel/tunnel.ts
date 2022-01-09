import { Duplex } from "stream";

export interface Tunnel {
  readonly bindAddr: string;
  readonly bindPort: number;

  forwardSocket(socket: Duplex);
}

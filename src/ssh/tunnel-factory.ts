import { Connection } from "ssh2";
import { HttpSshTunnel, TcpSshTunnel } from "./tunnel";

export function createTunnel(
  connection: Connection,
  address: string,
  bindAddress: string,
  bindPort: number
) {
  if (bindPort === 80) {
    return new HttpSshTunnel(address, bindAddress, connection);
  }
  return new TcpSshTunnel(bindAddress, bindPort, connection);
}

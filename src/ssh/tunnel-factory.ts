import { Connection } from "ssh2";
import { HttpSshTunnel, TcpSshTunnel } from "./tunnel";

export function createTunnel(
  connection: Connection,
  address: string,
  bindAddress: string,
  port: number
) {
  if (address) {
    return new HttpSshTunnel(address, bindAddress, connection);
  } else if (port) {
    return new TcpSshTunnel(port, connection);
  } else {
    throw new Error("Undefined tunnel type");
  }
}

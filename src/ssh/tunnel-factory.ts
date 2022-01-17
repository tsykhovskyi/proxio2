import { Connection } from "ssh2";
import { HttpSshTunnel, TcpSshTunnel } from "./tunnel";
import { config } from "../config";

export function createTunnel(
  connection: Connection,
  address?: string,
  port?: number
) {
  if (address) {
    return new HttpSshTunnel(address, config.httpPort, connection);
  } else if (port) {
    return new TcpSshTunnel("127.0.0.1", port, connection);
  } else {
    throw new Error("Undefined tunnel type");
  }
}

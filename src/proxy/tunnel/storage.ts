import { Tunnel } from "../contracts/tunnel";
import { config } from "../../config";

export class TunnelStorage {
  private tcpTunnels = new Map<number, Tunnel>();
  private httpTunnels = new Map<string, Tunnel>();

  add(tunnel: Tunnel): boolean {
    if (tunnel.port === config.httpPort) {
      return this.addHttpTunnel(tunnel);
    }

    return this.addTcpTunnel(tunnel);
  }

  delete(tunnel: Tunnel) {
    if (tunnel.port === config.httpPort) {
      this.httpTunnels.delete(tunnel.hostname);
    }

    this.tcpTunnels.delete(tunnel.port);
  }

  find(bindAddr: string | null, bindPort: number): Tunnel | null {
    if (bindPort === config.httpPort && bindAddr !== null) {
      return this.httpTunnels.get(bindAddr) ?? null;
    }
    if (bindPort !== null) {
      return this.tcpTunnels.get(bindPort) ?? null;
    }

    return null;
  }

  findHttp(host: string) {
    return this.httpTunnels.get(host) ?? null;
  }

  findTcp(port: number) {
    return this.tcpTunnels.get(port) ?? null;
  }

  private addHttpTunnel(tunnel: Tunnel): boolean {
    if (this.httpTunnels.has(tunnel.hostname)) {
      return false;
    }

    this.httpTunnels.set(tunnel.hostname, tunnel);
    return true;
  }

  private addTcpTunnel(tunnel: Tunnel): boolean {
    if (this.tcpTunnels.has(tunnel.port)) {
      return false;
    }

    this.tcpTunnels.set(tunnel.port, tunnel);
    return true;
  }
}

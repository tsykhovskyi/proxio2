import { Tunnel } from "./tunnel";

export class TunnelStorage {
  private tcpTunnels = new Map<number, Tunnel>();
  private httpTunnels = new Map<string, Tunnel>();

  add(tunnel: Tunnel): boolean {
    if (tunnel.bindPort === 80) {
      return this.addHttpTunnel(tunnel);
    }

    return this.addTcpTunnel(tunnel);
  }

  delete(tunnel: Tunnel) {
    if (tunnel.bindPort === 80) {
      this.httpTunnels.delete(tunnel.bindAddr);
    }

    this.tcpTunnels.delete(tunnel.bindPort);
  }

  find(bindAddr: string | null, bindPort: number): Tunnel | null {
    if (bindPort === 80 && bindAddr !== null) {
      return this.httpTunnels.get(bindAddr) ?? null;
    }
    if (bindPort !== null) {
      return this.tcpTunnels.get(bindPort) ?? null;
    }

    return null;
  }

  private addHttpTunnel(tunnel: Tunnel): boolean {
    if (this.httpTunnels.has(tunnel.bindAddr)) {
      return false;
    }

    this.httpTunnels.set(tunnel.bindAddr, tunnel);
    return true;
  }

  private addTcpTunnel(tunnel: Tunnel): boolean {
    if (this.tcpTunnels.has(tunnel.bindPort)) {
      return false;
    }

    this.tcpTunnels.set(tunnel.bindPort, tunnel);
    return true;
  }
}

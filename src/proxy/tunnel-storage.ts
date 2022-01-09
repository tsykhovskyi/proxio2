import { Connection } from "ssh2";

export interface TunnelRequest {
  /**
   * address requested by user as a proxy
   */
  bindAddr: string;
  /**
   * proxy port requested by user
   */
  bindPort: number;

  sshConnection: Connection;
}

export class TunnelStorage {
  private tcpTunnels = new Map<number, TunnelRequest>();
  private httpTunnels = new Map<string, TunnelRequest>();

  add(tunnel: TunnelRequest): boolean {
    if (tunnel.bindPort === 80) {
      return this.addHttpTunnel(tunnel);
    }

    return this.addTcpTunnel(tunnel);
  }

  find(bindAddr: string | null, bindPort: number): TunnelRequest | null {
    if (bindPort === 80 && bindAddr !== null) {
      return this.httpTunnels.get(bindAddr) ?? null;
    }
    if (bindPort !== null) {
      return this.tcpTunnels.get(bindPort) ?? null;
    }

    return null;
  }

  private addHttpTunnel(tunnel: TunnelRequest): boolean {
    if (this.httpTunnels.has(tunnel.bindAddr)) {
      return false;
    }

    this.httpTunnels.set(tunnel.bindAddr, tunnel);
    return true;
  }

  private addTcpTunnel(tunnel: TunnelRequest): boolean {
    if (this.tcpTunnels.has(tunnel.bindPort)) {
      return false;
    }

    this.tcpTunnels.set(tunnel.bindPort, tunnel);
    return true;
  }
}

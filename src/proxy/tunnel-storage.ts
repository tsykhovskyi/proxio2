import { Connection } from "ssh2";

export interface TunnelInterface {
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
  private tcpTunnels = new Map<number, TunnelInterface>();
  private httpTunnels = new Map<string, TunnelInterface>();

  add(tunnel: TunnelInterface): boolean {
    if (tunnel.bindPort === 80) {
      return this.addHttpTunnel(tunnel);
    }

    return this.addTcpTunnel(tunnel);
  }

  find(bindAddr: string | null, bindPort: number): TunnelInterface | null {
    if (bindPort === 80 && bindAddr !== null) {
      return this.httpTunnels.get(bindAddr) ?? null;
    }
    if (bindPort !== null) {
      return this.tcpTunnels.get(bindPort) ?? null;
    }

    return null;
  }

  private addHttpTunnel(tunnel: TunnelInterface): boolean {
    if (this.httpTunnels.has(tunnel.bindAddr)) {
      return false;
    }

    this.httpTunnels.set(tunnel.bindAddr, tunnel);
    return true;
  }

  private addTcpTunnel(tunnel: TunnelInterface): boolean {
    if (this.tcpTunnels.has(tunnel.bindPort)) {
      return false;
    }

    this.tcpTunnels.set(tunnel.bindPort, tunnel);
    return true;
  }
}

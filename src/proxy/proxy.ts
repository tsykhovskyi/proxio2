import { SshServer, SshServerInterface, TunnelRequest } from "../ssh/server";
import { TunnelStorage } from "./tunnel-storage";
import { Tunnel } from "./tunnel";
import { ServersController } from "./servers-controller";
import { Socket } from "net";

export class ProxyServer {
  private sshServer: SshServerInterface;
  private proxyServer: ServersController;
  private tunnelStorage: TunnelStorage;

  constructor() {
    this.sshServer = new SshServer();
    this.proxyServer = new ServersController();
    this.tunnelStorage = new TunnelStorage();
  }

  onTunnelRequest(request: TunnelRequest) {
    if (!this.tunnelStorage.find(request.bindAddr, request.bindPort)) {
      request.accept(request.bindAddr, request.bindPort);
    } else {
      request.reject();
    }
  }

  onTunnelOpened(tunnel: Tunnel) {
    this.proxyServer.addTunnel(tunnel);
    this.tunnelStorage.add(tunnel);

    if (tunnel.http) {
      tunnel.channelWrite(
        `Proxy opened on\nhttp://${tunnel.address}\nhttps://${tunnel.address}\n`
      );
    } else {
      tunnel.channelWrite(`Proxy opened on ${tunnel.port} port\n`);
    }

    tunnel.on("close", () => {
      this.proxyServer.deleteTunnel(tunnel);
      this.tunnelStorage.delete(tunnel);
    });
  }

  onHttpConnection(host: string, socket: Socket) {
    const tunnel = this.tunnelStorage.findHttp(host);
    if (!tunnel) {
      return socket.end();
    }
    tunnel.serve(socket);
  }

  onTcpConnection(port: number, socket: Socket) {
    const tunnel = this.tunnelStorage.findTcp(port);
    if (!tunnel) {
      return socket.end();
    }
    tunnel.serve(socket);
  }

  run() {
    this.sshServer.on("tunnel-requested", this.onTunnelRequest.bind(this));
    this.sshServer.on("tunnel-opened", this.onTunnelOpened.bind(this));

    this.proxyServer.on("http-connection", this.onHttpConnection.bind(this));
    this.proxyServer.on("tcp-connection", this.onTcpConnection.bind(this));

    this.sshServer.run();
    this.proxyServer.run();
  }
}

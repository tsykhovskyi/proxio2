import { SshServer, SshServerInterface, TunnelRequest } from "../ssh/server";
import { TunnelStorage } from "./tunnel-storage";
import { ServersController } from "./servers-controller";
import { Socket } from "net";
import EventEmitter from "events";
import { Tunnel } from "./contracts/tunnel";

export declare interface ProxyServer {
  on(
    event: "tunnel-opened" | "tunnel-closed",
    listener: (tunnel: Tunnel) => void
  );
}

export class ProxyServer extends EventEmitter {
  private sshServer: SshServerInterface;
  private proxyServer: ServersController;
  private tunnelStorage: TunnelStorage;

  constructor() {
    super();
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
    this.emit("tunnel-opened", tunnel);

    this.proxyServer.addTunnel(tunnel);
    this.tunnelStorage.add(tunnel);

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

  stop() {
    this.proxyServer.stop();
    this.sshServer.stop();
  }
}

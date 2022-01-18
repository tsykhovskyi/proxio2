import { SshServer, SshServerInterface, TunnelRequest } from "../ssh/server";
import { TunnelStorage } from "./tunnel-storage";
import { ServersController } from "./servers-controller";
import { Socket } from "net";
import EventEmitter from "events";
import { Tunnel } from "./contracts/tunnel";
import { TunnelRequestHandler } from "./tunnel-request-handler";

export declare interface ProxyServer {
  on(
    event: "tunnel-opened" | "tunnel-closed",
    listener: (tunnel: Tunnel) => void
  );
}

export class ProxyServer extends EventEmitter {
  private readonly sshServer: SshServerInterface;
  private readonly serversController: ServersController;
  private readonly tunnelStorage: TunnelStorage;
  private readonly requestHandler: TunnelRequestHandler;

  constructor() {
    super();
    this.sshServer = new SshServer();
    this.serversController = new ServersController();
    this.tunnelStorage = new TunnelStorage();
    this.requestHandler = new TunnelRequestHandler(this.tunnelStorage);
  }

  onTunnelRequest(request: TunnelRequest) {
    const res = this.requestHandler.handle(request);
    if (res === false) {
      return request.reject();
    }

    request.accept(res.hostname, res.port);
  }

  onTunnelOpened(tunnel: Tunnel) {
    this.emit("tunnel-opened", tunnel);

    this.serversController.addTunnel(tunnel);
    this.tunnelStorage.add(tunnel);

    tunnel.on("close", () => {
      this.serversController.deleteTunnel(tunnel);
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

    this.serversController.on(
      "http-connection",
      this.onHttpConnection.bind(this)
    );
    this.serversController.on(
      "tcp-connection",
      this.onTcpConnection.bind(this)
    );

    this.sshServer.run();
    this.serversController.run();
  }

  stop() {
    this.serversController.stop();
    this.sshServer.stop();
  }
}

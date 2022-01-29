import { Tunnel } from "../../proxy/contracts/tunnel";
import { PseudoTtyInfo, ServerChannel } from "ssh2";
import { Terminal, WindowSize } from "./terminal";
import EventEmitter from "events";
import { HttpTunnelView } from "./view/http-tunnel-view";
import { TcpTunnelView } from "./view/tcp-tunnel-view";
import { TunnelView } from "./view/tunnel-view";

export class Channel extends EventEmitter {
  private terminal: Terminal;
  private view: TunnelView;

  constructor(tunnel: Tunnel, sshChannel: ServerChannel, info: PseudoTtyInfo) {
    super();
    this.view = tunnel.http
      ? new HttpTunnelView(tunnel)
      : new TcpTunnelView(tunnel);
    this.terminal = new Terminal(sshChannel, info);
  }

  init() {
    this.view.on("update", () => this.updateStatistics());

    this.terminal.setTitle(this.view.title());

    this.updateStatistics();
  }

  private updateStatistics() {
    const lines = this.view.render();
    this.terminal.setLines(lines);
  }

  windowResize(size: WindowSize) {
    this.updateStatistics();
    this.terminal.resize(size);
  }
}

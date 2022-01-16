import { Tunnel } from "../../proxy/contracts/tunnel";
import { PseudoTtyInfo, ServerChannel } from "ssh2";
import { Terminal, WindowSize } from "./terminal";

export class Channel {
  private terminal: Terminal;

  constructor(
    private tunnel: Tunnel,
    sshChannel: ServerChannel,
    info: PseudoTtyInfo
  ) {
    this.terminal = new Terminal(sshChannel, info);
  }

  init() {
    this.terminal.setTitle(`Proxio tunnel: ${this.tunnel.address}`);

    this.terminal.setInfo([
      ["{bold}Tunnel{/bold}", ""],
      null,
      ["Web interface", "https://monitor.localhost:3000"],
      ["Http forwarding", `http://${this.tunnel.address}`],
      ["Https forwarding", `https://${this.tunnel.address}`],
    ]);
  }

  windowResize(size: WindowSize) {
    this.terminal.resize(size);
  }
}

import { Tunnel, TunnelPacket } from "../proxy/contracts/tunnel";
import { ServerChannel } from "ssh2";

export class ShellChannel {
  private tunnel: Tunnel | null = null;
  private channel: ServerChannel | null = null;
  private messagesBuffer: string[] = [];

  constructor() {}

  setTunnel(tunnel: Tunnel) {
    this.tunnel = tunnel;

    this.onTunnelAdded(tunnel);
    tunnel.on("tunnel-packet", this.onTunnelPacket.bind(this));
  }

  setChannel(channel: ServerChannel) {
    this.channel = channel;
    this.flushBufferedMessages();
  }

  private onTunnelAdded(tunnel: Tunnel) {
    if (tunnel.http) {
      this.write(
        `Proxy opened on\nhttp://${tunnel.address}\nhttps://${tunnel.address}\n`
      );
    } else {
      this.write(`Proxy opened on ${tunnel.port} port\n`);
    }
  }

  private onTunnelPacket(packet: TunnelPacket): void {
    if (packet.state === "open") {
      this.write("Request started\n");
    }
    if (packet.state === "closed") {
      this.write(`Request finished. ${packet.trafficBytes} bytes\n`);
    }
  }

  private write(str: string): boolean {
    if (this.channel === null) {
      this.messagesBuffer.push(str);
      return false;
    }
    this.flushBufferedMessages();
    return this.channel.write(str);
  }

  private flushBufferedMessages() {
    if (!this.channel) {
      return;
    }
    if (this.messagesBuffer.length) {
      let message;
      while ((message = this.messagesBuffer.shift())) {
        this.channel.write(message);
      }
    }
  }
}

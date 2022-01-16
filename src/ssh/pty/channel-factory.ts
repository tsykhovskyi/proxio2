import { PseudoTtyInfo, ServerChannel } from "ssh2";
import { Tunnel } from "../../proxy/contracts/tunnel";
import { Channel } from "./channel";

export class ChannelFactory {
  private channel: Promise<ServerChannel>;
  private channelResolver = (channel: ServerChannel) => {};

  private tunnel: Promise<Tunnel>;
  private tunnelResolver = (tunnel: Tunnel) => {};

  private ptyInfo: Promise<PseudoTtyInfo>;
  private ptyInfoResolver = (info: PseudoTtyInfo) => {};

  constructor() {
    this.channel = new Promise<ServerChannel>(
      (res) => (this.channelResolver = res)
    );
    this.tunnel = new Promise<Tunnel>((res) => (this.tunnelResolver = res));
    this.ptyInfo = new Promise<PseudoTtyInfo>(
      (res) => (this.ptyInfoResolver = res)
    );
  }

  setChannel(channel: ServerChannel) {
    this.channelResolver(channel);
  }

  setTunnel(tunnel: Tunnel) {
    this.tunnelResolver(tunnel);
  }

  setPtyInfo(info: PseudoTtyInfo) {
    this.ptyInfoResolver(info);
  }

  async getPtyChannel() {
    return Promise.all([this.tunnel, this.channel, this.ptyInfo]).then(
      ([tunnel, channel, info]) => {
        return new Channel(tunnel, channel, info);
      }
    );
  }
}

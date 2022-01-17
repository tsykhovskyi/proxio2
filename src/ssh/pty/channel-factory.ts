import { PseudoTtyInfo, ServerChannel } from "ssh2";
import { Tunnel } from "../../proxy/contracts/tunnel";
import { Channel } from "./channel";

export class ChannelFactory {
  private channelResolver = (channel: ServerChannel) => {};
  private tunnelResolver = (tunnel: Tunnel) => {};
  private ptyInfoResolver = (info: PseudoTtyInfo) => {};

  public readonly result: Promise<Channel>;

  constructor() {
    this.result = Promise.all([
      new Promise<Tunnel>((res) => (this.tunnelResolver = res)),
      new Promise<ServerChannel>((res) => (this.channelResolver = res)),
      new Promise<PseudoTtyInfo>((res) => (this.ptyInfoResolver = res)),
    ]).then(([tunnel, channel, info]) => {
      return new Channel(tunnel, channel, info);
    });
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
}

import { Statistic, Tunnel } from "../proxy/tunnel";
import EventEmitter from "events";
import { Socket } from "net";
import { mutualPipe } from "../proxy/stream";
import { Connection, ServerChannel } from "ssh2";

// type SshTunnelEvents = {
//   'tcp-forward-error': (err: Error) => void
// }

export class SshTunnel extends EventEmitter implements Tunnel {
  private channel: ServerChannel | null = null;
  private messagesBuffer: string[] = [];

  statistic: Readonly<Statistic> = {
    incomingTraffic: 0,
    outgoingTraffic: 0,
    traffic: 0,
  };

  constructor(
    public readonly bindAddr: string,
    public readonly bindPort: number,
    private readonly sshConnection: Connection
  ) {
    super();
  }

  serve(socket: Socket) {
    if (!socket.remoteAddress || !socket.remotePort) {
      return;
    }

    this.sshConnection.forwardOut(
      this.bindAddr,
      this.bindPort,
      socket.remoteAddress,
      socket.remotePort,
      (err, sshChannel) => {
        if (err) {
          this.emit("tcp-forward-error", err);
          return;
        }
        mutualPipe(socket, sshChannel);
      }
    );
  }

  close(reason: string) {
    console.log("Connection closed: ", reason);
    this.emit("close", reason);
  }

  setChannel(channel: ServerChannel) {
    this.channel = channel;
    for (const bufMsg of this.messagesBuffer) {
      this.channel.write(bufMsg);
    }
  }

  channelWrite(str: string) {
    if (this.channel === null) {
      this.messagesBuffer.push(str);
      return;
    }
    this.channel.write(str);
  }
}

import { Statistic, Tunnel } from "../proxy/tunnel";
import EventEmitter from "events";
import { Socket } from "net";
import {
  emptyResponse,
  mutualPipe,
  remoteHostIsUnreachableResponse,
} from "../proxy/stream";
import { Connection, ServerChannel } from "ssh2";

export class SshTunnel extends EventEmitter implements Tunnel {
  public readonly http;
  private channel: ServerChannel | null = null;
  private messagesBuffer: string[] = [];

  statistic: Readonly<Statistic> = {
    incomingTraffic: 0,
    outgoingTraffic: 0,
    traffic: 0,
  };

  constructor(
    public readonly address: string,
    public readonly port: number,
    private readonly sshConnection: Connection
  ) {
    super();
    this.http = port === 80;
  }

  serve(socket: Socket) {
    if (!socket.remoteAddress || !socket.remotePort) {
      return;
    }

    this.sshConnection.forwardOut(
      this.address,
      this.port,
      socket.remoteAddress,
      socket.remotePort,
      (err, sshChannel) => {
        if (err) {
          if (this.http) {
            mutualPipe(
              socket,
              remoteHostIsUnreachableResponse(
                `http://${socket.remoteAddress}:${socket.remotePort}`,
                err
              )
            );
          } else {
            mutualPipe(socket, emptyResponse());
          }
          this.emit("tcp-forward-error", err);
        } else {
          mutualPipe(socket, sshChannel);
        }
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

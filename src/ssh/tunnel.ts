import { Tunnel } from "../proxy/tunnel";
import EventEmitter from "events";
import { Socket } from "net";
import { mutualPipe, remoteHostIsUnreachableResponse } from "../proxy/stream";
import { Connection, ServerChannel } from "ssh2";
import { TunnelStatistic } from "./tunnel-statistic";

export abstract class SshTunnel extends EventEmitter {
  statistic = new TunnelStatistic();

  private channel: ServerChannel | null = null;
  private messagesBuffer: string[] = [];

  constructor(
    public readonly address: string,
    public readonly port: number,
    protected sshConnection: Connection
  ) {
    super();
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
          this.handleServeError(err, socket);
          this.emit("tcp-forward-error", err);
          return;
        }

        socket.pipe(sshChannel).pipe(socket);

        socket.on("data", (chunk) => {
          this.statistic.inboundChunk(chunk);
          this.emit("data", chunk, "inbound", this.address, this.port);
        });
        sshChannel.on("data", (chunk) => {
          this.statistic.outboundChunk(chunk);
          this.emit("data", chunk, "outbound", this.address, this.port);
        });

        socket.on("end", () => this.statistic.request());
        sshChannel.on("end", () => this.statistic.response());
      }
    );
  }

  abstract handleServeError(err: Error, socket: Socket);
}

export class TcpSshTunnel extends SshTunnel implements Tunnel {
  readonly http = false;

  handleServeError(err: Error, socket: Socket) {
    socket.end();
  }
}

export class HttpSshTunnel extends SshTunnel implements Tunnel {
  readonly http = true;

  handleServeError(err: Error, socket: Socket) {
    mutualPipe(
      socket,
      remoteHostIsUnreachableResponse(
        `https://${socket.remoteAddress}:${socket.remotePort}`,
        err
      )
    );
  }
}
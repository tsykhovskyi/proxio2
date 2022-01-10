import { Statistic, Tunnel } from "../proxy/tunnel";
import EventEmitter from "events";
import { Socket } from "net";
import { mutualPipe, remoteHostIsUnreachableResponse } from "../proxy/stream";
import { Connection, ServerChannel } from "ssh2";
import { Transform, TransformCallback } from "stream";

export abstract class SshTunnel extends EventEmitter {
  statistic: Statistic = {
    incomingTraffic: 0,
    outgoingTraffic: 0,
    traffic: 0,
  };

  private channel: ServerChannel | null = null;
  private messagesBuffer: string[] = [];

  constructor(
    public readonly address: string,
    public readonly port: number,
    protected sshConnection: Connection
  ) {
    super();
  }

  createCounter(direction: "in" | "out") {
    const statistic = this.statistic;

    return new Transform({
      transform(
        chunk: any,
        encoding: BufferEncoding,
        callback: TransformCallback
      ) {
        if (direction === "in") {
          statistic.incomingTraffic += chunk.length;
        }
        if (direction === "out") {
          statistic.outgoingTraffic += chunk.length;
        }
        statistic.traffic += chunk.length;
        console.log(statistic);
        callback(null, chunk);
      },
    });
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
          return this.emit("tcp-forward-error", err);
        }

        socket.pipe(this.trafficCounter("in")).pipe(sshChannel);
        sshChannel.pipe(this.trafficCounter("out")).pipe(socket);
      }
    );
  }

  abstract handleServeError(err: Error, socket: Socket);
  abstract trafficCounter(direction: "in" | "out"): Transform;
}

export class TcpSshTunnel extends SshTunnel implements Tunnel {
  readonly http = false;

  handleServeError(err: Error, socket: Socket) {
    socket.end();
  }

  trafficCounter(direction: "in" | "out"): Transform {
    return this.createCounter(direction);
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

  trafficCounter(direction: "in" | "out"): Transform {
    return this.createCounter(direction);
  }
}

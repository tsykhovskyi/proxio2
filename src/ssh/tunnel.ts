import EventEmitter from "events";
import { Socket } from "net";
import { mutualPipe, remoteHostIsUnreachableResponse } from "../proxy/stream";
import { Connection, ServerChannel } from "ssh2";
import { TunnelStatistic } from "./tunnel-statistic";
import {
  Tunnel,
  TunnelPacket,
  TunnelPacketState,
} from "../proxy/contracts/tunnel";
import { randomBytes } from "crypto";

export abstract class SshTunnel extends EventEmitter implements Tunnel {
  readonly http;
  statistic = new TunnelStatistic();

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

        this.forwardSshChannel(socket, sshChannel);
      }
    );
  }

  /**
   * Forwards traffic:
   * - from Net socket to SSH channel (inbound traffic)
   * - from SSH channel to Net socket (outbound traffic)
   *
   * Listens socket, channel events to emit `tunnel-packet`, `tunnel-packet-data` events.
   */
  protected forwardSshChannel(socket: Socket, sshChannel: ServerChannel) {
    const connectionId = randomBytes(8).toString("hex");
    let chunksCnt = 0;
    let trafficBytes = 0;

    const onStateChange = (state: TunnelPacketState) =>
      this.emit("tunnel-packet", <TunnelPacket>{
        id: connectionId,
        time: Date.now(),
        type: this.http ? "http" : "tcp",
        state,
        chunksCnt,
        trafficBytes,
      });

    const onChunk = (chunk: Buffer, direction: "inbound" | "outbound") => {
      if (chunksCnt === 0) {
        // Handle open event on first chunk
        onStateChange("open");
      }
      trafficBytes += chunk.length;

      this.emit("tunnel-packet-data", {
        connectionId,
        direction,
        chunkNumber: chunksCnt++,
        chunk,
      });
    };

    socket.on("error", () => onStateChange("error"));
    socket.on("close", () => onStateChange("closed"));
    socket.on("data", (chunk) => onChunk(chunk, "inbound"));
    sshChannel.on("data", (chunk) => onChunk(chunk, "outbound"));

    // Start forwarding
    socket.pipe(sshChannel).pipe(socket);
  }

  abstract handleServeError(err: Error, socket: Socket);
}

export class TcpSshTunnel extends SshTunnel {
  readonly http = false;

  handleServeError(err: Error, socket: Socket) {
    socket.end();
  }
}

export class HttpSshTunnel extends SshTunnel {
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

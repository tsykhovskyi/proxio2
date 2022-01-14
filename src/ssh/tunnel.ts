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
import { Duplex } from "stream";

export abstract class SshTunnel extends EventEmitter implements Tunnel {
  readonly http;
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

        this.forwardSshChannel(socket, sshChannel);
      }
    );
  }

  /**
   * Forward traffic:
   * - from Net socket to SSH channel (inbound traffic)
   * - from SSH channel to Net socket (outbound traffic)
   */
  protected forwardSshChannel(socket: Socket, sshChannel: ServerChannel) {
    socket.pipe(sshChannel).pipe(socket);

    const channelId = randomBytes(8);
    this.handleTunnelPacketEvents(channelId, socket, "in");
    this.handleTunnelPacketEvents(channelId, sshChannel, "out");
  }

  /**
   * Handles stream events to emit `tunnel-packet`, `tunnel-packet-data` events.
   */
  protected handleTunnelPacketEvents(
    connectionId: Buffer,
    stream: Duplex,
    direction: "in" | "out"
  ) {
    const packetId = randomBytes(8);
    let chunksCnt = 0;
    let trafficBytes = 0;

    const createPacketUpd = (state: TunnelPacketState) =>
      <TunnelPacket>{
        id: packetId.toString("hex"),
        connectionId: connectionId.toString("hex"),
        time: Date.now(),
        type: this.http ? "http" : "tcp",
        direction,
        state,
        chunksNumber: chunksCnt,
        trafficBytes,
      };

    let packetUpdateInterval;
    stream.on("data", (chunk) => {
      if (chunksCnt === 0) {
        // Emit open event on first chunk
        this.emit("tunnel-packet", createPacketUpd("open"));

        // Update packet state each 2 seconds
        packetUpdateInterval = setInterval(
          () => this.emit("tunnel-packet", createPacketUpd("active")),
          2000
        );
      }

      // Create packet data payload
      const packetChunk = new Buffer(12 + chunk.byteLength);
      packetChunk.set(packetId, 0);
      new DataView(packetChunk.buffer).setUint32(8, chunksCnt);
      packetChunk.set(chunk, 12);

      this.emit("tunnel-packet-data", packetChunk);

      // Update counters
      chunksCnt++;
      trafficBytes += chunk.byteLength;
    });

    stream.on("end", () => {
      clearInterval(packetUpdateInterval);
      this.emit("tunnel-packet", createPacketUpd("closed"));
    });
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

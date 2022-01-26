import { readHeadersBlock } from './headers';
import { EventEmitter } from '../../event-emitter';
import { RequestImpl } from './models/request';
import { HttpRequest } from '../tunnel-parser';
import { MessageImpl } from './models/messageImpl';
import { TunnelChunk } from '../../contracts';

class Payload {
  public readonly chunks = new Map<number, TunnelChunk>();
  public current = -1;

  next(): TunnelChunk | null {
    const nextChunk = this.chunks.get(this.current + 1);
    if (nextChunk) {
      this.current++;
      return nextChunk;
    }
    return null;
  }
}

export declare interface HttpParser {
  on(event: 'request', listener: (request: HttpRequest) => void): void;

  removeAllListeners(event: 'request'): void;
}

export class HttpParser extends EventEmitter {
  private isProcessingHttp: boolean = false;

  private request: RequestImpl | null = null;
  private response: MessageImpl | null = null;

  private inboundChunks = new Payload();
  private outboundChunks = new Payload();

  private closed: boolean = false;
  private totalHttpChunksCnt: null | number = null;
  private connectionDuration: number = 0;
  private connectionStartTime: number = 0;

  chunk(chunk: TunnelChunk) {
    if (this.closed) {
      return;
    }
    const payload =
      chunk.direction === 'inbound' ? this.inboundChunks : this.outboundChunks;

    payload.chunks.set(chunk.chunkNumber, chunk);
    this.check();
  }

  connectionOpened(timestamp: number) {
    this.connectionStartTime = timestamp;
  }

  connectionClosed(chunksCnt: number, timestamp: number) {
    if (this.closed) {
      return;
    }
    this.totalHttpChunksCnt = chunksCnt;
    this.connectionDuration = timestamp - this.connectionStartTime;
    this.check();
  }

  private check() {
    let chunk;
    // Read request chunks
    while (null !== (chunk = this.inboundChunks.next())) {
      if (this.inboundChunks.current === 0) {
        this.initRequest(chunk);
      } else {
        this.request?.data(chunk.chunk, chunk.time);
      }
    }

    // Read response chunks
    while (null !== (chunk = this.outboundChunks.next())) {
      if (this.outboundChunks.current === 0) {
        this.initResponse(chunk);
      } else {
        this.response?.data(chunk.chunk, chunk.time);
      }
    }

    // Check if messages can be closed
    if (
      this.totalHttpChunksCnt !== null &&
      this.totalHttpChunksCnt ===
        this.inboundChunks.current + 1 + (this.outboundChunks.current + 1)
    ) {
      this.request?.close(this.connectionDuration);
      this.response?.close(this.connectionDuration);
    }
  }

  private initRequest(tunnelChunk: TunnelChunk) {
    const chunk = tunnelChunk.chunk;
    const headersBlock = readHeadersBlock(chunk);
    if (headersBlock === null) {
      return this.close();
    }

    this.request = new RequestImpl(headersBlock, tunnelChunk.time);
    this.emit('request', this.request);

    if (headersBlock.raw.byteLength < chunk.byteLength) {
      // If bytes left in first chunk - emit thm as data chunk
      this.request.data(
        chunk.subarray(headersBlock.raw.byteLength),
        tunnelChunk.time
      );
    }
  }

  private initResponse(tunnelChunk: TunnelChunk) {
    const chunk = tunnelChunk.chunk;
    const headersBlock = readHeadersBlock(chunk);
    if (headersBlock === null) {
      return this.close();
    }

    this.response = new MessageImpl(headersBlock, tunnelChunk.time);
    this.request?.response(this.response);
    if (headersBlock.raw.byteLength < chunk.byteLength) {
      this.response.data(
        chunk.subarray(headersBlock.raw.byteLength),
        tunnelChunk.time
      );
    }
  }

  private close() {
    this.closed = true;
  }
}

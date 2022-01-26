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

  on(event: 'close', listener: () => void): void;

  removeAllListeners(event: 'request'): void;
}

export class HttpParser extends EventEmitter {
  private request: RequestImpl | null = null;
  private response: MessageImpl | null = null;

  private payload = new Payload();
  private lastInboundTime = 0;
  private lastOutboundTime = 0;

  private closed: boolean = false;
  private totalHttpChunksCnt: null | number = null;

  chunk(chunk: TunnelChunk) {
    if (this.closed) {
      return;
    }
    this.payload.chunks.set(chunk.chunkNumber, chunk);
    this.check();
  }

  connectionClosed(chunksCnt: number) {
    if (this.closed) {
      return;
    }
    this.totalHttpChunksCnt = chunksCnt;
    this.check();
  }

  private check() {
    let chunk;
    while (null !== (chunk = this.payload.next())) {
      if (this.closed) {
        return;
      }

      if (chunk.direction === 'inbound') {
        this.lastInboundTime = chunk.time;
        // if inbound chunk received
        if (this.request === null && this.response === null) {
          this.initRequest(chunk);
        } else if (this.request !== null && this.response === null) {
          // If request created but response has not yet started
          this.request.data(chunk.chunk, chunk.time);
        } else if (this.request !== null && this.response !== null) {
          // Finish existed http packet and init new request
          this.request.close(this.lastInboundTime);
          this.response.close(this.lastOutboundTime);
          this.request = null;
          this.response = null;

          this.initRequest(chunk);
        } else {
          // Unexpected behaviour
          this.close();
        }
      } else {
        this.lastOutboundTime = chunk.time;
        // if outbound chunk received
        if (this.request === null) {
          // Unexpected behaviour: request should exist
          this.close();
        } else {
          if (this.response === null) {
            this.request.close(this.lastInboundTime);
            this.initResponse(chunk);
          } else {
            this.response.data(chunk.chunk, chunk.time);
            if (this.response.isClosed()) {
              this.request = null;
              this.response = null;
            }
          }
        }
      }
    }

    // Check if messages can be closed
    if (this.totalHttpChunksCnt === this.payload.current + 1) {
      this.request?.close(this.lastInboundTime);
      this.response?.close(this.lastOutboundTime);

      this.close();
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
    this.emit('close');
  }
}

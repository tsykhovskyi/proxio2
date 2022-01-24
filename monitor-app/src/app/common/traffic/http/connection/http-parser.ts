import { readHeadersBlock } from './headers';
import { EventEmitter } from '../../event-emitter';
import { RequestImpl } from './models/request';
import { HttpRequest } from '../tunnel-parser';
import { MessageImpl } from './models/messageImpl';

class Payload {
  public readonly chunks = new Map<number, Uint8Array>();
  public current = -1;

  next(): Uint8Array | null {
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
  private request: RequestImpl | null = null;
  private response: MessageImpl | null = null;

  private inboundChunks = new Payload();
  private outboundChunks = new Payload();

  private closed: boolean = false;
  private totalHttpChunksCnt: null | number = null;

  chunk(
    direction: 'inbound' | 'outbound',
    chunk: Uint8Array,
    chunkNum: number
  ) {
    if (this.closed) {
      return;
    }
    const payload =
      direction === 'inbound' ? this.inboundChunks : this.outboundChunks;

    payload.chunks.set(chunkNum, chunk);
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
    // Read request chunks
    while (null !== (chunk = this.inboundChunks.next())) {
      if (this.inboundChunks.current === 0) {
        this.initRequest(chunk);
      } else {
        this.request?.data(chunk);
      }
    }

    // Read response chunks
    while (null !== (chunk = this.outboundChunks.next())) {
      if (this.outboundChunks.current === 0) {
        this.initResponse(chunk);
      } else {
        this.response?.data(chunk);
      }
    }

    // Check if messages can be closed
    if (
      this.totalHttpChunksCnt !== null &&
      this.totalHttpChunksCnt ===
        this.inboundChunks.current + 1 + (this.outboundChunks.current + 1)
    ) {
      this.request?.close();
      this.response?.close();
    }
  }

  private initRequest(chunk: Uint8Array) {
    const headersBlock = readHeadersBlock(chunk);
    if (headersBlock === null) {
      return this.close();
    }

    this.request = new RequestImpl(headersBlock);
    this.emit('request', this.request);

    if (headersBlock.raw.byteLength < chunk.byteLength) {
      // If bytes left in first chunk - emit thm as data chunk
      this.request.data(chunk.subarray(headersBlock.raw.byteLength));
    }
  }

  private initResponse(chunk: Uint8Array) {
    const headersBlock = readHeadersBlock(chunk);
    if (headersBlock === null) {
      return this.close();
    }

    this.response = new MessageImpl(headersBlock);
    this.request?.response(this.response);
    if (headersBlock.raw.byteLength < chunk.byteLength) {
      this.response.data(chunk.subarray(headersBlock.raw.byteLength));
    }
  }

  private close() {
    this.closed = true;
  }
}

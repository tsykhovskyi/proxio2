import {
  TunnelChunk,
  TunnelConnection,
  TunnelEventsSource,
} from '../contracts';
import { HttpParser } from './connection/http-parser';
import { EventEmitter } from '../event-emitter';

export interface HeaderBlock {
  raw: Uint8Array;

  startLine: [string, string, string];

  headers: Map<string, string>;
}

export interface HttpMessage {
  headerBlock: HeaderBlock;

  bodyLength: number;

  on(event: 'data', listener: (chunk: Uint8Array) => void): void;

  on(event: 'close', listener: () => void): void;
}

export interface HttpRequest extends HttpMessage {
  headerBlock: HeaderBlock;

  on(event: 'response', listener: (response: HttpMessage) => void): void;

  on(event: 'data', listener: (chunk: Uint8Array) => void): void;

  on(event: 'close', listener: () => void): void;
}

export declare interface TunnelParser {
  on(event: 'request', listener: (request: HttpRequest) => void): void;
}

export class TunnelParser extends EventEmitter {
  counter: number = 0;
  private httpParsers = new Map<string, HttpParser>();

  constructor(private source: TunnelEventsSource) {
    super();
    this.subscribe();
  }

  private onConnection(connection: TunnelConnection) {
    const parser = this.getOrInitParser(connection.id);
    if (connection.state === 'closed') {
      parser.connectionClosed(connection.chunksCnt);
    }
  }

  private onConnectionChunk(chunk: TunnelChunk) {
    const httpParser = this.getOrInitParser(chunk.connectionId);

    httpParser.chunk(chunk.direction, chunk.chunk, chunk.chunkNumber);
  }

  private getOrInitParser(connectionId: string): HttpParser {
    let httpParser = this.httpParsers.get(connectionId);
    if (!httpParser) {
      httpParser = new HttpParser();
      this.httpParsers.set(connectionId, httpParser);

      httpParser.on('request', (request) => {
        request.on('response', (response) =>
          response.on('close', () => {
            this.httpParsers.delete(connectionId);
          })
        );
        this.emit('request', request);
      });
    }

    return httpParser;
  }

  private subscribe() {
    this.source.on('connection', this.onConnection.bind(this));
    this.source.on('connection-chunk', this.onConnectionChunk.bind(this));
  }
}

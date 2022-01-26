import {
  TunnelChunk,
  TunnelConnection,
  TunnelEventsSource,
} from '../contracts';
import { HttpParser } from './connection/http-parser';
import { EventEmitter } from '../event-emitter';

export interface HeaderBlock {
  raw: Uint8Array;

  /**
   * Contains 3 values that occur in HTTP start line
   * For request: method uri protocolVersion. For ex. "GET /books/4 HTTP/1.1"
   * For response: protocolVersion statusCode statusMessage. For ex. "HTTP/1.1 404 Not found"
   */
  startLine: [string, string, string];

  /**
   * All header names are lowercase
   */
  headers: Map<Lowercase<string>, string>;
}

export interface HttpMessage {
  headerBlock: HeaderBlock;

  bodyLength: number;

  /**
   * Time in ms after connection was established
   */
  time: number;

  on(event: 'data', listener: (chunk: Uint8Array, time: number) => void): void;

  on(event: 'close', listener: (time: number) => void): void;
}

export interface HttpRequest extends HttpMessage {
  on(event: 'response', listener: (response: HttpMessage) => void): void;

  on(event: 'data', listener: (chunk: Uint8Array, time: number) => void): void;

  on(event: 'close', listener: (time: number) => void): void;
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

    httpParser.chunk(chunk);
  }

  private getOrInitParser(connectionId: string): HttpParser {
    let httpParser = this.httpParsers.get(connectionId);
    if (!httpParser) {
      httpParser = new HttpParser();
      this.httpParsers.set(connectionId, httpParser);

      httpParser.on('request', (request) => {
        this.emit('request', request);
      });
      httpParser.on('close', () => this.httpParsers.delete(connectionId));
    }

    return httpParser;
  }

  private subscribe() {
    this.source.on('connection', this.onConnection.bind(this));
    this.source.on('connection-chunk', this.onConnectionChunk.bind(this));
  }
}

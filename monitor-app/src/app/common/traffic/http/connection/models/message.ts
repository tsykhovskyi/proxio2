import { EventEmitter } from '../../../event-emitter';
import { HttpHeaders, HttpResponse } from '../../tunnel-parser';

export abstract class Message extends EventEmitter {
  public bodyLength: number = 0;
  private expectedBodyLength: number | null = null;
  private closed: boolean = false;

  constructor(public rawHeaders: string, public headers: HttpHeaders) {
    super();

    let bodyLengthHeader = this.headers.find('Content-Length');
    if (null !== bodyLengthHeader) {
      this.expectedBodyLength = parseInt(bodyLengthHeader);
    }
  }

  data(chunk: Uint8Array) {
    this.emit('data', chunk);

    this.bodyLength += chunk.byteLength;
    if (
      this.expectedBodyLength !== null &&
      this.bodyLength >= this.expectedBodyLength
    ) {
      this.close();
    }
  }

  close() {
    if (!this.closed) {
      this.closed = true;
      this.emit('close');
    }
  }
}

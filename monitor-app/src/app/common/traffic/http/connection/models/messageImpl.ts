import { EventEmitter } from '../../../event-emitter';
import { HeaderBlock, HttpMessage } from '../../tunnel-parser';

export class MessageImpl extends EventEmitter implements HttpMessage {
  public bodyLength: number = 0;
  private expectedBodyLength: number | null = null;
  private closed: boolean = false;

  constructor(public headerBlock: HeaderBlock, public time: number) {
    super();

    const bodyLengthHeader = this.headerBlock.headers.get('content-length');
    if (bodyLengthHeader) {
      this.expectedBodyLength = parseInt(bodyLengthHeader);
    }
  }

  data(chunk: Uint8Array, time: number) {
    this.emit('data', chunk, time);

    this.bodyLength += chunk.byteLength;
    if (
      this.expectedBodyLength !== null &&
      this.bodyLength >= this.expectedBodyLength
    ) {
      this.close(time);
    }
  }

  close(time: number) {
    if (!this.closed) {
      this.closed = true;
      this.emit('close', time);
    }
  }

  isClosed() {
    return this.closed;
  }
}

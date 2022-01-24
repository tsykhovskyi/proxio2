import { EventEmitter } from '../../../event-emitter';
import { HeaderBlock } from '../../tunnel-parser';

export class MessageImpl extends EventEmitter {
  public bodyLength: number = 0;
  private expectedBodyLength: number | null = null;
  private closed: boolean = false;

  constructor(public headerBlock: HeaderBlock) {
    super();

    const bodyLengthHeader = this.headerBlock.headers.get('Content-Length');
    if (bodyLengthHeader) {
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

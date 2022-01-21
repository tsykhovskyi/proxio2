import { EventEmitter } from "../../../event-emitter";
import { HttpHeaders, HttpResponse } from "../../tunnel-parser";

export abstract class Message extends EventEmitter {
  public readonly bodyLength: number = 0;
  protected bytesReceived: number = 0;

  constructor(public headers: HttpHeaders) {
    super();

    let bodyLengthStr = this.headers.find("Content-Length");
    if (null !== bodyLengthStr) {
      this.bodyLength = parseInt(bodyLengthStr);
    }
  }

  data(chunk: Uint8Array) {
    this.emit("data", chunk);

    this.bytesReceived += chunk.byteLength;
    if (this.bodyLength && this.bytesReceived >= this.bodyLength) {
      this.close();
    }
  }

  close() {
    this.emit("close");
  }

  response(response: HttpResponse) {
    this.emit("response", response);
  }
}

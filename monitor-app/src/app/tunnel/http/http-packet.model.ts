import { HeaderBlock } from '../../common/traffic/http/tunnel-parser';

export interface HttpMessage {
  headerBlock: HeaderBlock;
  body: Uint8Array | null;
}

export class HttpPacketModel {
  request: HttpMessage;
  response: HttpMessage | null = null;

  constructor(headerBlock: HeaderBlock) {
    this.request = {
      headerBlock,
      body: null,
    };
  }

  setRequestBody(body: Uint8Array) {
    this.request.body = body;
  }

  createResponse(headerBlock: HeaderBlock) {
    this.response = {
      headerBlock,
      body: null,
    };
  }

  setResponseBody(body: Uint8Array) {
    if (this.response) {
      this.response.body = body;
    }
  }
}

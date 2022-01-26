import {
  HeaderBlock,
  HttpRequest as ParserHttpRequest,
  HttpMessage as ParserHttpMessage,
} from '../../common/traffic/http/tunnel-parser';

export interface HttpMessage {
  headerBlock: HeaderBlock;
  body: Uint8Array | null;
}

export interface HttpTiming {
  requestStart: number;
  requestEnd?: number;
  responseStart?: number;
  responseEnd?: number;
}

export class HttpPacketModel {
  request: HttpMessage;
  response: HttpMessage | null = null;

  timing: HttpTiming;

  constructor(request: ParserHttpRequest) {
    this.request = {
      headerBlock: request.headerBlock,
      body: null,
    };
    this.timing = {
      requestStart: request.time,
    };
  }

  setRequestBody(body: Uint8Array, time: number) {
    this.request.body = body;
    this.timing.requestEnd = time;
  }

  createResponse(response: ParserHttpMessage) {
    this.response = {
      headerBlock: response.headerBlock,
      body: null,
    };
    this.timing.responseStart = response.time;
  }

  setResponseBody(body: Uint8Array, time: number) {
    if (this.response) {
      this.response.body = body;
    }
    this.timing.responseEnd = time;
  }
}

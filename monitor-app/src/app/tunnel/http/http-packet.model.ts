import {
  HttpHeaders,
  HttpRequest,
  HttpResponse,
} from '../../common/traffic/http/tunnel-parser';

export interface HttpMessage {
  rawHeaders: string;
  headers: HttpHeaders;
  body: Uint8Array | null;
}

export interface HttpRequestMessage extends HttpMessage {
  method: string;
  uri: string;
}

export interface HttpResponseMessage extends HttpMessage {
  statusCode: number;
  statusMessage: string;
}

export class HttpPacketModel {
  request: HttpRequestMessage;
  response: HttpResponseMessage | null = null;

  constructor(request: HttpRequest) {
    this.request = {
      method: request.method,
      uri: request.uri,
      rawHeaders: request.rawHeaders,
      headers: request.headers,
      body: null,
    };
  }

  setRequestBody(body: Uint8Array) {
    this.request.body = body;
  }

  setResponseBody(body: Uint8Array) {
    if (this.response) {
      this.response.body = body;
    }
  }

  setResponse(response: HttpResponse) {
    this.response = {
      statusCode: response.statusCode,
      statusMessage: response.statusMessage,
      rawHeaders: response.rawHeaders,
      headers: response.headers,
      body: null,
    };
  }
}

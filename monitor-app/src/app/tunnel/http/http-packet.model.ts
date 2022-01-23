import {
  HttpHeaders,
  HttpRequest,
  HttpResponse,
} from '../../common/traffic/http/tunnel-parser';

export interface HttpMessage {
  body: string | null;
  headers: HttpHeaders;
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
      headers: request.headers,
      body: null,
    };
  }

  setRequestBody(body: string) {
    this.request.body = body;
  }

  setResponseBody(body: string) {
    if (this.response) {
      this.response.body = body;
    }
  }

  setResponse(response: HttpResponse) {
    this.response = {
      statusCode: response.statusCode,
      statusMessage: response.statusMessage,
      headers: response.headers,
      body: null,
    };
  }
}

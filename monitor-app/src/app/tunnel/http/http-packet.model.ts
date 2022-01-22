import {
  HttpRequest,
  HttpResponse,
} from '../../common/traffic/http/tunnel-parser';

export class HttpPacketModel {
  request: {
    method: string;
    uri: string;
    headers: [string, string][];
    body: string | null;
  };

  response: {
    statusCode: number;
    statusMessage: string;
    headers: [string, string][];
    body: string | null;
  } | null = null;

  constructor(request: HttpRequest) {
    this.request = {
      method: request.method,
      uri: request.uri,
      headers: request.headers.entries,
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
      headers: response.headers.entries,
      body: null,
    };
  }
}

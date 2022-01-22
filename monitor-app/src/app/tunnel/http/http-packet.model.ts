import {
  HttpRequest,
  HttpResponse,
} from '../../common/traffic/http/tunnel-parser';

export class HttpPacketModel {
  request: {
    method: string;
    uri: string;
  };

  response: {
    statusCode: number;
    statusMessage: string;
  } | null = null;

  constructor(request: HttpRequest) {
    this.request = {
      method: request.method,
      uri: request.uri,
    };
  }

  setResponse(response: HttpResponse) {
    this.response = {
      statusCode: response.statusCode,
      statusMessage: response.statusMessage,
    };
  }
}

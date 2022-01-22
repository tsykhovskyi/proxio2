import { Message } from './message';
import { HttpHeaders, HttpRequest, HttpResponse } from '../../tunnel-parser';

export class RequestImpl extends Message implements HttpRequest {
  constructor(
    public method: string,
    public uri: string,
    public protocol: string,
    public override headers: HttpHeaders
  ) {
    super(headers);
  }

  response(response: HttpResponse) {
    this.emit('response', response);
  }
}

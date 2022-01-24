import { MessageImpl } from './messageImpl';
import { HttpMessage, HttpRequest } from '../../tunnel-parser';

export class RequestImpl extends MessageImpl implements HttpRequest {
  response(response: HttpMessage) {
    this.emit('response', response);
  }
}

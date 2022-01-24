import { Message } from './message';
import { HttpHeaders, HttpResponse } from '../../tunnel-parser';

export class ResponseImpl extends Message implements HttpResponse {
  constructor(
    public protocol: string,
    public statusCode: number,
    public statusMessage: string,
    public override rawHeaders: string,
    public override headers: HttpHeaders
  ) {
    super(rawHeaders, headers);
  }
}

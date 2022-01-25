import { HttpMessage } from '../../../http-packet.model';
import { Injectable } from '@angular/core';

export enum ContentType {
  Undefined,
  HTML,
  JSON,
  Image,
}

@Injectable({
  providedIn: 'root',
})
export class BodyTypeDefiner {
  guess(message: HttpMessage): ContentType {
    const contentType = message.headerBlock.headers.get('content-type');
    if (contentType) {
      if (contentType.startsWith('text/html')) {
        return ContentType.HTML;
      }
      if (contentType.startsWith('application/json')) {
        return ContentType.JSON;
      }
      if (contentType.startsWith('image/')) {
        return ContentType.Image;
      }
    }
    return ContentType.Undefined;
  }
}

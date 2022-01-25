import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { HttpMessage } from '../../../../http-packet.model';
import { SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'http-preview-message-body-image',
  template: ` <img [src]="payload" alt="" class="img-fluid" /> `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageComponent {
  payload: SafeUrl = '';

  constructor() {}

  @Input() set message(message: HttpMessage) {
    const contentType = message.headerBlock.headers.get('content-type');
    if (!contentType || !message.body) {
      return;
    }

    const result = contentType.match(/^image\/([\w]+)/);
    if (!result || !result[1]) {
      return;
    }

    // todo optimize;
    const payloadAscii = message.body.reduce((acc, v) => {
      acc += String.fromCharCode(v);
      return acc;
    }, '');
    const payloadBase64 = btoa(payloadAscii);

    this.payload = `data:image/${result[1]};base64,${payloadBase64}`;
  }
}

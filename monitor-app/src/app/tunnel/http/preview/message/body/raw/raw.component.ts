import { Component, Input } from '@angular/core';
import { HttpMessage } from '../../../../http-packet.model';

@Component({
  selector: 'http-preview-message-body-raw',
  template: ` <pre>{{ body }}</pre> `,
  styles: [
    `
      pre {
        white-space: pre-wrap; /* Since CSS 2.1 */
        white-space: -moz-pre-wrap; /* Mozilla, since 1999 */
        white-space: -o-pre-wrap; /* Opera 7 */
        word-wrap: break-word; /* Internet Explorer 5.5+ */
      }
    `,
  ],
})
export class RawComponent {
  body: string = '';

  @Input() set message(message: HttpMessage) {
    if (message.body) {
      this.body = new TextDecoder().decode(message.body);
    } else {
      this.body = '';
    }
  }
}

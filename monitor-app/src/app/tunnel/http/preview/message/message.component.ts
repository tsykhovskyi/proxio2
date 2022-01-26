import { Component, Input } from '@angular/core';
import { HttpMessage } from '../../http-packet.model';

@Component({
  selector: 'http-preview-message',
  template: `
    <div class="mb-5">
      <http-preview-message-headers
        [message]="message"
      ></http-preview-message-headers>
      <http-message-preview-body
        [message]="message"
      ></http-message-preview-body>
    </div>
  `,
})
export class MessageComponent {
  @Input() message!: HttpMessage;
}

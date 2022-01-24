import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { HttpMessage } from '../../http-packet.model';

@Component({
  selector: 'http-preview-message',
  template: `
    <div>
      <http-preview-message-headers
        [message]="message"
      ></http-preview-message-headers>
      <http-message-preview-body
        [message]="message"
      ></http-message-preview-body>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageComponent {
  @Input() message!: HttpMessage;
}

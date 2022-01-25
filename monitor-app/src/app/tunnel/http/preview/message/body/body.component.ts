import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BodyTypeDefiner, ContentType } from '../service/body-type-definer';
import { HttpMessage } from '../../../http-packet.model';
import { HeaderBlock } from '../../../../../common/traffic/http/tunnel-parser';

@Component({
  selector: 'http-message-preview-body',
  template: `
    <div [ngSwitch]="contentType">
      <http-preview-message-body-html
        *ngSwitchCase="ContentTypes.HTML"
        [message]="message"
      ></http-preview-message-body-html>
      <http-preview-message-body-image
        *ngSwitchCase="ContentTypes.Image"
        [message]="message"
      ></http-preview-message-body-image>
      <http-preview-message-body-json
        *ngSwitchCase="ContentTypes.JSON"
        [message]="message"
      ></http-preview-message-body-json>
      <http-preview-message-body-raw
        *ngSwitchDefault
        [message]="message"
      ></http-preview-message-body-raw>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BodyComponent {
  ContentTypes = ContentType;
  contentType: ContentType | null = null;

  protected _message!: HttpMessage;

  @Input() set message(message: HttpMessage) {
    this._message = message;
    this.contentType = this.typeDefiner.guess(message);
  }

  get message() {
    return this._message;
  }

  constructor(private typeDefiner: BodyTypeDefiner) {}
}

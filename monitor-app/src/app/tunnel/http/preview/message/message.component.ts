import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { HttpMessage } from '../../http-packet.model';
import { BodyTypeDefiner, ContentType } from './service/body-type-definer';

@Component({
  selector: 'http-preview-message',
  template: `
    <div>
      <http-preview-message-headers
        [headers]="message.headers"
      ></http-preview-message-headers>
      <div *ngIf="message.body">
        {{ message.body }}
        <div [ngSwitch]="contentType">
          <!--          <app-html-->
          <!--            *ngSwitchCase="ContentType.HTML"-->
          <!--            [content]="message.body"-->
          <!--          ></app-html>-->
          <!--          <app-image-->
          <!--            *ngSwitchCase="ContentType.Image"-->
          <!--            [content]="message.body"-->
          <!--          ></app-image>-->
          <http-preview-message-body-json
            *ngSwitchCase="ContentTypeJSON"
            [content]="message.body"
          ></http-preview-message-body-json>
          <div *ngSwitchDefault>{{ message.body }}</div>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class MessageComponent implements OnInit, OnChanges {
  ContentTypeJSON = ContentType.JSON;

  @Input() message!: HttpMessage;
  contentType!: ContentType;

  constructor(private typeDefiner: BodyTypeDefiner) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['message']) {
      this.contentType = this.typeDefiner.guess(
        changes['message'].currentValue
      );
    }
  }

  ngOnInit(): void {}
}

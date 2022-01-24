import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BodyTypeDefiner, ContentType } from '../service/body-type-definer';
import { HttpMessage } from '../../../http-packet.model';
import { HeaderBlock } from '../../../../../common/traffic/http/tunnel-parser';

@Component({
  selector: 'http-message-preview-body',
  template: `
    <div *ngIf="message.body">
      <ul ngbNav #bodyNav="ngbNav" [(activeId)]="activeTab" class="nav-tabs">
        <li [ngbNavItem]="1">
          <a ngbNavLink>Pretty</a>
          <ng-template ngbNavContent>
            <div [ngSwitch]="contentType">
              <!--          <app-html-->
              <!--            *ngSwitchCase="ContentType.HTML"-->
              <!--            [content]="message.body"-->
              <!--          ></app-html>-->
              <http-preview-message-body-image
                *ngSwitchCase="ContentTypes.Image"
                [message]="message"
              ></http-preview-message-body-image>
              <http-preview-message-body-json
                *ngSwitchCase="ContentTypes.JSON"
                [message]="message"
              ></http-preview-message-body-json>
            </div>
          </ng-template>
        </li>
        <li [ngbNavItem]="2">
          <a ngbNavLink>Raw</a>
          <ng-template ngbNavContent>
            <div>{{ message.body }}</div>
          </ng-template>
        </li>
      </ul>

      <div [ngbNavOutlet]="bodyNav" class="mb-5"></div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BodyComponent {
  activeTab: number = 1;
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

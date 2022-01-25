import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { HttpMessage } from '../../../../http-packet.model';

type TabName = 'html' | 'raw';

@Component({
  selector: 'http-preview-message-body-html',
  template: `
    <div>
      <ul ngbNav #bodyNav="ngbNav" [(activeId)]="activeTab" class="nav-tabs">
        <li [ngbNavItem]="'html'">
          <a ngbNavLink>HTML</a>
          <ng-template ngbNavContent>
            <iframe [srcdoc]="content"></iframe>
          </ng-template>
        </li>
        <li [ngbNavItem]="'raw'">
          <a ngbNavLink>Raw</a>
          <ng-template ngbNavContent>
            <http-preview-message-body-raw
              [message]="message"
            ></http-preview-message-body-raw>
          </ng-template>
        </li>
      </ul>

      <div [ngbNavOutlet]="bodyNav"></div>
    </div>
  `,
  styles: [
    `
      iframe {
        border: 1px dotted #333;
        width: 100%;
        height: 500px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HtmlComponent {
  activeTab: TabName = 'raw';
  content: string = '';

  private _message!: HttpMessage;

  @Input()
  set message(message: HttpMessage) {
    this._message = message;
    if (message.body) {
      this.content = new TextDecoder().decode(message.body);
    }
  }

  get message() {
    return this._message;
  }
}

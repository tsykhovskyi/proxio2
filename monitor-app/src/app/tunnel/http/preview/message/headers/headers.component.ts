import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { HttpMessage } from '../../../http-packet.model';

@Component({
  selector: 'http-preview-message-headers',
  template: `
    <div>
      <ul
        ngbNav
        #headersNav="ngbNav"
        [(activeId)]="selectedHeaderTab"
        class="nav-tabs"
      >
        <li [ngbNavItem]="1">
          <a ngbNavLink>Headers</a>
          <ng-template ngbNavContent>
            <table class="table table-striped">
              <tbody>
                <tr *ngFor="let entry of headers">
                  <td>{{ toHeaderName(entry[0]) }}</td>
                  <td>{{ entry[1] }}</td>
                </tr>
              </tbody>
            </table>
          </ng-template>
        </li>
        <li [ngbNavItem]="2">
          <a ngbNavLink>Raw</a>
          <ng-template ngbNavContent>
            <pre>{{ headerBlockStr }}</pre>
          </ng-template>
        </li>
      </ul>

      <div [ngbNavOutlet]="headersNav" class="mt-2"></div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeadersComponent {
  selectedHeaderTab = 1;

  headers!: [string, string][];
  headerBlockStr!: string;

  private decoder: TextDecoder;

  constructor() {
    this.decoder = new TextDecoder();
  }

  @Input() set message(message: HttpMessage) {
    this.headers = [...message.headerBlock.headers.entries()];
    this.headerBlockStr = this.decoder.decode(message.headerBlock.raw);
  }

  /**
   * To valid header name
   *
   * For ex.: content-type => Content-Type
   */
  toHeaderName(name: string) {
    return name
      .split('-')
      .map((v) => v[0].toUpperCase() + v.slice(1))
      .join('-');
  }
}

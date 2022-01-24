import { Component, Input, OnInit } from '@angular/core';
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
                <tr *ngFor="let entry of message.headers.entries">
                  <td>{{ entry[0] }}</td>
                  <td>{{ entry[1] }}</td>
                </tr>
              </tbody>
            </table>
          </ng-template>
        </li>
        <li [ngbNavItem]="2">
          <a ngbNavLink>Raw</a>
          <ng-template ngbNavContent>
            <pre>{{ message.rawHeaders }}</pre>
          </ng-template>
        </li>
      </ul>

      <div [ngbNavOutlet]="headersNav" class="mt-2"></div>
    </div>
  `,
})
export class HeadersComponent {
  selectedHeaderTab = 1;

  @Input() message!: HttpMessage;
}

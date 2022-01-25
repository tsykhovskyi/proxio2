import { Component, Input, OnInit } from '@angular/core';
import { HttpPacketModel } from '../http-packet.model';

@Component({
  selector: 'http-preview',
  template: `
    <div *ngIf="packet">
      <ngb-accordion
        [activeIds]="['accRequest', 'accResponse']"
        #reqResAccordion="ngbAccordion"
      >
        <ngb-panel id="accRequest" title="Request">
          <ng-template ngbPanelContent>
            <http-preview-message
              [message]="packet.request"
            ></http-preview-message>
          </ng-template>
        </ngb-panel>
        <ngb-panel id="accResponse" title="Response">
          <ng-template ngbPanelContent>
            <http-preview-message
              *ngIf="packet.response"
              [message]="packet.response"
            ></http-preview-message>
          </ng-template>
        </ngb-panel>
      </ngb-accordion>
    </div>
  `,
})
export class HttpPreviewComponent implements OnInit {
  @Input() packet: HttpPacketModel | null = null;

  constructor() {}

  ngOnInit(): void {}
}

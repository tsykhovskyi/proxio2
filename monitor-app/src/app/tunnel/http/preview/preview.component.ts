import { Component, Input, OnInit } from '@angular/core';
import { HttpPacketModel } from '../http-packet.model';

@Component({
  selector: 'http-preview',
  template: `
    <div *ngIf="packet">
      <h3>Request</h3>
      <http-preview-message [message]="packet.request"></http-preview-message>

      <ng-container *ngIf="packet.response">
        <h3>Response</h3>
        <http-preview-message
          [message]="packet.response"
        ></http-preview-message>
      </ng-container>
    </div>
  `,
})
export class HttpPreviewComponent implements OnInit {
  @Input() packet: HttpPacketModel | null = null;

  constructor() {}

  ngOnInit(): void {}
}

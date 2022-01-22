import { Component, Input, OnInit } from '@angular/core';
import { HttpPacketModel } from '../http-packet.model';

@Component({
  selector: 'http-preview',
  template: `
    <div *ngIf="packet">
      <h3>Request</h3>
      <div>{{ packet.request.headers | json }}</div>
      <div *ngIf="packet.request.body">
        {{ packet.request.body }}
      </div>

      <ng-container *ngIf="packet.response">
        <h3>Response</h3>
        <div *ngIf="packet.response">{{ packet.response.headers | json }}</div>
        <div *ngIf="packet.response.body">
          {{ packet.response.body }}
        </div>
      </ng-container>
    </div>
  `,
})
export class HttpPreviewComponent implements OnInit {
  @Input() packet: HttpPacketModel | null = null;

  constructor() {}

  ngOnInit(): void {}
}

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { HttpPacketModel } from '../http-packet.model';

@Component({
  selector: 'http-status-list',
  template: `
    <table class="table table-borderless table-hover">
      <thead>
        <th><span>Request</span></th>
        <th><span>Status</span></th>
        <th><span>Time</span></th>
      </thead>
      <tbody>
        <tr
          *ngFor="let packet of packets"
          (click)="selectPacket(packet)"
          [class]="{ 'table-secondary': packet === activePacket }"
          class="pointer-event"
        >
          <td>
            {{ packet.request.headerBlock.startLine[0] // method }}
            {{ packet.request.headerBlock.startLine[1] // uri }}
          </td>
          <td>
            <span *ngIf="packet.response">
              {{ packet.response.headerBlock.startLine[1] // status code }}
              {{ packet.response.headerBlock.startLine[2] // status message }}
            </span>
          </td>
          <td>
            <span *ngIf="packet.timing.responseEnd">
              {{ packet.timing.responseEnd - packet.timing.requestStart }} ms
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  `,
  styles: [
    `
      tr {
        cursor: pointer;

        td:last-child {
          min-width: 80px;
        }
      }
    `,
  ],
})
export class HttpStatusListComponent {
  @Input() packets!: HttpPacketModel[];
  @Output() onSelectPacket = new EventEmitter<HttpPacketModel | null>();

  activePacket: HttpPacketModel | null = null;

  constructor() {}

  selectPacket(packet: HttpPacketModel) {
    if (packet === this.activePacket) {
      this.activePacket = null;
    } else {
      this.activePacket = packet;
    }
    this.onSelectPacket.emit(this.activePacket);
  }
}

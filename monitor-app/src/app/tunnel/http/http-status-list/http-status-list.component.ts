import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { HttpPacketModel } from '../http-packet.model';

@Component({
  selector: 'http-status-list',
  template: `
    <table class="table table-borderless">
      <tbody>
        <tr
          *ngFor="let packet of packets"
          (click)="selectPacket(packet)"
          [class]="{ 'table-secondary': packet === activePacket }"
          class="pointer-event"
        >
          <td>{{ packet.request.method }} {{ packet.request.uri }}</td>
          <td>
            <span *ngIf="packet.response">
              {{ packet.response.statusCode }}
              {{ packet.response.statusMessage }}
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
      }
    `,
  ],
})
export class HttpStatusListComponent implements OnInit {
  @Input() packets!: HttpPacketModel[];
  @Output() onSelectPacket = new EventEmitter<HttpPacketModel | null>();

  activePacket: HttpPacketModel | null = null;

  constructor() {}

  ngOnInit(): void {}

  selectPacket(packet: HttpPacketModel) {
    if (packet === this.activePacket) {
      this.activePacket = null;
    } else {
      this.activePacket = packet;
    }
    this.onSelectPacket.emit(this.activePacket);
  }
}

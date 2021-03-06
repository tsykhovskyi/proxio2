import { Component, Input, OnInit } from '@angular/core';
import { createHttpParserFromWs } from '../common/traffic';
import { HttpPacketModel } from './http/http-packet.model';
import { HttpRequest } from '../common/traffic/http/tunnel-parser';
import { environment } from '../../environments/environment';

@Component({
  selector: 'tunnel',
  template: `
    <p class="fs-4 mt-2">
      Traffic monitor: <i>{{ tunnelHost }}</i>
    </p>

    <div class="row" *ngIf="packets.length">
      <div class="col-6">
        <http-status-list
          [packets]="packets"
          (onSelectPacket)="activePacket = $event"
        ></http-status-list>
      </div>
      <div class="col-6">
        <http-preview [packet]="activePacket"></http-preview>
      </div>
    </div>
    <div class="alert alert-primary" role="alert" *ngIf="!packets.length">
      Your requests will be shown here. Keep in mind, that <b>proxio</b> does
      not store any traffic and all preview requests will be flushed on page
      reload
    </div>
  `,
  styleUrls: ['./tunnel.component.scss'],
})
export class TunnelComponent implements OnInit {
  @Input() hostname!: string;

  get tunnelHost() {
    return `${this.hostname}.${environment.domainName}`;
  }

  activePacket: HttpPacketModel | null = null;

  constructor() {}

  packets: HttpPacketModel[] = [];

  ngOnInit(): void {
    const parser = createHttpParserFromWs(
      new WebSocket(
        `${environment.monitorWsUrl}/traffic?hostname=${this.hostname}`
      )
    );

    parser.on('request', (request) => {
      const packet = this.createHttpPacket(request);

      this.packets.unshift(packet);
    });
  }

  private createHttpPacket(request: HttpRequest) {
    const packet = new HttpPacketModel(request);

    const requestChunks: Uint8Array[] = [];
    request.on('data', (chunk) => {
      requestChunks.push(chunk);
    });
    request.on('close', (time) =>
      packet.setRequestBody(this.concat(requestChunks), time)
    );
    request.on('response', (response) => {
      packet.createResponse(response);

      let responseChunks: Uint8Array[] = [];
      response.on('data', (chunk) => {
        responseChunks.push(chunk);
      });
      response.on('close', (time) => {
        packet.setResponseBody(this.concat(responseChunks), time);
      });
    });

    return packet;
  }

  private concat(buffers: Uint8Array[]) {
    const result = new Uint8Array(
      buffers.reduce((acc, buf) => {
        acc += buf.length;
        return acc;
      }, 0)
    );

    let offset = 0;
    for (const buff of buffers) {
      result.set(buff, offset);
      offset += buff.length;
    }

    return result;
  }
}

import { Component, Input, OnInit } from '@angular/core';
import { createHttpParserFromWs } from '../common/traffic';
import { HttpPacketModel } from './http/http-packet.model';
import { HttpRequest } from '../common/traffic/http/tunnel-parser';
import { environment } from '../../environments/environment';

@Component({
  selector: 'tunnel',
  template: `
    <div class="row">
      <div class="col-4">
        <http-status-list
          [packets]="packets"
          (onSelectPacket)="activePacket = $event"
        ></http-status-list>
      </div>
      <div class="col-8">
        <http-preview [packet]="activePacket"></http-preview>
      </div>
    </div>
  `,
  styleUrls: ['./tunnel.component.scss'],
})
export class TunnelComponent implements OnInit {
  @Input() hostname!: string;

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

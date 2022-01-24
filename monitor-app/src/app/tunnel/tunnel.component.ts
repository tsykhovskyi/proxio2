import { Component, Input, OnInit } from '@angular/core';
import { createHttpParserFromWs } from '../common/traffic';
import { HttpPacketModel } from './http/http-packet.model';
import { HttpRequest } from '../common/traffic/http/tunnel-parser';

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
      new WebSocket('ws://monitor.localhost/traffic')
    );

    parser.on('request', (request) => {
      const packet = this.createHttpPacket(request);

      this.packets.unshift(packet);
    });
  }

  private createHttpPacket(request: HttpRequest) {
    const decoder = new TextDecoder();

    const packet = new HttpPacketModel(request);
    let reqBody: Uint8Array[] = [];
    request.on('data', (chunk) => {
      reqBody.push(chunk);
    });
    request.on('close', () => packet.setRequestBody(this.concat(reqBody)));
    request.on('response', (response) => {
      packet.setResponse(response);

      let resBody: Uint8Array[] = [];
      response.on('data', (chunk) => {
        // resBody += decoder.decode(chunk);
        resBody.push(chunk);
      });
      response.on('close', () => {
        packet.setResponseBody(this.concat(resBody));
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

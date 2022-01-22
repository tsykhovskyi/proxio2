import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { HttpRequest } from '../common/traffic/http/tunnel-parser';
import { createHttpParserFromWs } from '../common/traffic';
import { HttpPacketModel } from './http/http-packet.model';

@Component({
  selector: 'tunnel',
  templateUrl: './tunnel.component.html',
  styleUrls: ['./tunnel.component.scss'],
})
export class TunnelComponent implements OnInit {
  @Input() hostname!: string;

  constructor(private cdr: ChangeDetectorRef) {}

  packets: HttpPacketModel[] = [];

  ngOnInit(): void {
    const parser = createHttpParserFromWs(
      new WebSocket('ws://monitor.localhost/traffic')
    );

    parser.on('request', (request) => {
      const packet = new HttpPacketModel(request);
      this.packets.push(packet);
      request.on('response', (response) => {
        packet.setResponse(response);
      });
    });
  }
}

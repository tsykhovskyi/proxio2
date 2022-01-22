import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { HttpPacketModel } from '../http-packet.model';

@Component({
  selector: 'http-info-list',
  template: `
    <table class="table table-borderless">
      <tbody>
        <tr *ngFor="let packet of packets">
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
  styleUrls: ['./http-info-list.component.scss'],
})
export class HttpInfoListComponent implements OnInit {
  @Input() packets!: HttpPacketModel[];

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {}
}

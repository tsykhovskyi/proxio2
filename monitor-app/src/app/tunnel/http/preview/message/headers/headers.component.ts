import { Component, Input, OnInit } from '@angular/core';
import { HttpHeaders } from '../../../../../common/traffic/http/tunnel-parser';

@Component({
  selector: 'http-preview-message-headers',
  template: `
    <table class="table table-striped">
      <thead>
        <tr>
          <th>Header</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let entry of headers.entries">
          <td>{{ entry[0] }}</td>
          <td>{{ entry[1] }}</td>
        </tr>
      </tbody>
    </table>
  `,
  styles: [],
})
export class HeadersComponent {
  @Input() headers!: HttpHeaders;
}

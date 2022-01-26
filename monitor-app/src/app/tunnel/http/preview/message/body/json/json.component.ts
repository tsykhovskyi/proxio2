import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import JSONFormatter from 'json-formatter-js';
import { HttpMessage } from '../../../../http-packet.model';

type TabName = 'pretty' | 'raw';

@Component({
  selector: 'http-preview-message-body-json',
  template: `
    <div>
      <ul
        ngbNav
        #bodyNav="ngbNav"
        [(activeId)]="activeTab"
        (shown)="onTabChanged()"
        class="nav-tabs"
      >
        <li [ngbNavItem]="'pretty'">
          <a ngbNavLink>Pretty</a>
          <ng-template ngbNavContent>
            <div #jsonView></div>
          </ng-template>
        </li>
        <li [ngbNavItem]="'raw'">
          <a ngbNavLink>Raw</a>
          <ng-template ngbNavContent>
            <http-preview-message-body-raw
              [message]="message"
            ></http-preview-message-body-raw>
          </ng-template>
        </li>
      </ul>

      <div [ngbNavOutlet]="bodyNav"></div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonComponent implements OnChanges, AfterViewInit {
  activeTab: TabName = 'raw';

  @ViewChild('jsonView')
  protected jsonView?: ElementRef<HTMLDivElement>;

  private jsonNode: HTMLDivElement | null = null;

  @Input() message!: HttpMessage;

  ngOnChanges(changes: SimpleChanges) {
    this.render();
  }

  ngAfterViewInit(): void {
    this.render();
  }

  onTabChanged() {
    this.render();
  }

  private render() {
    if (!this.jsonView) {
      // if element is not ready
      return;
    }
    if (this.activeTab !== 'pretty') {
      // Do not run heave json parse if not active
      return;
    }

    if (this.message.body !== null) {
      const bodyStr = new TextDecoder().decode(this.message.body);
      const formatter = new JSONFormatter(JSON.parse(bodyStr), Infinity);
      this.jsonNode = formatter.render();
    }

    const existedJsonNode = this.jsonView.nativeElement.firstChild;
    if (existedJsonNode && existedJsonNode !== this.jsonNode) {
      this.jsonView.nativeElement.removeChild(existedJsonNode);
    }

    if (this.jsonNode) {
      this.jsonView.nativeElement.appendChild(this.jsonNode);
    }
  }
}

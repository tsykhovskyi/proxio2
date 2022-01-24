import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  ViewChild,
} from '@angular/core';
import JSONFormatter from 'json-formatter-js';
import { HttpMessage } from '../../../../http-packet.model';

@Component({
  selector: 'http-preview-message-body-json',
  template: ` <div #jsonView></div> `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonComponent implements AfterViewInit {
  @ViewChild('jsonView')
  protected jsonView?: ElementRef<HTMLDivElement>;

  private jsonNode: HTMLDivElement | null = null;

  private textDecoder: TextDecoder;

  @Input() set message(message: HttpMessage) {
    if (message.body !== null) {
      const bodyStr = this.textDecoder.decode(message.body);
      const formatter = new JSONFormatter(JSON.parse(bodyStr), Infinity);
      this.jsonNode = formatter.render();
    }
    this.render();
  }

  constructor() {
    this.textDecoder = new TextDecoder();
  }

  ngAfterViewInit(): void {
    this.render();
  }

  private render() {
    const existedJsonNode = this.jsonView?.nativeElement.firstChild;
    if (existedJsonNode && existedJsonNode !== this.jsonNode) {
      this.jsonView?.nativeElement.removeChild(existedJsonNode);
    }

    if (this.jsonNode) {
      this.jsonView?.nativeElement.appendChild(this.jsonNode);
    }
  }
}

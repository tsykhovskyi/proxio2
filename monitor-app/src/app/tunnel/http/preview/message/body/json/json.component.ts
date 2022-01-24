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

@Component({
  selector: 'http-preview-message-body-json',
  template: ` <div #jsonView></div> `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonComponent implements OnChanges, AfterViewInit {
  @Input() content!: string;

  @ViewChild('jsonView')
  protected jsonView?: ElementRef<HTMLDivElement>;

  private jsonNode: HTMLDivElement | null = null;

  constructor() {}

  ngOnChanges() {
    this.jsonNode = this.createJsonNode(this.content);
    this.render();
  }

  ngAfterViewInit(): void {
    this.render();
  }

  private createJsonNode(content: string) {
    const formatter = new JSONFormatter(JSON.parse(content), Infinity);
    return formatter.render();
  }

  private render() {
    const existedJsonNode = this.jsonView?.nativeElement.firstChild;
    if (this.jsonNode) {
      if (existedJsonNode && existedJsonNode !== this.jsonNode) {
        this.jsonView?.nativeElement.removeChild(existedJsonNode);
      }
      this.jsonView?.nativeElement.appendChild(this.jsonNode);
    }
  }
}

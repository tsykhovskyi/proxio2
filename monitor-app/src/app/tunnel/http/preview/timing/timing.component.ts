import { Component, Input } from '@angular/core';
import { HttpTiming } from '../../http-packet.model';

interface Bar {
  name: string;
  color: string;
  widthPercent: number;
  offsetPercent: number;
  duration: number;
}

@Component({
  selector: 'http-preview-timing',
  template: `
    <div>
      <div class="row" *ngFor="let bar of bars">
        <div class="col-2">
          {{ bar.name }}
        </div>
        <div class="col-8">
          <div class="progress">
            <div
              class="progress-bar"
              role="progressbar"
              [class]="bar.color"
              [style.width]="bar.widthPercent + '%'"
              [style.margin-left]="bar.offsetPercent + '%'"
            ></div>
          </div>
        </div>
        <div class="col-2">{{ bar.duration }} ms</div>
      </div>
      <div class="row">
        <div class="offset-10 col-2">{{ this.totalTime }} ms</div>
      </div>
    </div>
  `,
  styles: [],
})
export class TimingComponent {
  bars: Bar[] = [];
  totalTime: number = 0;

  @Input() set timing(timing: HttpTiming) {
    this.buildBars(timing);
  }

  constructor() {}

  buildBars(timing: HttpTiming) {
    console.log('attempt to build bars');
    if (
      timing.requestEnd === undefined ||
      timing.responseStart === undefined ||
      timing.responseEnd === undefined
    ) {
      return;
    }

    const max = timing.responseEnd;
    this.totalTime = timing.responseEnd - timing.requestStart;
    this.bars = [
      this.createBar(
        'Request sent',
        'bg-primary',
        timing.requestStart,
        timing.requestEnd,
        max
      ),
      this.createBar(
        'Processing',
        'bg-success',
        timing.requestEnd,
        timing.responseStart,
        max
      ),
      this.createBar(
        'Response sent',
        'bg-info',
        timing.responseStart,
        timing.responseEnd,
        max
      ),
    ];
  }

  createBar(
    name: string,
    color: string,
    start: number,
    end: number,
    max: number
  ): Bar {
    const len = end - start;

    return {
      name,
      color,
      widthPercent: Math.round((len / max) * 100_00) / 100,
      offsetPercent: Math.round((start / max) * 100_00) / 100,
      duration: len,
    };
  }
}

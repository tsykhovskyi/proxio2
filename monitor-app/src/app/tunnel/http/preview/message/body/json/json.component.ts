import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { JsonIterator, JsonRow } from './json-renderer.utility';

@Component({
  selector: 'http-preview-message-body-json',
  template: `
    <table class="table is-hoverable">
      <tbody>
        <tr
          *ngFor="
            let row of jsonRows
              | jsonFilter: filterQuery
              | expandedNodes: collapsedPaths
          "
          [attr.data-path]="row.path"
        >
          <td
            [style.padding-left.px]="row.depth * 20"
            [class.expandable]="row.value === undefined"
            (click)="toogleExpanded(row.path)"
          >
            <span class="icon" *ngIf="row.value === undefined">
              <i
                class="fas"
                [ngClass]="{
                  'fa-minus': row.expanded,
                  'fa-plus': !row.expanded
                }"
              ></i>
            </span>
            <span
              [class.is-propKey]="row.value !== undefined"
              class="color--key"
              >{{ row.key }}:</span
            >
          </td>
          <td>
            <span [ngClass]="'color--' + typeOf(row.value)">
              {{
                typeOf(row.value) === 'string'
                  ? '"' + row.value + '"'
                  : row.value
              }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonComponent {
  jsonRows!: JsonRow[];

  filterQuery: string = '';
  collapsedPaths = new Set<string>();

  @Input()
  set content(content: string) {
    this.jsonRows = [...new JsonIterator(JSON.parse(content))];
  }

  toogleExpanded(path: string) {
    const childrenPath = path + '/';

    if (this.collapsedPaths.has(childrenPath)) {
      this.collapsedPaths.delete(childrenPath);
    } else {
      this.collapsedPaths.add(childrenPath);
    }
  }

  expandAll() {
    this.collapsedPaths = new Set<string>();
  }

  collapseAll() {
    this.collapsedPaths = new Set<string>(
      this.jsonRows
        .filter((row) => row.value === undefined)
        .map((row) => row.path + '/')
    );
  }

  typeOf(v: any): string {
    return typeof v;
  }
}

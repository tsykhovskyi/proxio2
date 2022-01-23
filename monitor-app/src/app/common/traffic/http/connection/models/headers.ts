import { HttpHeaders } from '../../tunnel-parser';

export class HeadersImpl implements HttpHeaders {
  private map: Map<string, string>;

  get entries(): [string, string][] {
    return [...this.map.entries()];
  }

  constructor() {
    this.map = new Map<string, string>();
  }

  find(name: string): string | null {
    return this.map.get(name) ?? null;
  }

  add(name: string, value: string): void {
    this.map.set(name.trim(), value.trim());
  }
}

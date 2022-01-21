import { HttpHeaders } from "../../tunnel-parser";

export class HeadersImpl implements HttpHeaders {
  entries: [string, string][] = [];

  find(name: string): string | null {
    const entry = this.entries.find(([headerName]) => name === headerName);
    if (!entry) {
      return null;
    }

    return entry[1];
  }

  add(name: string, value: string): void {
    this.entries.push([name.trim(), value.trim()]);
  }
}

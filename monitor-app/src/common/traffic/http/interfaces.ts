export type Headers = Record<string, string>;

export interface HttpRequest {
  method: string;
  uri: string;
  protocol: string;
  headers: Headers;

  on(event: "data", listener: (chunk: Uint8Array) => void): void;

  on(event: "close", listener: () => void): void;

  on(event: "response", listener: (response: HttpResponse) => void): void;
}

export interface HttpResponse {
  protocol: string;
  statusCode: number;
  statusMessage: string;
  headers: Headers;

  on(event: "data", listener: (chunk: Uint8Array) => void): void;

  on(event: "close", listener: () => void): void;
}

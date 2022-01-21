import { HeadersImpl } from "./models/headers";
import { HttpHeaders } from "../tunnel-parser";

type HeadersBlock = {
  startLine: [string, string, string];
  headers: HttpHeaders;
  blockEnd: number;
};

/**
 * Parse headers block or return null if payload invalid
 */
export function readHeadersBlock(chunk: Uint8Array): HeadersBlock | null {
  const rl = new ReadLine(chunk);

  let startLine: [string, string, string] | null = null;
  const headers = new HeadersImpl();

  for (const { line, end } of rl) {
    if (startLine === null) {
      const parts = line.split(" ");
      if (parts.length < 3) {
        return null;
      }

      startLine = [parts[0], parts[1], parts.slice(2).join(" ")] as [
        string,
        string,
        string
      ];
      continue;
    }

    if (line === "") {
      //  empty line means end of headers block
      return { startLine, headers, blockEnd: end };
    }

    const delimPos = line.indexOf(":");
    if (delimPos === -1) {
      return null;
    }

    headers.add(line.slice(0, delimPos), line.slice(delimPos + 1));
  }

  return null;
}

class ReadLine implements Iterable<{ line: string; end: number }> {
  private utf8Decoder: TextDecoder;

  constructor(private buffer: Uint8Array) {
    this.utf8Decoder = new TextDecoder();
  }

  *[Symbol.iterator]() {
    let offset = 0;

    while (offset < this.buffer.byteLength) {
      let newlinePos = this.buffer.indexOf(0x0a, offset); // \n
      if (newlinePos === -1) {
        const line = this.utf8Decoder.decode(this.buffer.subarray(offset));
        yield { line, end: newlinePos + 1 };
        break;
      }

      const line = this.utf8Decoder.decode(
        this.buffer.subarray(
          offset,
          newlinePos - (this.buffer[newlinePos - 1] === 0x0d ? 1 : 0) // -1 if \r before \n
        )
      );

      offset = newlinePos + 1;
      yield { line, end: offset };
    }
  }
}

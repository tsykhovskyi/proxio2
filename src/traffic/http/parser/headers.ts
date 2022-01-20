type HeadersBlock = {
  startLine: [string, string, string];
  headers: Record<string, string>;
  blockEnd: number;
};

/**
 * Parse headers block or return null if payload invalid
 */
export function readHeadersBlock(chunk: Buffer): HeadersBlock | null {
  const rl = new ReadLine(chunk);

  let startLine: [string, string, string] | null = null;
  let headers: Record<string, string> = {};

  for (const { line, end } of rl) {
    if (startLine === null) {
      const parts = line.split(" ");
      if (parts.length !== 3) {
        return null;
      }

      startLine = parts as [string, string, string];
    } else {
      if (line === "") {
        //  empty line means end of headers block
        return { startLine, headers, blockEnd: end };
      }

      const parts = line.split(":");
      if (parts.length !== 2) {
        return null;
      }

      headers[parts[0].trim()] = parts[1].trim();
    }
  }

  return null;
}

class ReadLine implements Iterable<{ line: string; end: number }> {
  private utf8Decoder: TextDecoder;

  constructor(private buffer: Buffer) {
    this.utf8Decoder = new TextDecoder();
  }

  *[Symbol.iterator]() {
    let offset = 0;

    while (offset < this.buffer.length) {
      let newlinePos = this.buffer.indexOf(0x0a); // \n
      if (newlinePos === -1) {
        const line = this.utf8Decoder.decode(this.buffer.subarray(offset));
        yield { line, end: newlinePos + 1 };
        break;
      }

      const line = this.utf8Decoder.decode(
        this.buffer.subarray(
          0,
          newlinePos - (this.buffer[newlinePos - 1] === 0x0d ? 1 : 0) // -1 if \r before \n
        )
      );

      offset = newlinePos + 1;
      yield { line, end: offset };
    }
  }
}

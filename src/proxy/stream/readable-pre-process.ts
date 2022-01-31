import { StringDecoder } from "string_decoder";
import { Readable } from "stream";

type BufferSearcher<T> = (chunk: string) => T | null;

export function readablePreProcess<T>(
  stream: Readable,
  searcher: BufferSearcher<T>
) {
  return new Promise<T | null>((resolve, reject) => {
    const decoder = new StringDecoder("utf8");
    const buffer: Buffer[] = [];

    stream.on("error", reject);
    stream.on("readable", onReadable);

    function onReadable() {
      let chunk;
      while (null !== (chunk = stream.read())) {
        buffer.push(chunk);
        const chunkStr = decoder.write(chunk);

        const searchResult = searcher(chunkStr);
        if (null !== searchResult) {
          return finish(searchResult);
        }
      }
      finish(null);
    }

    function finish(result: T | null): void {
      stream.removeListener("error", reject);
      stream.removeListener("readable", onReadable);

      let chunk;
      while (undefined !== (chunk = buffer.shift())) {
        stream.unshift(chunk);
      }

      resolve(result);
    }
  });
}

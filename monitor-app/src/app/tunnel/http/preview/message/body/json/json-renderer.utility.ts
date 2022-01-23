export interface JsonRow {
  key: string;
  depth: number;
  path: string;
  value?: string;
}

interface PathNode {
  nested: any;
  iterator: number;
  depth: number;
  path: string;
}

/**
 * This service allows to iterate over all json properties presenting each json step as JsonRow
 */
export class JsonIterator implements IterableIterator<JsonRow> {
  private readonly initValue: any;
  private objStack: PathNode[] = [];

  constructor(json: any) {
    this.initValue = json;
    this.objStack.push({
      nested: this.initValue,
      iterator: 0,
      depth: 0,
      path: '/',
    });
  }

  next(): IteratorResult<JsonRow, any> {
    if (this.objStack.length === 0) {
      this.objStack.push({
        nested: this.initValue,
        iterator: 0,
        depth: 0,
        path: '/',
      });
      return {
        done: true,
        value: null,
      };
    }

    let node = this.objStack.pop()!;

    let row: JsonRow;
    if (Array.isArray(node.nested)) {
      row = this.processArray(
        node.nested,
        node.iterator,
        node.depth,
        node.path
      );
    } else if (typeof node.nested === 'object') {
      row = this.processObject(
        node.nested,
        node.iterator,
        node.depth,
        node.path
      );
    } else {
      throw Error('something wrong');
    }

    return {
      done: false,
      value: row,
    };
  }

  processArray(arr: Array<any>, iterator: number, depth: number, path: string) {
    if (iterator < arr.length - 1) {
      this.objStack.push({ nested: arr, iterator: iterator + 1, depth, path });
    }

    const row: JsonRow = {
      key: iterator.toString(),
      depth,
      path: path + iterator,
    };
    if (typeof arr[iterator] === 'object') {
      this.objStack.push({
        nested: arr[iterator],
        iterator: 0,
        depth: depth + 1,
        path: path + iterator + '/',
      });
    } else {
      row.value = arr[iterator];
    }

    return row;
  }

  processObject(obj: any, iterator: number, depth: number, path: string) {
    const properties = Object.getOwnPropertyNames(obj);

    if (iterator < properties.length - 1) {
      this.objStack.push({ nested: obj, iterator: iterator + 1, depth, path });
    }

    const row: JsonRow = {
      key: properties[iterator],
      depth,
      path: path + properties[iterator],
    };
    if (typeof obj[properties[iterator]] === 'object') {
      this.objStack.push({
        nested: obj[properties[iterator]],
        iterator: 0,
        depth: depth + 1,
        path: path + properties[iterator] + '/',
      });
    } else {
      row.value = obj[properties[iterator]];
    }

    return row;
  }

  [Symbol.iterator](): IterableIterator<JsonRow> {
    return this;
  }
}

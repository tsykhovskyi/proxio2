import { PseudoTtyInfo, ServerChannel } from "ssh2";
import blessed, { Widgets } from "blessed";

export type WindowSize = { rows: number; cols: number };

/**
 * Tunnel-oriented abstraction over blessed library API
 */
export class Terminal {
  private rows = 0;
  private columns = 0;
  private readonly term: string;

  private screen: Widgets.Screen;
  private infoBlock: Widgets.BoxElement;

  constructor(
    private channel: ServerChannel,
    ptyInfo: PseudoTtyInfo,
    private closeCb: () => void
  ) {
    this.rows = ptyInfo.rows;
    this.columns = ptyInfo.cols;
    this.term = ptyInfo["term"] ?? "ansi";

    this.patchChannel();
    this.screen = this.createScreen();

    this.infoBlock = this.createInfoBlock();
    this.screen.append(this.infoBlock);

    this.render();
  }

  setTitle(title: string) {
    this.screen.title = title;
  }

  setInfo(records: Array<[string, string] | null>) {
    let curLine = 0;
    for (const rec of records) {
      if (rec !== null) {
        this.infoBlock.setLine(curLine, rec[0].padEnd(20) + rec[1]);
      }
      curLine++;
    }
    this.render();
  }

  resize(size: WindowSize) {
    this.rows = size.rows;
    this.columns = size.cols;
    this.patchChannel();

    this.render();
  }

  private render() {
    this.screen.render();
    this.channel.emit("resize");
    // // XXX This fake resize event is needed for some terminals in order to
    // // have everything display correctly
    this.screen.program.emit("resize");
  }

  /**
   * Assign additional properties to ssh channel to behave as PTY duplex
   */
  private patchChannel() {
    this.channel["rows"] = this.rows;
    this.channel["columns"] = this.columns;
    this.channel["isTTY"] = true;
    this.channel["setRawMode"] = () => {};
    this.channel.on("error", () => {});
  }

  private createScreen() {
    const screen = blessed.screen({
      terminal: this.term,
      autoPadding: true,
      smartCSR: true,
      program: blessed.program({
        input: this.channel,
        output: this.channel,
      }),
    });

    // @ts-ignore
    screen.program.attr("invisible", true);

    screen.key(["escape", "q", "C-c"], (ch, key) => {
      this.screen.destroy();
      this.closeCb();
    });

    return screen;
  }

  private createInfoBlock() {
    const block = blessed.box({
      parent: this.screen,
      top: 0,
      left: 0,
      scrollable: false,
      height: 10,
      content: "Hello there",
      tags: true,
      style: {
        fg: "white",
      },
    });
    block.focus();
    return block;
  }
}

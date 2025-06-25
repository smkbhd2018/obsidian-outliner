import { Operation } from "./Operation";
import { Root, recalculateNumericBullets } from "../root";
import { Parser, Reader } from "../services/Parser";

export class PasteList implements Operation {
  private stopPropagation = false;
  private updated = false;

  constructor(
    private root: Root,
    private clipboard: { text: string },
    private parser: Parser,
  ) {}

  shouldStopPropagation() {
    return this.stopPropagation;
  }

  shouldUpdate() {
    return this.updated;
  }

  perform() {
    const text = this.clipboard.text;
    if (!text || !this.root.hasSingleCursor()) {
      return;
    }

    this.stopPropagation = true;

    const lines = text.split("\n");
    const reader: Reader = {
      getCursor: () => ({ line: 0, ch: 0 }),
      getLine: (n: number) => lines[n],
      lastLine: () => lines.length - 1,
      listSelections: () => [{ anchor: { line: 0, ch: 0 }, head: { line: 0, ch: 0 } }],
      getAllFoldedLines: () => [],
    };

    const [clipRoot] = this.parser.parseRange(reader);

    if (!clipRoot || clipRoot.getChildren().length === 0) {
      return;
    }

    this.updated = true;

    const newList = clipRoot.getChildren()[0].clone(this.root);
    (newList as any).foldRoot = true;

    const list = this.root.getListUnderCursor();
    list.getParent().addAfter(list, newList);

    this.root.replaceCursor(newList.getFirstLineContentStart());
    recalculateNumericBullets(this.root);
  }
}

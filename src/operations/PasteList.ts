import { Operation } from "./Operation";

import { Root, recalculateNumericBullets } from "../root";
import { Parser, Reader } from "../services/Parser";

class StringReader implements Reader {
  private lines: string[];
  constructor(text: string) {
    this.lines = text.replace(/\n$/, "").split("\n");
  }
  getCursor() {
    return { line: 0, ch: 0 };
  }
  getLine(n: number) {
    return this.lines[n] || "";
  }
  lastLine() {
    return this.lines.length - 1;
  }
  listSelections() {
    return [{ anchor: { line: 0, ch: 0 }, head: { line: 0, ch: 0 } }];
  }
  getAllFoldedLines() {
    return [] as number[];
  }
}

export class PasteList implements Operation {
  private stopPropagation = false;
  private updated = false;
  private insertedLine: number | null = null;

  constructor(
    private root: Root,
    private text: string,
    private defaultIndent: string,
    private parser: Parser,
  ) {}

  shouldStopPropagation() {
    return this.stopPropagation;
  }

  shouldUpdate() {
    return this.updated;
  }

  getInsertedLine() {
    return this.insertedLine;
  }

  perform() {
    const { root } = this;

    if (!this.text) {
      return;
    }
    if (!root.hasSingleCursor()) {
      return;
    }

    let listUnderCursor = root.getListUnderCursor();
    if (!listUnderCursor) {
      let line = root.getCursor().line - 1;
      const minLine = root.getContentStart().line;
      while (!listUnderCursor && line >= minLine) {
        listUnderCursor = root.getListUnderLine(line);
        line--;
      }
    }
    if (!listUnderCursor) {
      return;
    }

    const reader = new StringReader(this.text);
    const parsedRoots = this.parser.parseRange(reader);
    if (!parsedRoots.length) {
      return;
    }

    const newListSource = parsedRoots[0].getChildren()[0];
    if (!newListSource) {
      return;
    }

    const newList = newListSource.clone(root);
    const parent = listUnderCursor.getParent();

    // adjust indent
    const oldIndent = newList.getFirstLineIndent();
    const newIndent = listUnderCursor.getFirstLineIndent();
    newList.unindentContent(0, oldIndent.length);
    newList.indentContent(0, newIndent);

    // mark as folded
    (newList as unknown as { foldRoot: boolean }).foldRoot = true;

    parent.addAfter(listUnderCursor, newList);

    this.stopPropagation = true;
    this.updated = true;
    this.insertedLine = root.getContentLinesRangeOf(newList)[0];

    root.replaceCursor(newList.getFirstLineContentStart());

    recalculateNumericBullets(root);
  }
}

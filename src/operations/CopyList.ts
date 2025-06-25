import { Operation } from "./Operation";
import { Root } from "../root";

export class CopyList implements Operation {
  private stopPropagation = false;
  private updated = false;

  constructor(private root: Root, private clipboard: { text: string }) {}

  shouldStopPropagation() {
    return this.stopPropagation;
  }

  shouldUpdate() {
    return this.updated;
  }

  perform() {
    if (!this.root.hasSingleCursor()) {
      return;
    }

    this.stopPropagation = true;
    const list = this.root.getListUnderCursor();
    this.clipboard.text = list.print().replace(/\n$/, "");
    if (navigator.clipboard) {
      navigator.clipboard.writeText(this.clipboard.text);
    }
  }
}

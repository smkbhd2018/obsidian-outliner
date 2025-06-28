import { Operation } from "./Operation";

import { Root, recalculateNumericBullets } from "../root";

export class CutList implements Operation {
  private stopPropagation = false;
  private updated = false;
  private text = "";

  constructor(private root: Root) {}

  shouldStopPropagation() {
    return this.stopPropagation;
  }

  shouldUpdate() {
    return this.updated;
  }

  getText() {
    return this.text;
  }

  perform() {
    const { root } = this;

    if (!root.hasSingleCursor()) {
      return;
    }

    const list = root.getListUnderCursor();
    if (!list) {
      return;
    }

    this.stopPropagation = true;
    this.updated = true;
    this.text = list.print();

    const parent = list.getParent();
    const cursor = list.getFirstLineContentStart();

    parent.removeChild(list);
    root.replaceCursor(cursor);

    recalculateNumericBullets(root);
  }
}

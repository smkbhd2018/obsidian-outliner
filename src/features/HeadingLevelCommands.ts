import { Plugin } from "obsidian";

import { Feature } from "./Feature";

import { MyEditor } from "../editor";
import { MyEditorPosition } from "../editor";
import { createEditorCallback } from "../utils/createEditorCallback";

export class HeadingLevelCommands implements Feature {
  constructor(private plugin: Plugin) {}

  async load() {
    this.plugin.addCommand({
      id: "increase-heading-level",
      icon: "plus-square",
      name: "Increase heading level",
      editorCallback: createEditorCallback(this.increase),
    });

    this.plugin.addCommand({
      id: "decrease-heading-level",
      icon: "minus-square",
      name: "Decrease heading level",
      editorCallback: createEditorCallback(this.decrease),
    });
  }

  async unload() {}

  private getHeadingRange(editor: MyEditor) {
    const headingRe = /^(#{1,6})\s+/;
    const last = editor.lastLine();
    let line = editor.getCursor().line;

    while (line >= 0 && !headingRe.test(editor.getLine(line))) {
      line--;
    }
    if (line < 0) {
      return null;
    }

    const level = headingRe.exec(editor.getLine(line))![1].length;
    const from: MyEditorPosition = { line, ch: 0 };
    let end = last;
    for (let i = line + 1; i <= last; i++) {
      const txt = editor.getLine(i);
      const m = headingRe.exec(txt);
      if (m && m[1].length <= level) {
        end = i - 1;
        break;
      }
    }
    let to: MyEditorPosition;
    if (end < last) {
      to = { line: end + 1, ch: 0 };
    } else {
      to = { line: end, ch: editor.getLine(end).length };
    }
    return { from, to, startLine: line };
  }

  private adjust(editor: MyEditor, delta: number) {
    const info = this.getHeadingRange(editor);
    if (!info) {
      return false;
    }

    const folded = editor.getAllFoldedLines().includes(info.startLine);

    const toLine = info.to.ch === 0 ? info.to.line - 1 : info.to.line;
    const headingRe = /^(#{1,6})(\s+)/;

    for (let line = info.from.line; line <= toLine; line++) {
      const text = editor.getLine(line);
      const m = headingRe.exec(text);
      if (m) {
        let level = m[1].length + delta;
        if (level < 1) level = 1;
        if (level > 6) level = 6;
        const newText = "#".repeat(level) + text.slice(m[1].length);
        editor.replaceRange(
          newText,
          { line, ch: 0 },
          { line, ch: text.length },
        );
      }
    }

    if (folded) {
      editor.fold(info.startLine);
    } else {
      editor.unfold(info.startLine);
    }

    return true;
  }

  private increase = (editor: MyEditor) => {
    return this.adjust(editor, 1);
  };

  private decrease = (editor: MyEditor) => {
    return this.adjust(editor, -1);
  };
}

import { Plugin } from "obsidian";

import { Feature } from "./Feature";

import { MyEditor } from "../editor";
import { MyEditorPosition } from "../editor";
import { createEditorCallback } from "../utils/createEditorCallback";

export class HeadingsClipboardCommands implements Feature {
  private buffer = "";

  constructor(private plugin: Plugin) {}

  async load() {
    this.plugin.addCommand({
      id: "copy-heading-with-children",
      icon: "copy",
      name: "Copy heading with subheadings",
      editorCallback: createEditorCallback(this.copy),
    });

    this.plugin.addCommand({
      id: "cut-heading-with-children",
      icon: "scissors",
      name: "Cut heading with subheadings",
      editorCallback: createEditorCallback(this.cut),
    });

    this.plugin.addCommand({
      id: "paste-heading-with-children",
      icon: "clipboard",
      name: "Paste heading with subheadings",
      editorCallback: createEditorCallback(this.paste),
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
    const text = editor.getRange(from, to);
    return { from, to, text, startLine: line };
  }

  private copy = (editor: MyEditor) => {
    const info = this.getHeadingRange(editor);
    if (!info) {
      return false;
    }
    this.buffer = info.text;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(this.buffer).catch(() => {});
    }
    return true;
  };

  private cut = (editor: MyEditor) => {
    const info = this.getHeadingRange(editor);
    if (!info) {
      return false;
    }
    this.buffer = info.text;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(this.buffer).catch(() => {});
    }
    editor.replaceRange("", info.from, info.to);
    editor.setSelections([{ anchor: info.from, head: info.from }]);
    return true;
  };

  private paste = (editor: MyEditor) => {
    if (!this.buffer) {
      return false;
    }
    const cursor = editor.getCursor();
    editor.replaceRange(this.buffer, cursor, cursor);
    editor.fold(cursor.line);
    editor.setSelections([{ anchor: cursor, head: cursor }]);
    return true;
  };
}


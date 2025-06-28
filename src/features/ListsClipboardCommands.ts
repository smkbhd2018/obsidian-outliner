import { Plugin } from "obsidian";

import { Feature } from "./Feature";

import { MyEditor } from "../editor";
import { CutList } from "../operations/CutList";
import { PasteList } from "../operations/PasteList";
import { ObsidianSettings } from "../services/ObsidianSettings";
import { OperationPerformer } from "../services/OperationPerformer";
import { Parser } from "../services/Parser";
import { createEditorCallback } from "../utils/createEditorCallback";

export class ListsClipboardCommands implements Feature {
  private buffer = "";

  constructor(
    private plugin: Plugin,
    private parser: Parser,
    private operationPerformer: OperationPerformer,
    private obsidianSettings: ObsidianSettings,
  ) {}

  async load() {
    this.plugin.addCommand({
      id: "copy-list-with-sublists",
      icon: "copy",
      name: "Copy list with sublists",
      editorCallback: createEditorCallback(this.copy),
    });

    this.plugin.addCommand({
      id: "cut-list-with-sublists",
      icon: "scissors",
      name: "Cut list with sublists",
      editorCallback: createEditorCallback(this.cut),
    });

    this.plugin.addCommand({
      id: "paste-list-with-sublists",
      icon: "clipboard",
      name: "Paste list with sublists",
      editorCallback: createEditorCallback(this.paste),
    });
  }

  async unload() {}

  private copy = (editor: MyEditor) => {
    const root = this.parser.parse(editor);
    if (!root || !root.hasSingleCursor()) {
      return false;
    }
    const list = root.getListUnderCursor();
    if (!list) {
      return false;
    }
    this.buffer = list.print();
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(this.buffer).catch(() => {});
    }
    return true;
  };

  private cut = (editor: MyEditor) => {
    let op: CutList | null = null;
    const { shouldStopPropagation } = this.operationPerformer.perform(
      (root) => {
        op = new CutList(root);
        return op;
      },
      editor,
    );

    if (op) {
      this.buffer = op.getText();
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(this.buffer).catch(() => {});
      }
    }

    return shouldStopPropagation;
  };

  private paste = (editor: MyEditor) => {
    if (!this.buffer) {
      return false;
    }

    let op: PasteList | null = null;
    const { shouldStopPropagation } = this.operationPerformer.perform(
      (root) => {
        op = new PasteList(
          root,
          this.buffer,
          this.obsidianSettings.getDefaultIndentChars(),
          this.parser,
        );
        return op;
      },
      editor,
    );

    if (op && op.getInsertedLine() !== null) {
      editor.fold(op.getInsertedLine()!);
    }

    return shouldStopPropagation;
  };
}

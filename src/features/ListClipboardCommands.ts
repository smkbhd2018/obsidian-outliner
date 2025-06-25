import { Plugin } from "obsidian";

import { Feature } from "./Feature";
import { MyEditor } from "../editor";
import { CopyList } from "../operations/CopyList";
import { CutList } from "../operations/CutList";
import { PasteList } from "../operations/PasteList";
import { OperationPerformer } from "../services/OperationPerformer";
import { Parser } from "../services/Parser";
import { createEditorCallback } from "../utils/createEditorCallback";

export class ListClipboardCommands implements Feature {
  constructor(
    private plugin: Plugin,
    private parser: Parser,
    private operationPerformer: OperationPerformer,
    private clipboard: { text: string },
  ) {}

  async load() {
    this.plugin.addCommand({
      id: "copy-list-with-sublist",
      name: "Copy list with sublist",
      editorCallback: createEditorCallback(this.copy),
    });
    this.plugin.addCommand({
      id: "cut-list-with-sublist",
      name: "Cut list with sublist",
      editorCallback: createEditorCallback(this.cut),
    });
    this.plugin.addCommand({
      id: "paste-list-with-sublist",
      name: "Paste list with sublist (folded)",
      editorCallback: createEditorCallback(this.paste),
    });
  }

  async unload() {}

  private copy = (editor: MyEditor) => {
    return this.operationPerformer.perform(
      (root) => new CopyList(root, this.clipboard),
      editor,
    ).shouldStopPropagation;
  };

  private cut = (editor: MyEditor) => {
    return this.operationPerformer.perform(
      (root) => new CutList(root, this.clipboard),
      editor,
    ).shouldStopPropagation;
  };

  private paste = (editor: MyEditor) => {
    return this.operationPerformer.perform(
      (root) => new PasteList(root, this.clipboard, this.parser),
      editor,
    ).shouldStopPropagation;
  };
}

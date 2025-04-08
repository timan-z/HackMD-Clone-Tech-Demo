import {
    DecoratorNode,
    //LexicalEditor,
    //DOMExportOutput,
    //EditorConfig,
} from "lexical";
import * as React from "react";
//import RemoteCursorComponent from "../RemoteCursorComponent"; // We'll build this next

export class RemoteCursorNode extends DecoratorNode {
    __id;
  __color;
  __label;

  static getType() {
    return "remote-cursor";
  }

  static clone(node) {
    return new RemoteCursorNode(node.__id, node.__color, node.__label, node.__key);
  }

  createDOM(config) {
    const span = document.createElement("span");
    span.style.display = "inline-block";
    span.style.width = "0px";
    return span;
  }

  updateDOM(prevNode, dom) {
    return false;
  }

  decorate(editor, config) {
    return (
      <RemoteCursorComponent
        id={this.__id}
        color={this.__color}
        label={this.__label}
      />
    );
  }

  static importJSON(serializedNode) {
    const { id, color, label } = serializedNode;
    return new RemoteCursorNode(id, color, label);
  }

  exportJSON() {
    return {
      id: this.__id,
      color: this.__color,
      label: this.__label,
      type: "remote-cursor",
      version: 1,
    };
  }
}
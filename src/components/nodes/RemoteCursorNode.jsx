import { DecoratorNode } from "lexical";
import * as React from "react";
import RemoteCursorComponent from "../RemoteCursorComponent"; // We'll build this next

export class RemoteCursorNode extends DecoratorNode {
    __id;
    __color;
    __label;

    constructor(id, color, label, key) {
        super(key);
        this.__id = id;
        this.__color = color;
        this.__label = label;
    }

    static getType() {
        return "remote-cursor";
    }

    static clone(node) {
        return new RemoteCursorNode(node.__id, node.__color, node.__label, node.__key);
    }

    createDOM(config) {
        const span = document.createElement("span");
        span.style.display = "inline-block";
        span.style.width = "0";
        span.style.height = "0"; // makes sure this node won't take up any actual space in the editor (just want it to "float" like in Google Docs).
        span.style.position = "relative";   // needed so the component can position absolutely.
        span.style.pointerEvents = "none";
        span.style.userSelect = "none";
        span.style.overflow = "visible";
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
        return new RemoteCursorNode(id, color, label, undefined); // undefined so key is generated.
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
// This will be the overlay over the Text Editor contentEditable where the cursor markers will be placed (dynamically):
import React, {useEffect, useRef} from "react";

export function RemoteCursorOverlay({editor, otherCursors, fontSize}) {
    const overlayRef = useRef(null);

    useEffect(() => {
        console.log("Overlay mounted");

        if(!editor || !overlayRef.current) return;
        
        const editorRoot = editor.getRootElement();
        if(!editorRoot) return;

        // clear current overlay contents:
        const overlay = overlayRef.current;
        overlay.innerHTML = "";



        console.log("DEBUG: Running read() — attempting to insert dummy cursor...");
        // DEBUG: Testing generating a cursor marker at a specific offset:
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {

                editor.getEditorState().read(()=> {
                    const dummyCursorOffset = 10; // DEBUG: TEST VALUE!!!

                    console.log("DEBUG: THE READ HAS BEEN ENTERED!!!");

                    const dom = editorRoot.ownerDocument || document;
                    const range = dom.createRange();
                    const walker = dom.createTreeWalker(editorRoot, NodeFilter.SHOW_TEXT);

                    let node = walker.nextNode();
                    let offsetRemaining = dummyCursorOffset;
                    while (node && offsetRemaining > node.textContent.length) {
                        offsetRemaining -= node.textContent.length;
                        node = walker.nextNode();
                    }
                    if (!node) return;

                    try {
                        range.setStart(node, offsetRemaining);
                        range.setEnd(node, offsetRemaining);
                    } catch {
                        return;
                    }

                    const rect = range.getBoundingClientRect();
                    const editorRect = editorRoot.getBoundingClientRect();


                    console.log("DEBUG: rect:", rect);
                    console.log("DEBUG: editorRect:", editorRect);


                    const left = rect.left - editorRect.left + editorRoot.scrollLeft;
                    const top = rect.top - editorRect.top + editorRoot.scrollTop;
                    const cursorEl = document.createElement("div");
                    cursorEl.style.position = "absolute";
                    cursorEl.style.left = `${left}px`;
                    cursorEl.style.top = `${top}px`;
                    cursorEl.style.width = "2px";
                    cursorEl.style.height = "1.1em";
                    cursorEl.style.backgroundColor = "blue";
                    cursorEl.style.zIndex = 10;

                    const label = document.createElement("div");
                    label.textContent = "offset 10";
                    label.style.position = "absolute";
                    label.style.top = "-1.5em";
                    label.style.left = "4px";
                    label.style.backgroundColor = "yellow";
                    label.style.fontSize = "10px";
                    label.style.padding = "2px 4px";
                    label.style.borderRadius = "4px";
                    label.style.whiteSpace = "nowrap";

                    cursorEl.appendChild(label);
                    overlay.appendChild(cursorEl);
                });
            });
        });
    }, [editor]);
    




    return (
        <div
            ref={overlayRef}
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                pointerEvents: "none",
                width: "100%",
                height: "100%",
                zIndex: 1,
            }}
        />
    );
}


export default RemoteCursorOverlay;

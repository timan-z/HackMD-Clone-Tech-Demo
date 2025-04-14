// This will be the overlay over the Text Editor contentEditable where the cursor markers will be placed (dynamically):
import React, {useEffect, useRef} from "react";

// NOTE: MAYBE I SHOULD THROTTLE THIS FUNCTION (DON'T NEED 100%-100% ACCURATE TIMING TBH).
export function RemoteCursorOverlay({editor, otherCursors, fontSize}) {
    const overlayRef = useRef(null);

    useEffect(() => {
        //console.log("DEBUG: OVERLAY MOUNTED (THIS IS WHERE FOREIGN CURSORS ARE RENDERED).");
        //console.log("DEBUG: daaaaaaaaaaaaa - THE VALUE OF fontSize IS: [", fontSize, "]");

        if(!editor || !overlayRef.current) return;

        /* This "updateOverlay" function below will be what consistently refreshes with each update of otherCursors in Editor.jsx.
        It's this function that'll re-position and re-"draw" the cursor markers signalling where the other users are in the Text Editor. 
        (The editor listener I register for this function will call this).*/

        const updateOverlay = () => {
            const editorRoot = editor.getRootElement();
            if(!editorRoot) return;
            const overlay = overlayRef.current;
            overlay.innerHTML = ""; // Wipe current overlay state (get rid of current positioning if applicable).
            
            //console.log("DEBUG: Running read() — attempting to insert dummy cursor...");            
            editor.getEditorState().read(()=> {
                const dom = editorRoot.ownerDocument || document;

                // MAKE THE TO-BE-RENDERED CURSORS BASED ON otherCursors INFORMATION:
                otherCursors.forEach(cursor => {
                    const {cursorPos, id} = cursor; // GETTING THE CURSOR POSITION AND ID OF THIS CURSOR (LET'S KEEP IT SIMPLE, THAT'S ALL I WANT).
                    
                    let dummyVal = 1.1;
                    //console.log("DEBUG-1: The value of dummyVal is = ", dummyVal);
                    dummyVal += 1;
                    //console.log("DEBUG-2: The value of dummyVal is = ", dummyVal);
                    //console.log("DEBUG-3: The value of fontSize is = ", fontSize);

                    if(id !== null) {
                        const range = dom.createRange();
                        const walker = dom.createTreeWalker(editorRoot, NodeFilter.SHOW_TEXT);
                        let node = walker.nextNode();
                        let offsetRemaining = cursorPos;

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
                        const left = rect.left - editorRect.left + editorRoot.scrollLeft;
                        const top = rect.top - editorRect.top + editorRoot.scrollTop;
                        // default values for the foreign cursor decorator node -- assuming default font size (16px): 
                        const defWidth = 2;
                        const defHeight = 1.1; // <--for every font +2 above 16, I should add the amount x 0.15
                        // following two consts are for helping adjust the cursor dec node dimensions for tweaked font size (i.e., zoom in / out).
                        const defFontDiff = fontSize - 16;
                        const heightAdj = (defFontDiff / 2) * 0.15; // 0.15 is the sweet spot, yeah. (.1 doesn't go far enough, .2 too much for larger fonts).

                        // This is the veritcal line that appears:
                        const cursorEl = document.createElement("div");
                        cursorEl.style.position = "absolute";
                        cursorEl.style.left = `${left}px`;
                        cursorEl.style.top = `${top}px`;
                        cursorEl.style.width = `${defWidth}px`;
                        cursorEl.style.height = `${defHeight+heightAdj}em`;
                        cursorEl.style.backgroundColor = "red"; // I like red.
                        cursorEl.style.zIndex = 10;
                        // This is the horizontal ID-tag that appears next to the vert line.
                        const label = document.createElement("div");
                        label.textContent = id;
                        label.style.position = "absolute";
                        label.style.top = "-1.5em";
                        label.style.left = "4px";
                        label.style.backgroundColor = "yellow"; // NOTE: Maybe change this to yellow but with red border.
                        label.style.fontSize = "10px";
                        label.style.padding = "2px 4px";
                        label.style.borderRadius = "4px";
                        label.style.whiteSpace = "nowrap";

                        cursorEl.appendChild(label);
                        overlay.appendChild(cursorEl);
                    }
                });
            });
        };

        // Initial draw:
        updateOverlay();
        // listener needed:
        const unsubscribe = editor.registerUpdateListener(() => {
            updateOverlay();
        });

        return () => {
            unsubscribe();
        }
    }, [editor, otherCursors, fontSize]);

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

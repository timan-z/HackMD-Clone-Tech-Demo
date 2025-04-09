// This will be the overlay over the Text Editor contentEditable where the cursor markers will be placed (dynamically):
import {useEffect, useRef} from "react";

export function RemoteCursorOverlay({editor, otherCursors, fontSize}) {
    const overlayRef = useRef(null);

    useEffect(() => {
        console.log("Overlay mounted");
    }, []);

    return (
        <div
            ref={overlayRef}
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                pointerEvents: "none",
                width:"100%",
                height:"100%",
                backgroundColor: "rgba(0, 255, 0, 0.1)", // light green test colour.
                zIndex: 1,
            }}
        >
            {/* Insert more code later... */}
        </div>
    );
}

export default RemoteCursorOverlay;

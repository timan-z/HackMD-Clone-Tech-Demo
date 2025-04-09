// This will be the overlay over the Text Editor contentEditable where the cursor markers will be placed (dynamically):
import React, {useEffect, useRef} from "react";

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
            {/* Static Dummy Cursor: */}
            {/* These dimensions below (mainly the Top, Width, and Height attributes) are perfect and exactly what I want for the cursor marker itself (GIVEN DEFAULT FONT). */}
            <div
                style={{
                    position: "absolute",
                    left:"40px",
                    top:"17px",
                    width:"2px",
                    height:"1.1em",
                    backgroundColor:"red",
                }}
            > {/* Floating label next to cursor (for the ID): */}
                <div
                    style={{
                        position:"absolute",
                        top:"-1.5em",
                        left:"3px",
                        backgroundColor:"yellow",
                        fontSize:"10px",
                        padding:"2px 4px",
                        borderRadius:"4px",
                        whiteSpace:"nowrap",
                    }}
                >
                    dummy-user-id
                </div>
            </div>
        </div>
    );
}

export default RemoteCursorOverlay;

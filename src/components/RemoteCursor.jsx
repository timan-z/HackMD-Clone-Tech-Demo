import React from "react";

const RemoteCursor = ({ position, userId}) => {
    return (
        <div
            className="remote-cursor"
            style={{
                position: "absolute",
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: "2px",
                height: "16px", // NOTE:+DEBUG: This width and height I'll need to adjust possibly dynamically given I have zoom controls lol.
                backgroundColor: "red",
                zIndex: 10,
            }}
        >
            <div
                className="remote-cursor-label"
                style={{
                    position:"absolute",
                    top:"-20px",
                    left:"5px",
                    backgroundColor:"rgba(0, 0, 255, 0.8)",
                    color:"white",
                    fontSize:"12px",
                    padding:"2px 4px",
                    borderRadius:"4px",
                    zIndex:11,
                }}
            >
                {userId}
            </div>
        </div>
    )
}

export default RemoteCursor;

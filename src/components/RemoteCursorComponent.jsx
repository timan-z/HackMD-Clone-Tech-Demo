// This is the actual visual React element rendered by the RemoteCursorNode

function RemoteCursorComponent({ id, color, label }) {
    return (
        <div
        style={{
          position: "relative",
          display: "inline-block",
          width: "2px",
          height: "1em",
          backgroundColor: color,
          zIndex: 10,
        }}
        className="remote-cursor"
      >
        <div
          style={{
            position: "absolute",
            top: "-1.5em",
            left: "4px",
            backgroundColor: "yellow",
            fontSize: "10px",
            padding: "2px 4px",
            borderRadius: "4px",
            whiteSpace: "nowrap",
          }}
        >
          {label || id}
        </div>
      </div>
    );
}
  
export default RemoteCursorComponent;
  
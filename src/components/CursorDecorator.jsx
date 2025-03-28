import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot } from "lexical";
import { useEffect, useState } from "react";
import RemoteCursor from "./RemoteCursor";
import socket from "./Socket.js";

const CursorDecorator = () => {
    const [editor] = useLexicalComposerContext();
    const [remoteCursors, setRemoteCursors] = useState([]);

    useEffect(() => {
        socket.on("update-cursors", (cursors) => {
          setRemoteCursors(cursors);
        });
    
        return () => {
          socket.off("update-cursors");
        };
    }, []);

    
}


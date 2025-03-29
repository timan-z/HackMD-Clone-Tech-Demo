// NOTE: My command for starting this server is "node src/components/Server.js"

/* For implementing real-time Text Editor collaboration between multiple users, I'll
be using Socket.IO with Express as my backend for real-time synchronization. */
import express from "express";
import http from "http"; // Express runs on HTTP.
import { Server } from "socket.io";
import cors from "cors";
import pkg from 'lodash';
const { throttle } = pkg;

/* NOTE-TO-SELF:
 - io.emit will send this event to *all* clients (including the server, which here will be irrelevant).
 - socket.emit will send the event *only* to the specific client that triggered it.
 - socket.broadcast.emit will send the even to all *other* clients except the sender.
*/

// setup:
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    // You need this stuff below to bypass issues with cors.
    cors: {
        origin: "http://localhost:5173", // This is **my** frontend URL; NOTE: I should have a variable for this in .env I think.
        methods: ["GET", "POST"],
    },
});

let documentData = "";
let clientCursors = []; // This will be my array variable holding the client-cursor info objects for rendering in each Text Editor.

io.on("connection", (socket) => {
    // connection notice:
    console.log("A user connected: ", socket.id);

    // send existing text editor content to new clients:
    socket.emit("load-document", documentData);
    
    // Handle text editor changes:
    socket.on("send-text", (data) => {
        documentData = data;    // update document state.
        socket.broadcast.emit("receive-text", data);    // send updates to all other clients.
    });

    // Wrapping an emit.broadcast of clientCursors with a throttle to (try to) prevent race conditions:
    const broadcastCursors = throttle(() => {
        socket.broadcast.emit("update-cursors", clientCursors);
    }, 100); // 100ms seems like a reasonable interval.

    // Handle client sending their cursor position within the Text Editor (*will happen frequently*): 
    socket.on("send-cursor-pos", (absCursorPos, clientId) => {
        console.log("DEBUG: The client sending their cursor position: [", clientId, "]");
        console.log("DEBUG: Their cursor position: ", absCursorPos);
        const clientCursor = {cursorPos: absCursorPos, id:clientId};
        const isItAlrThere = clientCursors.findIndex(item => item.id === clientId); // Check if there's already an obj in clientCursors rep'ing this socket.        

        if(isItAlrThere !== -1) {
            // Obj with id===clientId present in clientCursors means that specific element needs to be replaced (isItAlrThere === index):
            clientCursors[isItAlrThere] = clientCursor;
        } else {
            // Not present, so we can push it in:
            clientCursors.push(clientCursor);
        }
        console.log("DEBUG: Current state of clientCursors: ", clientCursors);

        // Broadcasting the state of clientCursors:
        broadcastCursors();
    });

    // disconnection notice:
    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);

        console.log("DEBUG: [clientCursors Pre-Splice] => ", clientCursors);
        // After disconnection, I need to remove the recently-disconnected socket from array clientCursors too:
        let targetIndex = 0;
        clientCursors.forEach(client => {
            if(client.id === socket.id) {
                clientCursors.splice(targetIndex, 1);
            }
            targetIndex += 1; 
        });
        console.log("DEBUG: [clientCursors Post-Splice] => ", clientCursors);
        broadcastCursors();
    });
});

server.listen(4000, () => console.log("Server running on port 4000")); // specify port 4000 as the server location.
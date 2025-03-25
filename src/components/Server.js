/* For implementing real-time Text Editor collaboration between multiple users, I'll
be using Socket.IO with Express as my backend for real-time synchronization. */
const express = require("express");
const http = require("http"); // Express runs on HTTP.
const { Server } = require("socket-io");
const cors = require("cors");

// setup:
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // This is **my** frontend URL; NOTE: I should have a variable for this in .env I think.
        methods: ["GET", "POST"],
    },
});

let documentData = ""; // shared Markdown content.

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
    
    // disconnection notice:
    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});

server.listen(4000, () => console.log("Server running on port 4000")); // specify port 4000 as the server location.

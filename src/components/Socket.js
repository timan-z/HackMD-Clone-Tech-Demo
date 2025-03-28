import { io } from "socket.io-client";

const socket = io("http://localhost:4000"); // NOTE: This is what I'm picking for server port location in Server.js (maybe change it, doesn't matter, who cares).

export default socket;

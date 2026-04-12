import { Server } from "socket.io";
import { Server as Engine } from "@socket.io/bun-engine";

const io = new Server({
  cors: {
    origin: Bun.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  },
});

const engine = new Engine({
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  },
});

io.bind(engine);

io.on("connection", (socket) => {
  socket.on("join-room", (room) => {
    socket.join(room);
    socket.emit("joined-room", { room });
  });

  socket.on("leave-room", (room) => {
    socket.leave(room);
  });
});

export { io, engine };

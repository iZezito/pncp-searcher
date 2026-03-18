import { Server } from "socket.io";
import { Server as Engine } from "@socket.io/bun-engine";

// Criar instâncias do Socket.IO e Engine
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

// Configurar eventos do Socket.IO
io.on("connection", (socket) => {
  console.log("✅ Cliente conectado:", socket.id);

  // Cliente pode entrar em salas específicas
  socket.on("join-room", (room) => {
    socket.join(room);
    console.log(`👤 Cliente ${socket.id} entrou na sala: ${room}`);
    socket.emit("joined-room", { room });
  });

  // Cliente pode sair de salas
  socket.on("leave-room", (room) => {
    socket.leave(room);
    console.log(`👤 Cliente ${socket.id} saiu da sala: ${room}`);
  });

  socket.on("disconnect", () => {
    console.log("❌ Cliente desconectado:", socket.id);
  });
});

// ← IMPORTANTE: Exportar o engine também
export { io, engine };

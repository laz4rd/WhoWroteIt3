import { createServer } from "http";
import next from "next";
import { Server } from "socket.io";
import { registerSocketHandlers } from "./game";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0"; // LAN-reachable, not just localhost
const port = Number(process.env.PORT) || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server(httpServer, {
    cors: { origin: "*" }, // fine for a controlled LAN exhibition booth
  });

  io.on("connection", (socket) => {
    console.log(`[socket] connected: ${socket.id}`);
    registerSocketHandlers(io, socket);
  });

  httpServer.listen(port, hostname, () => {
    console.log(`\n  Who Wrote It? — server ready`);
    console.log(`  Local:   http://localhost:${port}`);
    console.log(`  Network: http://<THIS_MACHINE_LAN_IP>:${port}\n`);
  });
});

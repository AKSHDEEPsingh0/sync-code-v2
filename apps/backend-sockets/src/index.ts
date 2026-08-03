
import { createServer } from "http";
import { Server } from "socket.io";
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";
import { exec } from "child_process";
import * as fs from "fs";
import * as path from "path";

const PORT = process.env.PORT || 5000;

// Observability metric tracking counter gauge
let activeConnectionsCounter = 0;

const httpServer = createServer((req, res) => {
  // CRITICAL FIX: Explicit path router to expose telemetry data to Prometheus
  if (req.url === "/metrics") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(`# HELP active_websocket_connections Current total of live connected developers\n# TYPE active_websocket_connections gauge\nactive_websocket_connections ${activeConnectionsCounter}\n`);
    return;
  }
  
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Distributed Stateful WebSocket Engine Operational\n");
});

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

async function initializeSocketCluster() {
  const targetRedisUrl = process.env.REDIS_URL || "redis://redis-broker:6379";
  console.log(`Connecting to distributed message hub layer at: ${targetRedisUrl}`);
  
  const pubClient = createClient({ url: targetRedisUrl });
  const subClient = pubClient.duplicate();

  await Promise.all([pubClient.connect(), subClient.connect()]);
  console.log("✅ Redis broker communication link stabilized.");
  
  io.adapter(createAdapter(pubClient, subClient));

  io.on("connection", (socket) => {
    activeConnectionsCounter++;
    console.log(`Connected client instance: ${socket.id} | Total Live Users: ${activeConnectionsCounter}`);

    socket.on("join-room", (roomId: string) => {
      socket.join(roomId);
    });

    socket.on("code-change", ({ roomId, code }) => {
      socket.to(roomId).emit("code-update", code);
    });

    socket.on("run-code-request", ({ code }) => {
      console.log(`🎬 Execution request triggered by client: ${socket.id}`);
      const tmpDir = "/tmp";
      const fileName = `sandbox_${socket.id}.py`;
      const filePath = path.join(tmpDir, fileName);

      fs.writeFile(filePath, code, (err) => {
        if (err) {
          socket.emit("run-code-response", `❌ File System Error: ${err.message}`);
          return;
        }

        exec(`python3 ${filePath}`, { timeout: 5000 }, (error, stdout, stderr) => {
          fs.unlink(filePath, () => {});

          if (error && error.killed) {
            socket.emit("run-code-response", "❌ TimeLimitExceeded: Process terminated after 5 seconds.");
            return;
          }

          if (stderr) {
            socket.emit("run-code-response", `❌ Python Runtime Error:\n${stderr}`);
            return;
          }

          socket.emit("run-code-response", stdout || "Script completed successfully with zero console output.");
        });
      });
    });

    socket.on("disconnect", () => {
      activeConnectionsCounter = Math.max(0, activeConnectionsCounter - 1);
      console.log(`Disconnected client: ${socket.id} | Total Live Users: ${activeConnectionsCounter}`);
    });
  });

  httpServer.listen(PORT, () => {
    console.log(`🚀 Distributed WebSocket Engine firmly running on port ${PORT}`);
  });
}

initializeSocketCluster().catch(err => {
  console.error("❌ Cluster initialization fault:", err);
  process.exit(1);
});

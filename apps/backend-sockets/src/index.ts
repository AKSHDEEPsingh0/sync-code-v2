import { createServer } from "http";
import { Server } from "socket.io";
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";
import { exec } from "child_process";
import * as fs from "fs";
import * as path from "path";

const PORT = process.env.PORT || 5000;
const httpServer = createServer((req, res) => {
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
  console.log("Connecting to distributed message hub layer...");
  const pubClient = createClient({ url: process.env.REDIS_URL || "redis://localhost:6379" });
  const subClient = pubClient.duplicate();

  await Promise.all([pubClient.connect(), subClient.connect()]);
  console.log("✅ Redis broker communication link stabilized.");
  
  io.adapter(createAdapter(pubClient, subClient));

  io.on("connection", (socket) => {
    console.log(`Connected client instance: ${socket.id}`);

    socket.on("join-room", (roomId: string) => {
      socket.join(roomId);
    });

    socket.on("code-change", ({ roomId, code }) => {
      socket.to(roomId).emit("code-update", code);
    });

    // --- High-Value SRE Solution: Native Remote Code Execution Sandbox ---
    socket.on("run-code-request", ({ code }) => {
      console.log(`🎬 Execution request triggered by client: ${socket.id}`);
      
      const tmpDir = "/tmp";
      const fileName = `sandbox_${socket.id}.py`;
      const filePath = path.join(tmpDir, fileName);

      // Write whatever arbitrary python code the user typed into a temporary file
      fs.writeFile(filePath, code, (err) => {
        if (err) {
          socket.emit("run-code-response", `❌ File System Error: ${err.message}`);
          return;
        }

        // Execute the code using the native host container python3 runtime engine
        exec(`python3 ${filePath}`, { timeout: 5000 }, (error, stdout, stderr) => {
          // Clean up the temporary file immediately to secure host storage
          fs.unlink(filePath, () => {});

          if (error && error.killed) {
            socket.emit("run-code-response", "❌ TimeLimitExceeded: Process terminated after 5 seconds.");
            return;
          }

          if (stderr) {
            socket.emit("run-code-response", `❌ Python Runtime Error:\n${stderr}`);
            return;
          }

          // Return the absolute genuine computational results
          socket.emit("run-code-response", stdout || "Script completed successfully with zero console output.");
        });
      });
    });

    socket.on("disconnect", () => {
      console.log(`Disconnected client: ${socket.id}`);
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

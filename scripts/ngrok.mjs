import ngrok from "@ngrok/ngrok";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 5173;
const TUNNEL = path.join(ROOT, "client", "src", "config", "tunnel.json");

function loadEnv(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const cut = line.trim();
    if (!cut || cut.startsWith("#")) continue;
    const i = cut.indexOf("=");
    if (i < 1) continue;
    const key = cut.slice(0, i).trim();
    const val = cut.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    if (process.env[key] == null) process.env[key] = val;
  }
}

loadEnv(path.join(ROOT, ".env"));

function writeTunnel(baseUrl) {
  writeFileSync(TUNNEL, `${JSON.stringify({ baseUrl }, null, 2)}\n`);
}

function waitPort(port) {
  return new Promise((resolve) => {
    const tryOnce = () => {
      const sock = net.connect(port, "127.0.0.1", () => {
        sock.end();
        resolve();
      });
      sock.on("error", () => setTimeout(tryOnce, 400));
    };
    tryOnce();
  });
}

async function stop() {
  writeTunnel("");
  await ngrok.disconnect().catch(() => {});
  process.exit(0);
}

async function main() {
  writeTunnel("");
  console.log(`waiting for vite on ${PORT}…`);
  await waitPort(PORT);
  console.log("starting ngrok…");

  const listener = await ngrok.forward({
    addr: PORT,
    authtoken: process.env.NGROK_AUTHTOKEN,
  });
  const url = String(listener.url() || "").replace(/\/$/, "");
  if (!url) throw new Error("ngrok did not publish a url.");

  writeTunnel(url);
  console.log("");
  console.log(`  ➜  running:  ${url}`);
  console.log("      send that url to your friend");
  console.log(`      local:    http://localhost:${PORT}`);
  console.log("");

  process.on("SIGINT", () => void stop());
  process.on("SIGTERM", () => void stop());
  setInterval(() => {}, 60_000);
}

void main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  console.error("Put NGROK_AUTHTOKEN in the repo-root .env file.");
  writeTunnel("");
  process.exit(1);
});

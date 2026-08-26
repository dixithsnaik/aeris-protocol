import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const isWin = process.platform === "win32";
const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "server");
const venvPython = path.join(serverDir, ".venv", isWin ? "Scripts/python.exe" : "bin/python");

function run(cmd, args) {
  const result = spawnSync(
    isWin ? `${cmd} ${args.map((a) => `"${a}"`).join(" ")}` : cmd,
    isWin ? [] : args,
    {
      cwd: serverDir,
      stdio: "inherit",
      shell: isWin,
    },
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (!existsSync(venvPython)) {
  run("python", ["-m", "venv", ".venv"]);
}

run("poetry", ["env", "use", venvPython]);
run("poetry", ["install"]);

const child = spawn(venvPython, ["app.py"], {
  cwd: serverDir,
  stdio: "inherit",
  env: { ...process.env, FLASK_DEBUG: process.env.FLASK_DEBUG ?? "1" },
});
child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});

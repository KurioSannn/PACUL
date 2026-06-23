import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const frontend = {
  name: "frontend",
  script: path.join(rootDirectory, "node_modules", "next", "dist", "bin", "next"),
  args: ["dev", "-p", "3000", "--turbo"],
  cwd: rootDirectory,
};

const backend = {
  name: "backend",
  script: path.join(
    rootDirectory,
    "backend",
    "node_modules",
    "@nestjs",
    "cli",
    "bin",
    "nest.js",
  ),
  args: ["start", "--watch"],
  cwd: path.join(rootDirectory, "backend"),
};

const children = [];
let shuttingDown = false;

function startService(service) {
  const child = spawn(process.execPath, [service.script, ...service.args], {
    cwd: service.cwd,
    env: process.env,
    stdio: "inherit",
  });

  child.on("error", (error) => {
    console.error(`[${service.name}] gagal dijalankan: ${error.message}`);
    shutdown(1);
  });

  child.on("exit", (code, signal) => {
    if (shuttingDown) return;
    const reason = signal ? `signal ${signal}` : `kode ${code ?? 1}`;
    console.error(`[${service.name}] berhenti dengan ${reason}. Menghentikan semua layanan.`);
    shutdown(code ?? 1);
  });

  children.push({ ...service, child });
  return child;
}

function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const { child } of children) {
    if (!child.killed) child.kill();
  }

  setTimeout(() => process.exit(exitCode), 500).unref();
}

async function waitForBackend() {
  const deadline = Date.now() + 120_000;

  while (Date.now() < deadline) {
    try {
      const response = await fetch("http://127.0.0.1:4000/health");
      if (response.ok) return;
    } catch {
      // NestJS is still compiling.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error("Backend tidak siap dalam 120 detik.");
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

console.log("[dev] Menyiapkan backend...");
startService(backend);

try {
  await waitForBackend();
  console.log("[dev] Backend siap. Menjalankan frontend di http://localhost:3000...");
  startService(frontend);
} catch (error) {
  console.error(`[dev] ${error instanceof Error ? error.message : String(error)}`);
  shutdown(1);
}

import { rmSync } from "node:fs";
import { execSync } from "node:child_process";

try {
  rmSync(".next", { recursive: true, force: true });
  console.log("Removed .next cache");
} catch {
  console.log(".next not found (ok)");
}

if (process.platform === "win32") {
  try {
    execSync(
      'powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"',
      { stdio: "ignore" },
    );
    console.log("Freed port 3000");
  } catch {
    console.log("Port 3000 already free");
  }
}

console.log("Done. Start dev server with: npm run dev");

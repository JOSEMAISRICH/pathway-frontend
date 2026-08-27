/**
 * Abre la URL del dev server (Windows, macOS, Linux).
 */
const { spawn } = require("child_process");

const url = "http://localhost:5500";

if (process.platform === "win32") {
  spawn("cmd", ["/c", "start", "", url], {
    detached: true,
    stdio: "ignore",
    shell: false,
  }).unref();
} else if (process.platform === "darwin") {
  spawn("open", [url], { detached: true, stdio: "ignore" }).unref();
} else {
  spawn("xdg-open", [url], { detached: true, stdio: "ignore" }).unref();
}

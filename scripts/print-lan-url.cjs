#!/usr/bin/env node
/**
 * Muestra URLs LAN para probar PathWay en el móvil (misma WiFi).
 * Uso: npm run dev:lan
 */
const os = require("os");

function lanIps() {
  const nets = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] ?? []) {
      if (net.family === "IPv4" && !net.internal) ips.push(net.address);
    }
  }
  return ips;
}

const ips = lanIps();
const port = process.env.PORT || "5500";

console.log("\nPathWay — acceso en red local (móvil en la misma WiFi):\n");
if (ips.length === 0) {
  console.log("  No se detectó IP LAN. Usa ipconfig y abre http://TU_IP:" + port);
} else {
  for (const ip of ips) {
    console.log("  Front:  http://" + ip + ":" + port + "/dashboard");
    console.log("  Portal: http://" + ip + ":" + port + "/portal/{token}");
    console.log("");
  }
}
console.log("Backend Express debe estar en :3000 (npm run dev en PathWay-Backend).");
console.log("En el .env del backend pon:");
console.log("  PUBLIC_APP_ORIGIN=http://" + (ips[0] || "TU_IP") + ":" + port);
console.log("\nLos enlaces viejos con localhost NO funcionan en el móvil.");
console.log("Genera un enlace nuevo desde el panel tras cambiar PUBLIC_APP_ORIGIN.\n");

import { readFileSync } from "node:fs";

const index = readFileSync("index.html", "utf8");
const world = readFileSync("src/world.js", "utf8");
const app = readFileSync("src/app.js", "utf8");
const data = readFileSync("src/data.js", "utf8");

const checks = [
  ["PlayCanvas runtime is pinned", index.includes("playcanvas@2.22.6")],
  ["No Three.js runtime remains", !index.includes("three") && !world.includes("THREE")],
  ["World imports PlayCanvas", world.includes('from "playcanvas"')],
  ["Reconstructed data warning exists", index.includes("RECONSTRUCTED VIEW")],
  ["Field report category exists", data.includes("FIELD_REPORT")],
  ["Simulation category exists", data.includes("SIMULATION")],
  ["Northern-water fact-check lock exists", index.includes("น้ำเหนือ") && index.includes("ห้ามเกมระบุ")],
  ["03:00 field event exists", data.includes("03:00") && data.includes("ครึ่งเตียง")],
  ["Now field report exists", data.includes("ระดับเข่า") && data.includes("เอว–อก")],
  ["Safe-node gameplay exists", world.includes("SAFE_NODES") && world.includes("moveHeroTo")],
  ["Six safe mission nodes exist", ["electric","essentials","contact","route","log","trigger"].every(id => world.includes(`${id}:`))],
  ["Gameplay only enables on NOW", app.includes('event.id === "now"')],
  ["No unsafe wading mission language", index.includes("ไม่มีภารกิจให้ลุยน้ำ")],
  ["Orthographic overlay avoids z-depth misuse", !world.includes("out.z > 0")],
  ["Interaction HUD is present", index.includes('id="hotspotLayer"') && index.includes('id="interactionPanel"')],
  ["Portrait camera profiles exist", world.includes('"portrait-narrow"') && world.includes('"portrait"')],
  ["Responsive camera recenters on orientation change", world.includes("profile.mode !== this.viewMode")],
  ["Reset uses current device profile", app.includes("resetView(false)")],
  ["Portrait canvas permits vertical page scroll", readFileSync("styles.css", "utf8").includes("touch-action: pan-y")],
  ["Mobile viewport uses svh", readFileSync("styles.css", "utf8").includes("68svh")]
];

let failed = false;
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`);
  if (!ok) failed = true;
}
if (failed) process.exit(1);
console.log(`Verified ${checks.length}/${checks.length} Flood Survival invariants.`);

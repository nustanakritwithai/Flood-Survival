import { readFileSync } from "node:fs";

const index = readFileSync("index.html", "utf8");
const world = readFileSync("src/world.js", "utf8");
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
  ["Now field report exists", data.includes("ระดับเข่า") && data.includes("เอว–อก")]
];

let failed = false;
for (const [name, ok] of checks) {
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}`);
  if (!ok) failed = true;
}
if (failed) process.exit(1);
console.log(`Verified ${checks.length}/${checks.length} Flood Survival invariants.`);

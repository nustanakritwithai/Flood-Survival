import * as pc from "playcanvas";

function material(color, opts = {}) {
  const m = new pc.StandardMaterial();
  m.diffuse = new pc.Color(color[0], color[1], color[2]);
  m.metalness = opts.metalness ?? 0;
  m.gloss = opts.gloss ?? 0.25;
  if (opts.emissive) {
    m.emissive = new pc.Color(...opts.emissive);
    m.emissiveIntensity = opts.emissiveIntensity ?? 1;
  }
  if (opts.opacity !== undefined && opts.opacity < 1) {
    m.opacity = opts.opacity;
    m.blendType = pc.BLEND_NORMAL;
    m.depthWrite = opts.depthWrite ?? false;
  }
  m.update();
  return m;
}

function primitive(app, type, name, scale, position, mat, euler = [0, 0, 0], parent = app.root) {
  const e = new pc.Entity(name);
  e.addComponent("render", { type });
  parent.addChild(e);
  e.setLocalScale(...scale);
  e.setLocalPosition(...position);
  e.setLocalEulerAngles(...euler);
  if (e.render?.meshInstances?.[0]) e.render.meshInstances[0].material = mat;
  return e;
}

const SAFE_NODES = {
  electric: { label: "ตู้ไฟชั้นบน", icon: "⚡", position: [-1.62, 2.12, -0.42] },
  essentials: { label: "กล่องของจำเป็น", icon: "▣", position: [-1.40, 2.02, 0.55] },
  contact: { label: "จุดสื่อสาร", icon: "◉", position: [-0.72, 2.02, 0.58] },
  route: { label: "ทางขึ้นที่สูง", icon: "↑", position: [0.03, 2.02, 0.46] },
  log: { label: "จุดสังเกตระดับน้ำ", icon: "≋", position: [-0.14, 2.08, -0.56] },
  trigger: { label: "แผนฉุกเฉิน", icon: "!", position: [-1.08, 2.02, -0.56] }
};

export class FloodWorld {
  constructor(canvas) {
    this.canvas = canvas;
    this.zoom = 7.1;
    this.rainFx = 0.14;
    this.rainDrops = [];
    this.hotspotEntities = new Map();
    this.interactionsEnabled = true;
    this.heroTarget = null;
    this.heroMode = "safe";

    this.app = new pc.Application(canvas, {
      graphicsDeviceOptions: {
        antialias: true,
        alpha: false,
        powerPreference: "high-performance"
      }
    });
    this.app.start();
    this.app.scene.ambientLight = new pc.Color(0.20, 0.29, 0.35);
    this.app.scene.exposure = 1.12;

    this.m = {
      ground: material([0.11, 0.17, 0.18]),
      grass: material([0.11, 0.23, 0.19]),
      road: material([0.09, 0.12, 0.14]),
      line: material([0.70, 0.64, 0.40]),
      canal: material([0.035, 0.24, 0.31], { gloss: 0.75 }),
      water: material([0.045, 0.38, 0.54], { gloss: 0.92, opacity: 0.56 }),
      wall: material([0.68, 0.58, 0.45]),
      wall2: material([0.50, 0.40, 0.31]),
      plaster: material([0.78, 0.70, 0.56]),
      roof: material([0.35, 0.14, 0.15]),
      bed: material([0.43, 0.28, 0.18]),
      mattress: material([0.79, 0.78, 0.70]),
      skin: material([0.59, 0.34, 0.25]),
      shirt: material([0.05, 0.17, 0.23]),
      concrete: material([0.34, 0.38, 0.40]),
      metal: material([0.22, 0.28, 0.31], { metalness: 0.25, gloss: 0.55 }),
      tree: material([0.10, 0.29, 0.20]),
      trunk: material([0.27, 0.18, 0.12]),
      lamp: material([0.76, 0.43, 0.13], { emissive: [1, 0.46, 0.12], emissiveIntensity: 1.8 }),
      hotspot: material([0.37, 0.83, 1.0], { emissive: [0.08, 0.38, 0.62], emissiveIntensity: 1.2, opacity: 0.82 }),
      emergency: material([0.95, 0.31, 0.33], { emissive: [0.55, 0.05, 0.05], emissiveIntensity: 1.1 }),
      crate: material([0.38, 0.29, 0.19]),
      blue: material([0.12, 0.43, 0.60])
    };

    this.makeCamera();
    this.makeLights();
    this.buildScene();
    this.makeRain();
    this.resize();

    this.app.on("update", dt => this.update(dt));
    window.addEventListener("resize", () => this.resize());
  }

  makeCamera() {
    this.camera = new pc.Entity("Isometric Camera");
    this.camera.addComponent("camera", {
      clearColor: new pc.Color(0.035, 0.10, 0.14),
      projection: pc.PROJECTION_ORTHOGRAPHIC,
      orthoHeight: this.zoom,
      nearClip: 0.1,
      farClip: 100
    });
    this.app.root.addChild(this.camera);
    this.resetView();
  }

  makeLights() {
    const moon = new pc.Entity("Cool Moon");
    moon.addComponent("light", {
      type: "directional",
      color: new pc.Color(0.67, 0.82, 1),
      intensity: 2.15,
      castShadows: true
    });
    moon.setEulerAngles(48, -35, 0);
    this.app.root.addChild(moon);

    const warm = new pc.Entity("Warm House Light");
    warm.addComponent("light", {
      type: "omni",
      color: new pc.Color(1, 0.53, 0.20),
      intensity: 8,
      range: 5
    });
    warm.setPosition(-1.55, 2.35, 0.15);
    this.app.root.addChild(warm);

    const street = new pc.Entity("Street Light Glow");
    street.addComponent("light", {
      type: "omni",
      color: new pc.Color(1, 0.70, 0.34),
      intensity: 5,
      range: 4.5
    });
    street.setPosition(3.9, 2.5, 1.55);
    this.app.root.addChild(street);
  }

  resetView() {
    this.camera.setPosition(7.4, 7.7, 8.9);
    this.camera.lookAt(-0.15, 0.82, -0.05);
    if (this.camera.camera) this.camera.camera.orthoHeight = this.zoom;
  }

  setZoom(delta) {
    this.zoom = pc.math.clamp(this.zoom + delta, 4.8, 10);
    this.camera.camera.orthoHeight = this.zoom;
  }

  buildScene() {
    primitive(this.app, "box", "Ground", [9.8, 0.16, 7.6], [0, -0.13, 0], this.m.ground);
    primitive(this.app, "box", "Grass bank left", [9.6, 0.08, 0.38], [0, -0.02, -1.82], this.m.grass);
    primitive(this.app, "box", "Grass bank right", [9.6, 0.08, 0.35], [0, -0.02, -3.44], this.m.grass);

    primitive(this.app, "box", "Road", [9.4, 0.04, 1.55], [0, -0.02, 1.72], this.m.road);
    for (let x = -3.9; x <= 3.9; x += 1.45) {
      primitive(this.app, "box", "Road marking", [0.72, 0.015, 0.05], [x, 0.015, 1.72], this.m.line);
    }

    primitive(this.app, "box", "Canal bed", [9.65, 0.05, 1.35], [0, -0.02, -2.65], this.m.road);
    this.canal = primitive(this.app, "box", "Canal water", [9.65, 0.20, 1.32], [0, 0.12, -2.65], this.m.canal);
    this.water = primitive(this.app, "box", "Flood water", [9.75, 0.16, 7.35], [0, 0.08, 0], this.m.water);

    this.buildHeroHouse();
    this.buildNeighborHouse(-3.32, -0.10, 0.72);
    this.buildNeighborHouse(3.28, 0.05, 0.92);
    this.buildBridge();
    this.buildDrainageGate();
    this.buildStreetFurniture();
    this.buildTrees();
    this.buildFloatingDebris();
    this.buildHotspots();
  }

  buildHeroHouse() {
    const x = -0.90;
    const z = 0.20;

    primitive(this.app, "box", "Hero ground floor", [2.55, 0.17, 2.05], [x, 0.03, z], this.m.wall2);
    primitive(this.app, "box", "Hero lower back wall", [2.55, 1.62, 0.12], [x, 0.88, z - 0.98], this.m.plaster);
    primitive(this.app, "box", "Hero lower side wall", [0.12, 1.62, 2.05], [x - 1.22, 0.88, z], this.m.wall);
    primitive(this.app, "box", "Hero upper floor", [2.55, 0.15, 2.05], [x, 1.80, z], this.m.wall2);

    primitive(this.app, "box", "Hero upper back wall", [2.55, 1.20, 0.12], [x, 2.48, z - 0.98], this.m.plaster);
    primitive(this.app, "box", "Hero upper side wall", [0.12, 1.20, 2.05], [x - 1.22, 2.48, z], this.m.wall);
    primitive(this.app, "box", "Hero upper front rail", [2.10, 0.25, 0.08], [x + 0.10, 1.98, z + 0.93], this.m.metal);
    primitive(this.app, "box", "Hero roof", [2.10, 0.36, 2.10], [x, 3.35, z], this.m.roof, [0, 45, 0]);

    primitive(this.app, "box", "Bed frame", [1.08, 0.28, 0.74], [x + 0.28, 0.30, z - 0.24], this.m.bed);
    primitive(this.app, "box", "Mattress", [1.00, 0.20, 0.69], [x + 0.28, 0.52, z - 0.24], this.m.mattress);
    primitive(this.app, "box", "Bedside table", [0.35, 0.44, 0.34], [x - 0.64, 0.30, z - 0.38], this.m.bed);
    primitive(this.app, "sphere", "Warm lamp", [0.14, 0.14, 0.14], [x - 0.64, 0.64, z - 0.38], this.m.lamp);

    primitive(this.app, "box", "Upper essentials crate", [0.42, 0.32, 0.34], [x - 0.50, 2.02, z + 0.52], this.m.crate);
    primitive(this.app, "box", "Upper radio", [0.28, 0.18, 0.16], [x - 0.18, 2.02, z - 0.56], this.m.metal);
    primitive(this.app, "box", "Upper battery", [0.22, 0.18, 0.16], [x + 0.18, 2.02, z - 0.56], this.m.blue);
    primitive(this.app, "box", "Upper breaker", [0.18, 0.28, 0.08], [x - 0.78, 2.36, z - 0.91], this.m.metal);
    primitive(this.app, "box", "Stair top", [0.45, 0.12, 0.52], [x + 0.88, 1.92, z + 0.44], this.m.wall2);

    this.hero = new pc.Entity("Main Character");
    this.app.root.addChild(this.hero);
    primitive(this.app, "cylinder", "Hero body", [0.16, 0.46, 0.16], [0, 0.24, 0], this.m.shirt, [0, 0, 0], this.hero);
    primitive(this.app, "sphere", "Hero head", [0.22, 0.22, 0.22], [0, 0.62, 0], this.m.skin, [0, 0, 0], this.hero);
    primitive(this.app, "box", "Hero backpack", [0.20, 0.26, 0.10], [0, 0.28, -0.13], this.m.crate, [0, 0, 0], this.hero);
    this.hero.setPosition(-0.72, 1.91, 0.48);
  }

  buildNeighborHouse(x, z, tint) {
    const wall = material([0.45 * tint, 0.44 * tint, 0.40 * tint]);
    primitive(this.app, "box", "Neighbor body", [1.55, 1.78, 1.55], [x, 0.90, z], wall);
    primitive(this.app, "box", "Neighbor roof", [1.32, 0.32, 1.32], [x, 2.10, z], this.m.roof, [0, 45, 0]);
    primitive(this.app, "box", "Neighbor window", [0.42, 0.38, 0.04], [x + 0.28, 1.12, z + 0.79], this.m.blue);
  }

  buildBridge() {
    primitive(this.app, "box", "Bridge deck", [2.25, 0.20, 1.55], [2.15, 0.66, -2.65], this.m.concrete);
    primitive(this.app, "box", "Bridge pillar 1", [0.18, 1.10, 0.22], [1.38, 0.15, -2.65], this.m.concrete);
    primitive(this.app, "box", "Bridge pillar 2", [0.18, 1.10, 0.22], [2.92, 0.15, -2.65], this.m.concrete);
    primitive(this.app, "box", "Bridge rail 1", [2.25, 0.12, 0.08], [2.15, 0.84, -1.92], this.m.metal);
    primitive(this.app, "box", "Bridge rail 2", [2.25, 0.12, 0.08], [2.15, 0.84, -3.38], this.m.metal);
  }

  buildDrainageGate() {
    primitive(this.app, "box", "Drainage gate frame", [0.72, 0.88, 0.16], [-3.95, 0.44, -2.64], this.m.concrete);
    primitive(this.app, "box", "Drainage gate shutter", [0.48, 0.52, 0.08], [-3.95, 0.42, -2.54], this.m.metal);
    primitive(this.app, "cylinder", "Drainage wheel", [0.19, 0.05, 0.19], [-3.95, 0.87, -2.44], this.m.line, [90, 0, 0]);
  }

  buildStreetFurniture() {
    [-4.1, 4.12].forEach(x => {
      primitive(this.app, "cylinder", "Utility pole", [0.07, 2.65, 0.07], [x, 1.28, 1.48], this.m.concrete);
      primitive(this.app, "box", "Pole arm", [0.50, 0.05, 0.05], [x + (x < 0 ? 0.18 : -0.18), 2.48, 1.48], this.m.metal);
      primitive(this.app, "sphere", "Street lamp", [0.12, 0.12, 0.12], [x + (x < 0 ? 0.40 : -0.40), 2.42, 1.48], this.m.lamp);
    });
    primitive(this.app, "box", "Road sign post", [0.05, 1.10, 0.05], [3.30, 0.56, 0.92], this.m.metal);
    primitive(this.app, "box", "Canal road sign", [0.72, 0.34, 0.06], [3.30, 1.23, 0.92], this.m.blue);
  }

  buildTrees() {
    [[-3.55, -1.46], [3.55, -1.45], [0.55, -1.55]].forEach(([x, z]) => {
      primitive(this.app, "cylinder", "Tree trunk", [0.13, 0.85, 0.13], [x, 0.42, z], this.m.trunk);
      primitive(this.app, "sphere", "Tree crown", [0.72, 0.72, 0.72], [x, 1.12, z], this.m.tree);
    });
  }

  buildFloatingDebris() {
    const pieces = [
      [-2.45, 0.14, 0.96, 0.26, 0.05, 0.18],
      [1.18, 0.16, 0.55, 0.18, 0.05, 0.16],
      [2.72, 0.13, 2.12, 0.32, 0.04, 0.12],
      [0.92, 0.15, -0.75, 0.20, 0.05, 0.20]
    ];
    this.debris = pieces.map((p, i) => {
      const d = primitive(this.app, "box", "Floating debris", [p[3], p[4], p[5]], [p[0], p[1], p[2]], i % 2 ? this.m.crate : this.m.metal);
      d._baseY = p[1];
      d._phase = i * 1.3;
      return d;
    });
  }

  buildHotspots() {
    Object.entries(SAFE_NODES).forEach(([id, cfg]) => {
      const marker = primitive(
        this.app,
        "cylinder",
        `Safe hotspot ${id}`,
        [0.20, 0.035, 0.20],
        cfg.position,
        id === "trigger" ? this.m.emergency : this.m.hotspot
      );
      marker._baseY = cfg.position[1];
      marker._phase = Object.keys(SAFE_NODES).indexOf(id) * 0.7;
      this.hotspotEntities.set(id, marker);
    });
  }

  getHotspots() {
    return Object.entries(SAFE_NODES).map(([id, cfg]) => ({ id, ...cfg }));
  }

  worldToScreen(position) {
    const out = new pc.Vec3();
    this.camera.camera.worldToScreen(new pc.Vec3(...position), out);
    return { x: out.x, y: out.y, visible: out.z > 0 };
  }

  setInteractionEnabled(enabled) {
    this.interactionsEnabled = enabled;
    this.hotspotEntities.forEach(e => { e.enabled = enabled; });
    if (!enabled) this.heroTarget = null;
  }

  moveHeroTo(id) {
    const node = SAFE_NODES[id];
    if (!node || !this.interactionsEnabled) return false;
    this.heroTarget = new pc.Vec3(node.position[0], 1.91, node.position[2]);
    return true;
  }

  setState(event) {
    this.rainFx = event.rainFx;
    this.water.setPosition(0, 0.05 + event.water * 0.93, 0);
    this.water.setLocalScale(9.75, 0.12 + event.water * 0.15, 7.35);
    this.canal.setPosition(0, 0.12 + event.water * 0.22, -2.65);

    const enabledCount = Math.round(this.rainDrops.length * event.rainFx);
    this.rainDrops.forEach((d, i) => { d.enabled = i < enabledCount; });

    const dark = 0.045 + event.rainFx * 0.045;
    this.camera.camera.clearColor = new pc.Color(dark, 0.10 - event.rainFx * 0.025, 0.14 - event.rainFx * 0.02);

    if (event.id === "d0" || event.id === "d1") {
      this.hero.setPosition(-0.72, 0.16, 0.42);
    } else if (event.id === "d2") {
      this.hero.setPosition(-0.58, 0.69, -0.05);
    } else {
      this.hero.setPosition(-0.72, 1.91, 0.48);
    }
    this.heroTarget = null;
  }

  makeRain() {
    const lowPower = (navigator.hardwareConcurrency || 8) <= 4;
    const count = lowPower ? 48 : 84;
    const rainMat = material([0.60, 0.79, 0.94], {
      emissive: [0.12, 0.20, 0.28],
      emissiveIntensity: 0.35,
      opacity: 0.68
    });

    for (let i = 0; i < count; i++) {
      const d = primitive(
        this.app,
        "box",
        "Rain drop",
        [0.018, 0.18, 0.018],
        [(Math.random() - 0.5) * 9.5, Math.random() * 7 + 0.7, (Math.random() - 0.5) * 6.6],
        rainMat,
        [0, 0, -10]
      );
      d.enabled = false;
      d._speed = 4 + Math.random() * 3;
      this.rainDrops.push(d);
    }
  }

  update(dt) {
    const time = performance.now() * 0.001;

    for (const d of this.rainDrops) {
      if (!d.enabled) continue;
      const p = d.getPosition().clone();
      p.y -= d._speed * dt * (0.7 + this.rainFx * 0.9);
      p.x -= dt * 0.35;
      if (p.y < -0.1) {
        p.y = 7 + Math.random();
        p.x = (Math.random() - 0.5) * 9.5;
        p.z = (Math.random() - 0.5) * 6.6;
      }
      d.setPosition(p);
    }

    this.hotspotEntities.forEach(e => {
      if (!e.enabled) return;
      const p = e.getPosition().clone();
      p.y = e._baseY + Math.sin(time * 2.6 + e._phase) * 0.045;
      e.setPosition(p);
    });

    this.debris.forEach(d => {
      const p = d.getPosition().clone();
      p.y = d._baseY + Math.sin(time * 1.4 + d._phase) * 0.025;
      d.setPosition(p);
    });

    if (this.heroTarget) {
      const p = this.hero.getPosition().clone();
      const speed = Math.min(1, dt * 3.4);
      p.x = pc.math.lerp(p.x, this.heroTarget.x, speed);
      p.y = pc.math.lerp(p.y, this.heroTarget.y, speed);
      p.z = pc.math.lerp(p.z, this.heroTarget.z, speed);
      this.hero.setPosition(p);
      if (p.distance(this.heroTarget) < 0.035) {
        this.hero.setPosition(this.heroTarget);
        this.heroTarget = null;
      }
    }
  }

  resize() {
    const parent = this.canvas.parentElement;
    const w = Math.max(320, parent.clientWidth);
    const h = Math.max(420, parent.clientHeight);
    this.app.resizeCanvas(w, h);
  }
}

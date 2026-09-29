import { FloodWorld } from "./world.js";
import { CLASS_META, EVENTS, MISSIONS, SOURCES } from "./data.js";

const $ = selector => document.querySelector(selector);
const world = new FloodWorld($("#application"));
let selected = EVENTS.length - 1;
let activeInteractionId = null;

const completed = new Set(JSON.parse(localStorage.getItem("flood-survival-missions") || "[]"));
const hotspotButtons = new Map();

function tag(type) {
  const meta = CLASS_META[type] || CLASS_META.SIMULATION;
  return `<span class="chip ${meta.css}">${meta.label}</span>`;
}

function saveProgress() {
  localStorage.setItem("flood-survival-missions", JSON.stringify([...completed]));
}

function updateProgress() {
  $("#missionProgress").textContent = `${completed.size}/${MISSIONS.length}`;
  document.querySelectorAll(".mission").forEach(card => {
    const id = card.dataset.mission;
    const checked = completed.has(id);
    card.classList.toggle("is-done", checked);
    const input = card.querySelector("input");
    if (input) input.checked = checked;
  });
  hotspotButtons.forEach((button, id) => {
    button.classList.toggle("done", completed.has(id));
  });

  if (activeInteractionId) {
    const done = completed.has(activeInteractionId);
    const button = $("#completeInteraction");
    button.textContent = done ? "เตรียมแล้ว ✓" : "ยืนยันว่าเตรียมแล้ว";
    button.classList.toggle("done", done);
  }
}

function renderTimeline() {
  const el = $("#timeline");
  el.innerHTML = "";

  EVENTS.forEach((event, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = index === selected ? "active" : "";
    button.innerHTML = `<strong>${event.nav}</strong><span>${event.date}</span>`;
    button.addEventListener("click", () => selectEvent(index));
    el.appendChild(button);
  });
}

function selectEvent(index) {
  selected = index;
  const event = EVENTS[index];
  const meta = CLASS_META[event.class];

  $("#eventTime").textContent = event.time;
  $("#eventSource").textContent = meta.label;
  $("#eventTitle").textContent = event.title;
  $("#eventSummary").textContent = event.summary;
  $("#canalState").textContent = event.canal;
  $("#rainState").textContent = event.rain;
  $("#playerGoal").textContent = event.goal;
  $("#sceneTitle").textContent = event.scene;
  $("#sceneSubtitle").textContent = event.sceneNote;

  const eventClass = $("#eventClass");
  eventClass.className = `chip ${meta.css}`;
  eventClass.textContent = meta.label;

  const source = $("#sourceLink");
  if (event.url) {
    source.href = event.url;
    source.textContent = `เปิดแหล่งข้อมูล · ${event.source} ↗`;
    source.removeAttribute("aria-disabled");
  } else {
    source.removeAttribute("href");
    source.textContent = `ที่มา · ${event.source}`;
    source.setAttribute("aria-disabled", "true");
  }

  const interactive = event.id === "now";
  world.setState(event);
  world.setInteractionEnabled(interactive);
  $("#hotspotLayer").hidden = !interactive;
  $("#playModeBadge").hidden = !interactive;
  $("#historyNotice").hidden = interactive;

  if (!interactive) closeInteraction();

  renderTimeline();
}

function renderMissions() {
  const el = $("#missions");
  el.innerHTML = "";

  MISSIONS.forEach(mission => {
    const row = document.createElement("div");
    row.className = "mission";
    row.dataset.mission = mission.id;

    row.innerHTML = `
      <input type="checkbox" aria-label="ทำภารกิจ ${mission.title}" ${completed.has(mission.id) ? "checked" : ""}>
      <span>
        <strong>${mission.title}</strong>
        <small>${mission.detail}</small>
      </span>
      <button class="mission-jump" type="button">ไปจุดนี้</button>
    `;

    row.querySelector("input").addEventListener("change", event => {
      event.target.checked ? completed.add(mission.id) : completed.delete(mission.id);
      saveProgress();
      updateProgress();
    });

    row.querySelector(".mission-jump").addEventListener("click", () => {
      const nowIndex = EVENTS.findIndex(event => event.id === "now");
      if (selected !== nowIndex) selectEvent(nowIndex);
      openInteraction(mission.id);
      $("#application").scrollIntoView({ behavior: "smooth", block: "center" });
    });

    el.appendChild(row);
  });

  updateProgress();
}

function renderSources() {
  $("#sources").innerHTML = SOURCES.map(source => `
    <div class="source-row">
      ${tag(source.type)}
      <div>
        ${source.url
          ? `<a href="${source.url}" target="_blank" rel="noreferrer"><strong>${source.title}</strong></a>`
          : `<strong>${source.title}</strong>`}
        <small>${source.note}</small>
      </div>
    </div>
  `).join("");
}

function renderHotspots() {
  const layer = $("#hotspotLayer");
  layer.innerHTML = "";
  hotspotButtons.clear();

  for (const hotspot of world.getHotspots()) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "hotspot-button";
    button.dataset.id = hotspot.id;
    button.textContent = hotspot.icon;
    button.setAttribute("aria-label", hotspot.label);
    button.addEventListener("click", () => openInteraction(hotspot.id));
    layer.appendChild(button);
    hotspotButtons.set(hotspot.id, button);
  }

  updateProgress();
}

function openInteraction(id) {
  const mission = MISSIONS.find(item => item.id === id);
  if (!mission || selected !== EVENTS.findIndex(event => event.id === "now")) return;

  activeInteractionId = id;
  world.moveHeroTo(id);

  $("#interactionTitle").textContent = mission.title;
  $("#interactionDetail").textContent = mission.detail;
  $("#interactionPanel").hidden = false;
  updateProgress();
}

function closeInteraction() {
  activeInteractionId = null;
  $("#interactionPanel").hidden = true;
}

function completeInteraction() {
  if (!activeInteractionId) return;
  completed.add(activeInteractionId);
  saveProgress();
  updateProgress();
}

function updateHotspotPositions() {
  if (!$("#hotspotLayer").hidden) {
    const canvas = $("#application");
    const scaleX = canvas.clientWidth / Math.max(1, canvas.width);
    const scaleY = canvas.clientHeight / Math.max(1, canvas.height);

    for (const hotspot of world.getHotspots()) {
      const button = hotspotButtons.get(hotspot.id);
      if (!button) continue;

      const screen = world.worldToScreen(hotspot.position);
      button.style.left = `${screen.x * scaleX}px`;
      button.style.top = `${screen.y * scaleY}px`;
      button.hidden = !screen.visible;
    }
  }

  requestAnimationFrame(updateHotspotPositions);
}

$("#zoomIn").addEventListener("click", () => world.setZoom(-0.6));
$("#zoomOut").addEventListener("click", () => world.setZoom(0.6));
$("#resetView").addEventListener("click", () => world.resetView(false));
$("#helpButton").addEventListener("click", () => $("#helpDialog").showModal());
$("#closeHelp").addEventListener("click", () => $("#helpDialog").close());
$("#closeInteraction").addEventListener("click", closeInteraction);
$("#completeInteraction").addEventListener("click", completeInteraction);

renderTimeline();
renderMissions();
renderSources();
renderHotspots();
selectEvent(selected);
requestAnimationFrame(updateHotspotPositions);

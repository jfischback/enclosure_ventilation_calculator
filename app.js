const form = document.getElementById("form");
const $ = (id) => document.getElementById(id);

// Number inputs: blank or invalid (negative, not a number) is treated as blank.
function numOf(el) {
  const raw = el.value.trim();
  if (raw === "") return "";
  const v = Number(raw);
  return Number.isFinite(v) && v >= 0 ? v : "";
}
const num = (id) => numOf($(id));

// Blank results show as a dash.
function fmt(value, digits) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "–";
  return value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: digits });
}

function setPill(el, pass) {
  el.textContent = pass === "" ? "–" : pass ? "PASS" : "FAIL";
  el.classList.toggle("pass", pass === true);
  el.classList.toggle("fail", pass === false);
}

function show(id, value, digits) {
  $(id).textContent = fmt(value, digits);
}

// Openings list (audit mode). Width and height are in inches.
function addOpening() {
  const row = document.createElement("div");
  row.className = "op-row";
  row.innerHTML = `
    <div class="box"><input type="text" class="op-name" placeholder="e.g. Door" aria-label="Opening name"></div>
    <div class="box"><input type="number" class="op-w" inputmode="decimal" min="0" step="any" aria-label="Opening width"><span class="unit">in</span></div>
    <div class="box"><input type="number" class="op-h" inputmode="decimal" min="0" step="any" aria-label="Opening height"><span class="unit">in</span></div>
    <span class="op-area">–</span>
    <button type="button" class="op-remove" aria-label="Remove opening">×</button>`;
  $("openingRows").appendChild(row);
}

function readOpenings() {
  return [...$("openingRows").children].map((row) => {
    const o = { width: numOf(row.querySelector(".op-w")), height: numOf(row.querySelector(".op-h")) };
    const area = typeof o.width === "number" && typeof o.height === "number" ? (o.width * o.height) / 144 : "";
    row.querySelector(".op-area").textContent = area === "" ? "–" : fmt(area, 2) + " ft²";
    return o;
  });
}

function updateDesign(shared) {
  const r = calculateDesign({ ...shared, ndoPct: num("ndoPct"), faceVelocity: num("faceVelocity") });

  show("surfaceArea", r.surfaceArea, 1);
  show("volume", r.volume, 1);
  show("ndoArea", r.ndoArea, 1);
  show("effectiveNdoPct", r.effectiveNdoPct, 1);
  show("qOut", r.qOut, 0);
  show("ach", r.ach, 1);
  $("ductCalc").textContent = typeof r.ductCalc === "number" ? r.ductCalc.toFixed(1) : "–";
  show("stockDuct", r.stockDuct, 0);
  show("velocityInStockDuct", r.velocityInStockDuct, 0);
  setPill($("ndoCheck"), r.ndoPass);
  setPill($("faceCheck"), r.facePass);

  // Bars are scaled to the largest Q Out in the table.
  const maxQ = Math.max(...r.steps.map((s) => (typeof s.qOut === "number" ? s.qOut : 0)));
  $("stepRows").innerHTML = r.steps
    .map((s) => {
      const width = maxQ > 0 && typeof s.qOut === "number" ? (s.qOut / maxQ) * 100 : 0;
      const current = s.ndoPct === r.ndoPct ? ' class="current"' : "";
      return `<tr${current}>
        <td>${s.ndoPct}%</td>
        <td>${fmt(s.ndoArea, 1)} <span class="u">ft²</span></td>
        <td class="q"><span class="q-val">${fmt(s.qOut, 0)} <span class="u">CFM</span></span><span class="track"><span class="fill" style="width:${width}%"></span></span></td>
        <td>${fmt(s.stockDuct, 0)} <span class="u">in</span></td>
        <td>${fmt(s.ach, 1)}</td>
      </tr>`;
    })
    .join("");
}

function updateAudit(shared) {
  const flowSource = $("flowSource").value;
  document.querySelectorAll("[data-flow]").forEach((el) => (el.hidden = el.dataset.flow !== flowSource));
  $("ductOpt").hidden = flowSource === "duct";

  const r = calculateAudit({
    ...shared,
    openings: readOpenings(),
    flowSource,
    exhaustCfm: num("exhaustCfm"),
    ductVelocity: num("ductVelocity"),
    faceVelocity: num("measuredFace"),
    ductDiameter: num("ductDiameter"),
    pressureDiff: num("pressureDiff"),
  });

  show("aFace", r.actualFaceVelocity, 0);
  show("aSurfaceArea", r.surfaceArea, 1);
  show("aVolume", r.volume, 1);
  show("aNdoArea", r.ndoArea, 1);
  show("aNdoPct", r.ndoPct, 1);
  show("aQOut", r.qOut, 0);
  show("aAch", r.ach, 1);
  show("aDuctVelocity", r.actualDuctVelocity, 0);
  show("aRequiredQ", r.requiredQ, 0);
  show("aMaxNdo", r.maxNdoAtFlow, 1);

  const short = typeof r.flowGap === "number" && r.flowGap > 0;
  $("aGapLabel").textContent = short ? "Flow short of target" : "Flow above target";
  show("aGap", typeof r.flowGap === "number" ? Math.abs(r.flowGap) : "", 0);

  setPill($("aNdoCheck"), r.ndoPass);
  setPill($("aFaceCheck"), r.facePass);
  setPill($("aPressureCheck"), r.pressurePass);
  setPill($("aTransportCheck"), r.transportPass);
}

function update() {
  const mode = form.querySelector('input[name="mode"]:checked').value;
  document.querySelectorAll("[data-mode]").forEach((el) => (el.hidden = el.dataset.mode !== mode));

  const desc = $("description").value.trim();
  document.querySelectorAll("[data-desc]").forEach((el) => {
    el.textContent = desc;
    el.hidden = !desc;
  });

  const shared = {
    length: num("length"),
    width: num("width"),
    height: num("height"),
    transportVelocity: num("transportVelocity"),
    supplyAir: num("supplyAir"),
  };
  if (mode === "design") updateDesign(shared);
  else updateAudit(shared);
}

document.querySelectorAll("[data-ndo-limit]").forEach((el) => (el.textContent = MAX_NDO_FRACTION * 100));
document.querySelectorAll("[data-face-limit]").forEach((el) => (el.textContent = MIN_FACE_VELOCITY_FPM));
document.querySelectorAll("[data-pressure-limit]").forEach((el) => (el.textContent = MIN_PRESSURE_DIFF_INWC));

for (let i = 0; i < 3; i++) addOpening();

$("addOpening").addEventListener("click", () => {
  addOpening();
  update();
});

$("openingRows").addEventListener("click", (e) => {
  if (!e.target.closest(".op-remove")) return;
  e.target.closest(".op-row").remove();
  if (!$("openingRows").children.length) addOpening();
  update();
});

form.addEventListener("input", update);
form.addEventListener("change", update);
update();

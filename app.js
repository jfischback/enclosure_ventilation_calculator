const form = document.getElementById("form");
const $ = (id) => document.getElementById(id);

// Number inputs: blank or invalid (negative, not a number) is treated as blank.
function num(id) {
  const raw = $(id).value.trim();
  if (raw === "") return "";
  const v = Number(raw);
  return Number.isFinite(v) && v >= 0 ? v : "";
}

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

function update() {
  const measuredNdo = num("measuredNdo");
  $("ndoPctField").classList.toggle("overridden", measuredNdo !== "");

  const r = calculate({
    length: num("length"),
    width: num("width"),
    height: num("height"),
    ndoPct: num("ndoPct"),
    measuredNdo,
    faceVelocity: num("faceVelocity"),
    transportVelocity: num("transportVelocity"),
    supplyAir: num("supplyAir"),
  });

  const desc = $("description").value.trim();
  $("resultDesc").textContent = desc || "Enclosure";

  $("surfaceArea").textContent = fmt(r.surfaceArea, 1);
  $("volume").textContent = fmt(r.volume, 1);
  $("ndoArea").textContent = fmt(r.ndoArea, 1);
  $("effectiveNdoPct").textContent = fmt(r.effectiveNdoPct, 1);
  $("qOut").textContent = fmt(r.qOut, 0);
  $("ach").textContent = fmt(r.ach, 1);
  $("ductCalc").textContent = typeof r.ductCalc === "number" ? r.ductCalc.toFixed(1) : "–";
  $("stockDuct").textContent = fmt(r.stockDuct, 0);
  $("velocityInStockDuct").textContent = fmt(r.velocityInStockDuct, 0);

  setPill($("ndoCheck"), r.ndoPass);
  setPill($("faceCheck"), r.facePass);
}

$("ndoLimit").textContent = MAX_NDO_FRACTION * 100;
$("faceLimit").textContent = MIN_FACE_VELOCITY_FPM;

form.addEventListener("input", update);
update();

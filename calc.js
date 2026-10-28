// EPA Method 204 permanent total enclosure criteria (40 CFR Part 51, Appendix M).
const MAX_NDO_FRACTION = 0.05; // NDO area must be <= 5% of enclosure surface area
const MIN_FACE_VELOCITY_FPM = 200; // face velocity through NDOs must be >= 200 fpm
const MIN_PRESSURE_DIFF_INWC = 0.007; // Method 204 treats this pressure drop as equivalent to 200 fpm

// NDO percentages shown in the design table.
const NDO_STEPS = [1, 2, 3, 4, 5];

// Inputs are numbers or "" (blank). Results are numbers, booleans, or "" when
// they can't be calculated, which the page shows as a dash.
const isNum = (v) => typeof v === "number";

function enclosure(length, width, height) {
  const dims = isNum(length) && isNum(width) && isNum(height);
  return {
    surfaceArea: dims ? 2 * (length * width + length * height + width * height) : "",
    volume: dims ? length * width * height : "",
  };
}

// Duct cross-section in ft² from a diameter in inches.
function ductArea(diameterIn) {
  return isNum(diameterIn) && diameterIn > 0 ? (Math.PI * (diameterIn / 12) ** 2) / 4 : "";
}

// Round up to the next whole inch through 10 in, then up to the next even inch.
function stockDuctSize(ductCalc) {
  if (!isNum(ductCalc)) return "";
  const d = Number(ductCalc.toFixed(6)); // so 24.0000000001 from float math stays 24
  return d <= 10 ? Math.ceil(d) : Math.ceil(d / 2) * 2;
}

// Duct sizing for an exhaust flow: calculated diameter, stock size, velocity in stock duct.
function ductSizing(qOut, transportVelocity) {
  const ductCalc = isNum(qOut) && transportVelocity ? 12 * Math.sqrt((4 * qOut) / (Math.PI * transportVelocity)) : "";
  const stockDuct = stockDuctSize(ductCalc);
  const velocityInStockDuct = isNum(qOut) && stockDuct ? qOut / ductArea(stockDuct) : "";
  return { ductCalc, stockDuct, velocityInStockDuct };
}

// Design mode: size the exhaust for an enclosure that hasn't been built yet.
function calculateDesign({ length, width, height, ndoPct, faceVelocity, transportVelocity, supplyAir }) {
  const { surfaceArea, volume } = enclosure(length, width, height);
  const supply = isNum(supplyAir) ? supplyAir : 0;

  const designFor = (pct) => {
    const ndoArea = isNum(surfaceArea) && isNum(pct) ? (surfaceArea * pct) / 100 : "";
    const qOut = isNum(ndoArea) && isNum(faceVelocity) ? ndoArea * faceVelocity + supply : "";
    const ach = isNum(qOut) && volume ? (qOut * 60) / volume : "";
    return { ndoPct: pct, ndoArea, qOut, ach, ...ductSizing(qOut, transportVelocity) };
  };

  const r = designFor(ndoPct);
  const effectiveNdoPct = isNum(r.ndoArea) && surfaceArea ? (r.ndoArea / surfaceArea) * 100 : "";
  const ndoPass = isNum(r.ndoArea) && isNum(surfaceArea) ? r.ndoArea <= surfaceArea * MAX_NDO_FRACTION : "";
  const facePass = isNum(faceVelocity) ? faceVelocity >= MIN_FACE_VELOCITY_FPM : "";

  return { surfaceArea, volume, ...r, effectiveNdoPct, ndoPass, facePass, steps: NDO_STEPS.map(designFor) };
}

// Audit mode: check an existing enclosure from its measured openings and flow.
// openings: [{ width, height }] in inches.
// flowSource: "cfm" (measured exhaust CFM), "duct" (duct velocity and diameter),
// or "face" (average face velocity measured at the openings).
function calculateAudit({ length, width, height, openings, flowSource, exhaustCfm, ductVelocity, faceVelocity, ductDiameter, transportVelocity, supplyAir, pressureDiff }) {
  const { surfaceArea, volume } = enclosure(length, width, height);
  const supply = isNum(supplyAir) ? supplyAir : 0;

  const measured = openings.filter((o) => isNum(o.width) && isNum(o.height));
  const ndoArea = measured.length ? measured.reduce((sum, o) => sum + (o.width * o.height) / 144, 0) : "";
  const ndoPct = isNum(ndoArea) && surfaceArea ? (ndoArea / surfaceArea) * 100 : "";

  const duct = ductArea(ductDiameter);
  let qOut = "";
  if (flowSource === "cfm") qOut = exhaustCfm;
  else if (flowSource === "duct") qOut = isNum(ductVelocity) && duct ? ductVelocity * duct : "";
  else if (flowSource === "face") qOut = isNum(faceVelocity) && isNum(ndoArea) ? faceVelocity * ndoArea + supply : "";

  // Air drawn in through the openings is exhaust minus supply.
  let actualFaceVelocity = "";
  if (flowSource === "face") actualFaceVelocity = faceVelocity;
  else if (isNum(qOut) && ndoArea) actualFaceVelocity = Math.max(0, qOut - supply) / ndoArea;

  let actualDuctVelocity = "";
  if (flowSource === "duct") actualDuctVelocity = ductVelocity;
  else if (isNum(qOut) && duct) actualDuctVelocity = qOut / duct;

  const ach = isNum(qOut) && volume ? (qOut * 60) / volume : "";

  const requiredQ = isNum(ndoArea) ? ndoArea * MIN_FACE_VELOCITY_FPM + supply : "";
  const flowGap = isNum(requiredQ) && isNum(qOut) ? requiredQ - qOut : ""; // > 0 means short
  const maxNdoAtFlow = isNum(qOut) ? Math.max(0, qOut - supply) / MIN_FACE_VELOCITY_FPM : "";

  const ndoPass = isNum(ndoArea) && isNum(surfaceArea) ? ndoArea <= surfaceArea * MAX_NDO_FRACTION : "";
  const facePass = isNum(actualFaceVelocity) ? actualFaceVelocity >= MIN_FACE_VELOCITY_FPM : "";
  const pressurePass = isNum(pressureDiff) ? pressureDiff >= MIN_PRESSURE_DIFF_INWC : "";
  const transportPass = isNum(actualDuctVelocity) && transportVelocity ? actualDuctVelocity >= transportVelocity : "";

  return {
    surfaceArea, volume, ndoArea, ndoPct, qOut, actualFaceVelocity, actualDuctVelocity, ach,
    requiredQ, flowGap, maxNdoAtFlow, ndoPass, facePass, pressurePass, transportPass,
  };
}

if (typeof module !== "undefined") {
  module.exports = { calculateDesign, calculateAudit, MAX_NDO_FRACTION, MIN_FACE_VELOCITY_FPM, MIN_PRESSURE_DIFF_INWC, NDO_STEPS };
}

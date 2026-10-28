// EPA Method 204 permanent total enclosure criteria (40 CFR Part 51, Appendix M).
const MAX_NDO_FRACTION = 0.05; // NDO area must be <= 5% of enclosure surface area
const MIN_FACE_VELOCITY_FPM = 200; // face velocity through NDOs must be >= 200 fpm

// Inputs are numbers or "" (blank). Results are numbers, booleans, or "" when
// they can't be calculated, which the page shows as a dash.
function calculate({ length, width, height, ndoPct, measuredNdo, faceVelocity, transportVelocity, supplyAir }) {
  const isNum = (v) => typeof v === "number";
  const dims = isNum(length) && isNum(width) && isNum(height);

  const surfaceArea = dims ? 2 * (length * width + length * height + width * height) : "";
  const volume = dims ? length * width * height : "";

  let ndoArea = "";
  if (isNum(measuredNdo)) ndoArea = measuredNdo;
  else if (isNum(surfaceArea) && isNum(ndoPct)) ndoArea = (surfaceArea * ndoPct) / 100;

  const effectiveNdoPct = isNum(ndoArea) && surfaceArea ? (ndoArea / surfaceArea) * 100 : "";

  const supply = isNum(supplyAir) ? supplyAir : 0;
  const qOut = isNum(ndoArea) && isNum(faceVelocity) ? ndoArea * faceVelocity + supply : "";

  const ach = isNum(qOut) && volume ? (qOut * 60) / volume : "";

  const ductCalc = isNum(qOut) && transportVelocity ? 12 * Math.sqrt((4 * qOut) / (Math.PI * transportVelocity)) : "";

  // Round up to the next whole inch through 10 in, then up to the next even inch.
  let stockDuct = "";
  if (isNum(ductCalc)) {
    const d = Number(ductCalc.toFixed(6)); // so 24.0000000001 from float math stays 24
    stockDuct = d <= 10 ? Math.ceil(d) : Math.ceil(d / 2) * 2;
  }

  const velocityInStockDuct = isNum(qOut) && stockDuct ? qOut / ((Math.PI * (stockDuct / 12) ** 2) / 4) : "";

  const ndoPass = isNum(ndoArea) && isNum(surfaceArea) ? ndoArea <= surfaceArea * MAX_NDO_FRACTION : "";
  const facePass = isNum(faceVelocity) ? faceVelocity >= MIN_FACE_VELOCITY_FPM : "";

  return { surfaceArea, volume, ndoArea, effectiveNdoPct, qOut, ach, ductCalc, stockDuct, velocityInStockDuct, ndoPass, facePass };
}

if (typeof module !== "undefined") module.exports = { calculate, MAX_NDO_FRACTION, MIN_FACE_VELOCITY_FPM };

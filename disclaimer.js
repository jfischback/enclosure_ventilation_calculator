// Disclaimer gate: the first visit in a browser must agree before using the tool.
(function () {
  var KEY = "oems_disclaimer_v1";
  var root = document.documentElement;
  var gate = document.getElementById("oemsGate");
  if (!gate) return;
  if (root.classList.contains("oems-agreed")) { gate.remove(); return; }

  var check = document.getElementById("oemsGateCheck");
  var btn = document.getElementById("oemsGateBtn");
  check.checked = false;
  btn.disabled = true;
  check.addEventListener("change", function () { btn.disabled = !check.checked; });

  btn.addEventListener("click", function () {
    if (!check.checked) return;
    try { localStorage.setItem(KEY, new Date().toISOString()); } catch (e) {}
    root.classList.add("oems-agreed");
    gate.remove();
    window.scrollTo(0, 0);
  });

  gate.querySelector("[role=dialog]").focus({ preventScroll: true });
})();

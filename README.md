# OEMS Enclosure Ventilation Calculator

A web calculator with two modes: Design sizes the exhaust airflow and duct for a new enclosure, and Audit checks an existing enclosure from measured openings, flow and pressure difference. Both check against EPA Method 204 permanent total enclosure criteria (NDO area ≤ 5% of surface area, face velocity ≥ 200 fpm). Lives at ventilationcalculator.oemsgroup.com.

Plain HTML, CSS, and JavaScript with no build step. To deploy on Vercel, import the repo and leave the framework preset as "Other".

- `index.html`: the page
- `calc.js`: the calculation logic for both modes (design and audit) and the Method 204 thresholds
- `app.js`: connects the form to the calculation
- `style.css`: the styles, shared with the OEMS Noise Reduction Calculator

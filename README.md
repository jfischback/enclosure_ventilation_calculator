# OEMS Enclosure Ventilation Calculator

A web calculator for the required exhaust airflow and duct size of a ventilated enclosure, with a check against EPA Method 204 permanent total enclosure criteria (NDO area ≤ 5% of surface area, face velocity ≥ 200 fpm). Lives at ventilationcalculator.oemsgroup.com.

Plain HTML, CSS, and JavaScript with no build step. To deploy on Vercel, import the repo and leave the framework preset as "Other".

- `index.html`: the page
- `calc.js`: the calculation logic and the Method 204 thresholds
- `app.js`: connects the form to the calculation
- `style.css`: the styles, shared with the OEMS Noise Reduction Calculator

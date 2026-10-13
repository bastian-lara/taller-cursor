// Colores base de encuestas; si hay más encuestas se generan extras en HSL
const BASE_COLORS = [
  "#FFC000",
  "#F4B183",
  "#ED7D31",
  "#A47EBD",
  "#9DC3E6",
  "#4ECDC4",
  "#FF6B9D",
  "#36A2EB",
];

function hexToHsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = function (n) {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * c).toString(16).padStart(2, "0");
  };
  return "#" + f(0) + f(8) + f(4);
}

/** Devuelve exactamente count colores; reutiliza BASE_COLORS y genera extras. */
function getSurveyColors(count) {
  if (count <= BASE_COLORS.length) {
    return BASE_COLORS.slice(0, count);
  }
  const colors = BASE_COLORS.slice();
  const GOLDEN = 137.508;
  while (colors.length < count) {
    const base = hexToHsl(BASE_COLORS[colors.length % BASE_COLORS.length]);
    const step = Math.floor(colors.length / BASE_COLORS.length);
    const h = (base.h + GOLDEN * (colors.length + 1)) % 360;
    const l = Math.min(75, Math.max(35, base.l + ((step % 3) - 1) * 12));
    const s = Math.min(85, Math.max(40, base.s - step * 3));
    colors.push(hslToHex(h, s, l));
  }
  return colors;
}

const MONTH_KEYS = [
  "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
  "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE",
];

const MONTH_LABELS = [
  "ENE", "FEB", "MAR", "ABR", "MAY", "JUN",
  "JUL", "AGO", "SEP", "OCT", "NOV", "DIC",
];


document.addEventListener("DOMContentLoaded", function () {
  const panels = document.querySelectorAll(".stats-container");
  const switchBtns = document.querySelectorAll(".switch-btn");

  panels.forEach(function (p) {
    p.hidden = p.id !== "total-panel";
  });

  switchBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      const panelId = btn.dataset.panel;

      switchBtns.forEach(function (b) {
        b.classList.remove("active");
      });
      btn.classList.add("active");

      panels.forEach(function (p) {
        p.hidden = p.id !== panelId;
      });

      // Diferir resize: si corre antes del layout, Plotly puede colapsar a 0x0
      requestAnimationFrame(function () {
        if (panelId === "completed-panel") {
          ["chart-bars-monthly", "chart-bars-survey-pct"].forEach(function (id) {
            const el = document.getElementById(id);
            if (el) Plotly.Plots.resize(el);
          });
        }
        if (panelId === "total-panel") {
          const donut = document.getElementById("chart-donut");
          if (donut) {
            Plotly.relayout(donut, { height: 340, autosize: true }).then(function () {
              Plotly.Plots.resize(donut);
            });
          }
        }
      });
    });
  });

  const raw = document.getElementById("surveys-data");
  if (!raw) return;

  const surveys = JSON.parse(raw.textContent);
  if (!surveys.length) return;

  const yearEl = document.getElementById("selected-year");
  const selectedYear = yearEl ? Number(JSON.parse(yearEl.textContent)) : new Date().getFullYear();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12
  let monthsToShow = 12;
  if (selectedYear === currentYear) {
    monthsToShow = currentMonth;
  } else if (selectedYear > currentYear) {
    monthsToShow = 0;
  }
  const visibleMonthKeys = MONTH_KEYS.slice(0, monthsToShow);
  const visibleMonthLabels = MONTH_LABELS.slice(0, monthsToShow);

  const colors = getSurveyColors(surveys.length);

  const config = {
    responsive: true,
    displayModeBar: false,
  };

  // ---- Grafico de donut (panel Totales) ----
  const labels = surveys.map(function (s) { return s.survey_name; });
  const values = surveys.map(function (s) { return Number(s.total_generated) || 0; });

  Plotly.newPlot("chart-donut", [{
    type: "pie",
    labels: labels,
    values: values,
    hole: 0.4,
    textinfo: "percent",
    textposition: "inside",
    insidetextorientation: "horizontal",
    textfont: { color: "#ffffff", size: 12 },
    domain: { x: [0, 1], y: [0, 1] },
    marker: {
      colors: colors,
      line: { color: "#ffffff", width: 2 },
    },
  }], {
    height: 340,
    autosize: true,
    margin: { t: 16, b: 16, l: 16, r: 16 },
    paper_bgcolor: "rgba(0,0,0,0)",
    showlegend: false,
  }, config).then(function () {
    Plotly.Plots.resize(document.getElementById("chart-donut"));
  });

  document.querySelectorAll(".survey-card").forEach(function (card, i) {
    card.style.backgroundColor = colors[i];
  });

  // ---- Totales mensuales desde surveys (solo hasta el mes actual si es el año en curso) ----
  const monthlyTotals = visibleMonthKeys.map(function (month) {
    return surveys.reduce(function (sum, s) {
      const monthData = (s.MESES && s.MESES[month]) || {};
      return sum + (Number(monthData.generated) || 0);
    }, 0);
  });

  const monthlyAnswered = visibleMonthKeys.map(function (month) {
    return surveys.reduce(function (sum, s) {
      const monthData = (s.MESES && s.MESES[month]) || {};
      return sum + (Number(monthData.answered) || 0);
    }, 0);
  });

  const monthlyAvg = monthsToShow
    ? Math.round(monthlyTotals.reduce(function (a, b) { return a + b; }, 0) / monthsToShow)
    : 0;
  const monthlyMax = monthlyAnswered.length
    ? Math.max.apply(null, monthlyAnswered)
    : 0;
  const monthlyMaxIndex = monthlyAnswered.indexOf(monthlyMax);
  const monthlyMaxMonthName = monthlyMaxIndex >= 0 ? visibleMonthKeys[monthlyMaxIndex] : "—";

  const totalAssigned = surveys.reduce(function (sum, s) {
    return sum + (Number(s.total_generated) || 0);
  }, 0);
  const totalCompleted = surveys.reduce(function (sum, s) {
    return sum + (Number(s.total_answered) || 0);
  }, 0);
  const completedPct = totalAssigned
    ? Math.round((totalCompleted / totalAssigned) * 100)
    : 0;

  const avgEl = document.getElementById("monthly-avg");
  const maxEl = document.getElementById("monthly-max");
  const maxMonthEl = document.getElementById("monthly-max-month");
  const pctEl = document.getElementById("completed-percentage");
  if (avgEl) avgEl.textContent = monthlyAvg;
  if (maxEl) maxEl.textContent = monthlyMax;
  if (maxMonthEl) maxMonthEl.textContent = monthlyMaxMonthName;
  if (pctEl) pctEl.textContent = completedPct + "%";

  // ---- Grafico de barras por mes: fondo = asignadas, encima = completadas ----
  const barsEl = document.getElementById("chart-bars-monthly");
  if (barsEl) {
    Plotly.newPlot("chart-bars-monthly", [
      {
        type: "bar",
        name: "Asignadas",
        x: visibleMonthLabels,
        y: monthlyTotals,
        marker: { color: "#d4c4e8" },  /*#FFEE8C amarillo claro*/
        text: monthlyTotals.map(function (v) { return v ? v : ""; }),
        textposition: "outside",
        hovertemplate: "%{x}<br>Asignadas: %{y}<extra></extra>",
      },
      {
        type: "bar",
        name: "Completadas",
        x: visibleMonthLabels,
        y: monthlyAnswered,
        marker: { color: "#FF6384" }, /*#80EF80 verde claro*/
        text: monthlyAnswered.map(function (v, i) {
          // Solo etiqueta interna si hay completadas y no llenan toda la barra
          if (!v) return "";
          if (v >= monthlyTotals[i]) return "";
          return v;
        }),
        textposition: "inside",
        insidetextanchor: "middle",
        insidetextorientation: "horizontal",
        textfont: { color: "#ffffff", size: 9 },
        hovertemplate: "%{x}<br>Completadas: %{y}<extra></extra>",
      },
    ], {
      barmode: "overlay",
      bargap: 0.3,
      height: 260,
      autosize: true,
      margin: { t: 40, b: 60, l: 40, r: 20 },
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      xaxis: { title: "Mes" },
      yaxis: { title: "Cantidad", rangemode: "tozero" },
      legend: { orientation: "h", y: 1.12, x: 0.5, xanchor: "center" },
      showlegend: true,
    }, config);
  }

  // ---- Grafico % completadas por encuesta (mayor % arriba) ----
  const surveyPctRows = surveys.map(function (s, i) {
    let pct;
    if (s.answered_percentage != null) {
      pct = Number(s.answered_percentage) || 0;
    } else {
      const gen = Number(s.total_generated) || 0;
      const ans = Number(s.total_answered) || 0;
      pct = gen ? Math.round((ans / gen) * 100) : 0;
    }
    return {
      name: s.survey_name,
      pct: pct,
      color: colors[i],
    };
  }).sort(function (a, b) {
    return b.pct - a.pct;
  });

  const surveyPctValues = surveyPctRows.map(function (r) { return r.pct; });
  const surveyPctAvg = surveyPctValues.length
    ? Math.round(surveyPctValues.reduce(function (a, b) { return a + b; }, 0) / surveyPctValues.length)
    : 0;
  const surveyPctMax = surveyPctValues.length
    ? Math.max.apply(null, surveyPctValues)
    : 0;
  const surveyPctMaxRow = surveyPctRows.find(function (r) { return r.pct === surveyPctMax; });

  const surveyAvgEl = document.getElementById("survey-pct-avg");
  const surveyMaxEl = document.getElementById("survey-pct-max");
  const surveyMaxNameEl = document.getElementById("survey-pct-max-name");
  if (surveyAvgEl) surveyAvgEl.textContent = surveyPctAvg + "%";
  if (surveyMaxEl) surveyMaxEl.textContent = surveyPctMax + "%";
  if (surveyMaxNameEl) {
    surveyMaxNameEl.textContent = surveyPctMaxRow ? surveyPctMaxRow.name : "—";
  }

  const surveyPctEl = document.getElementById("chart-bars-survey-pct");
  if (surveyPctEl) {
    Plotly.newPlot("chart-bars-survey-pct", [{
      type: "bar",
      orientation: "h",
      y: surveyPctRows.map(function (r) { return r.name; }),
      x: surveyPctRows.map(function (r) { return r.pct; }),
      marker: {
        color: "#667eea",
      },
      text: surveyPctRows.map(function (r) { return r.pct ? r.pct + "%" : ""; }),
      textposition: "outside",
    }], {
      height: Math.max(320, surveyPctRows.length * 48),
      autosize: true,
      margin: { t: 20, b: 40, l: 140, r: 40 },
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      xaxis: { title: "% Completadas", range: [0, 100], rangemode: "tozero" },
      yaxis: { automargin: true, autorange: "reversed" },
      showlegend: false,
    }, config);
  }
});

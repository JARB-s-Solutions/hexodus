// Inicializa los iconos de Lucide
lucide.createIcons();

// ========== USUARIO / NAV ==========
const userNameDisplay = document.getElementById("userNameDisplay");
if (userNameDisplay) userNameDisplay.textContent = "Admin";

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => { window.location.href = "/login"; });
}

const menuToggle = document.getElementById("menu-toggle");
if (menuToggle) {
  menuToggle.addEventListener("click", () => {
    document.querySelector(".sidebar")?.classList.toggle("-translate-x-full");
    document.getElementById("backdrop")?.classList.toggle("hidden");
  });
}

const backdrop = document.getElementById("backdrop");
if (backdrop) {
  backdrop.addEventListener("click", () => {
    document.querySelector(".sidebar")?.classList.add("-translate-x-full");
    document.getElementById("backdrop")?.classList.add("hidden");
  });
}

// ========== FECHA / HORA ==========
const actualizarFechaHora = () => {
  const now = new Date();
  const fecha = now.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
  const hora = now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: true });
  const el = document.getElementById("fecha-hora");
  if (el) el.textContent = `${fecha} | ${hora}`;
};
setInterval(actualizarFechaHora, 60000);
actualizarFechaHora();

// ========== COLORES ==========
const C = {
  rojo: "rgba(255, 59, 59, 1)",
  rojoSoft: "rgba(255, 59, 59, 0.15)",
  azul: "rgba(0, 191, 255, 1)",
  azulSoft: "rgba(0, 191, 255, 0.15)",
  verde: "rgba(34, 197, 94, 1)",
  verdeSoft: "rgba(34, 197, 94, 0.15)",
  gris: "rgba(120, 120, 130, 0.6)",
  blanco: "rgba(232, 232, 232, 1)",
  grid: "rgba(255, 255, 255, 0.04)",
};

// ========== UTILIDADES ==========
const formatoMoneda = (v) => "$" + v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const calcPct = (actual, anterior) => anterior === 0 ? 0 : ((actual - anterior) / anterior * 100).toFixed(1);

const crearBadge = (pct, ctx) => {
  const n = parseFloat(pct);
  let cls, icon, sign;
  if (n === 0) { cls = "bg-yellow-500/15 text-yellow-400"; icon = "minus"; sign = ""; }
  else if (n > 0) { cls = "bg-green-500/15 text-green-400"; icon = "arrow-up-right"; sign = "+"; }
  else { cls = "bg-red-500/15 text-red-400"; icon = "arrow-down-right"; sign = ""; }
  return `<span class="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cls}">
    <i data-lucide="${icon}" class="w-3 h-3"></i>${sign}${pct}%
  </span><span class="text-xs" style="color:var(--color-texto-gris);">${ctx}</span>`;
};

// ========== DATOS FINANCIEROS ==========
const datosFinancieros = {
  hoy:    { ventas: 1540, gastos: 720, ventasAnt: 1420, gastosAnt: 680 },
  semana: { ventas: 14200, gastos: 6350, ventasAnt: 12640, gastosAnt: 6160 },
  mes:    { ventas: 58400, gastos: 24800, ventasAnt: 52100, gastosAnt: 23500 },
};

const actualizarFinanzas = (periodo) => {
  const d = datosFinancieros[periodo];
  if (!d) return;
  const util = d.ventas - d.gastos;
  const utilAnt = d.ventasAnt - d.gastosAnt;

  const pV = calcPct(d.ventas, d.ventasAnt);
  const pG = calcPct(d.gastos, d.gastosAnt);
  const pU = calcPct(util, utilAnt);

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  const setHTML = (id, val) => { const el = document.getElementById(id); if (el) el.innerHTML = val; };

  set("kpiVentas", formatoMoneda(d.ventas));
  set("kpiGastos", formatoMoneda(d.gastos));
  set("kpiUtilidad", formatoMoneda(util));
  set("kpiSaldoNeto", formatoMoneda(util));

  const ctx = "vs anterior";
  setHTML("kpiVentasTrend", crearBadge(pV, ctx));
  setHTML("kpiGastosTrend", crearBadge(pG, ctx));
  setHTML("kpiUtilidadTrend", crearBadge(pU, ctx));
  setHTML("kpiSaldoNetoTrend", crearBadge(pU, ctx));

  // Color de utilidad
  const elU = document.getElementById("kpiUtilidad");
  if (elU) elU.style.color = util >= 0 ? "#22c55e" : "#ef4444";

  // Indicador de tendencia
  const ind = document.getElementById("indicadorTendencia");
  if (ind) {
    const n = parseFloat(pU);
    let icon, txt, sub, colorCls, bgCls, iconCls;
    if (n > 1) {
      icon = "trending-up"; txt = "El negocio mejoro"; sub = `La utilidad subio un ${Math.abs(n)}% comparado con el periodo anterior.`;
      colorCls = "text-green-400"; bgCls = "tendencia-mejoro"; iconCls = "tendencia-icon--green";
    } else if (n < -1) {
      icon = "trending-down"; txt = "El negocio empeoro"; sub = `La utilidad bajo un ${Math.abs(n)}% comparado con el periodo anterior.`;
      colorCls = "text-red-400"; bgCls = "tendencia-empeoro"; iconCls = "tendencia-icon--red";
    } else {
      icon = "minus"; txt = "El negocio se mantuvo igual"; sub = "La utilidad se mantuvo estable comparado con el periodo anterior.";
      colorCls = "text-yellow-400"; bgCls = "tendencia-igual"; iconCls = "tendencia-icon--yellow";
    }

    // Keep the select reference
    const selectHTML = ind.querySelector(".periodo-select")?.outerHTML || "";
    ind.className = `lg:col-span-5 tendencia-card ${bgCls}`;
    ind.innerHTML = `
      <div class="tendencia-icon ${iconCls}"><i data-lucide="${icon}" class="w-5 h-5"></i></div>
      <div class="flex-1">
        <p class="text-sm font-semibold ${colorCls}">${txt}</p>
        <p class="text-xs" style="color:var(--color-texto-gris);">${sub}</p>
      </div>
      ${selectHTML}
    `;

    // Re-bind select
    const newSelect = ind.querySelector(".periodo-select");
    if (newSelect) {
      newSelect.value = periodo;
      newSelect.addEventListener("change", (e) => actualizarFinanzas(e.target.value));
    }
    lucide.createIcons();
  }
};

// ========== ASISTENCIA ==========
const asistencia = { hoy: 73, ayer: 68 };

const actualizarAsistencia = () => {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set("kpiAsistenciaHoy", asistencia.hoy);
  set("kpiAsistenciaAyer", asistencia.ayer);
  const el = document.getElementById("kpiAsistenciaTrend");
  if (el) {
    el.innerHTML = crearBadge(calcPct(asistencia.hoy, asistencia.ayer), "vs ayer");
    lucide.createIcons();
  }
};

// ========== CHART.JS DEFAULTS ==========
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.font.size = 11;
Chart.defaults.color = C.blanco;

const gridOpts = {
  color: C.grid,
  drawBorder: false,
};

const tickOpts = {
  color: "rgba(120,120,130,0.8)",
  font: { size: 10 },
};

// ========== GRAFICO VENTAS ==========
const ctxV = document.getElementById("graficoVentas")?.getContext("2d");
if (ctxV) {
  new Chart(ctxV, {
    type: "bar",
    data: {
      labels: ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"],
      datasets: [
        { label: "Actual", data: [1200, 1900, 3000, 500, 2000, 3000, 2500], backgroundColor: C.rojo, borderRadius: 6, borderSkipped: false, barPercentage: 0.6 },
        { label: "Anterior", data: [900, 1500, 2500, 1000, 1800, 2800, 2000], backgroundColor: C.gris, borderRadius: 6, borderSkipped: false, barPercentage: 0.6 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { usePointStyle: true, pointStyle: "circle", padding: 16, font: { size: 11 } } } },
      scales: { y: { beginAtZero: true, grid: gridOpts, ticks: tickOpts }, x: { grid: { display: false }, ticks: tickOpts } },
    },
  });
}

// ========== GRAFICO HORAS PICO ==========
const ctxHP = document.getElementById("graficoHorasPico")?.getContext("2d");
if (ctxHP) {
  const horasData = [8, 5, 12, 15, 10, 18, 28, 32, 25, 20, 14, 6];
  const horasLabels = ["07", "08", "09", "10", "11", "12", "13", "14", "16", "17", "18", "19"];
  const maxVal = Math.max(...horasData);
  const bgColors = horasData.map((v) => v === maxVal ? C.rojo : C.azulSoft);

  new Chart(ctxHP, {
    type: "bar",
    data: {
      labels: horasLabels,
      datasets: [{ data: horasData, backgroundColor: bgColors, borderRadius: 4, borderSkipped: false, barPercentage: 0.7 }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => c.raw + " personas" } } },
      scales: { y: { beginAtZero: true, grid: gridOpts, ticks: { ...tickOpts, display: false } }, x: { grid: { display: false }, ticks: { ...tickOpts, font: { size: 9 } } } },
    },
  });
}

// ========== GRAFICO INGRESOS DIARIOS (LINEA) ==========
const ctxI = document.getElementById("graficoIngresos")?.getContext("2d");
if (ctxI) {
  const gradient = ctxI.createLinearGradient(0, 0, 0, 200);
  gradient.addColorStop(0, "rgba(0, 191, 255, 0.2)");
  gradient.addColorStop(1, "rgba(0, 191, 255, 0)");

  new Chart(ctxI, {
    type: "line",
    data: {
      labels: ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"],
      datasets: [{
        label: "Ingresos",
        data: [1540, 2100, 1800, 2400, 1950, 2800, 2200],
        borderColor: C.azul,
        backgroundColor: gradient,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: C.azul,
        pointBorderColor: "transparent",
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => "$" + c.raw.toLocaleString() } } },
      scales: { y: { beginAtZero: true, grid: gridOpts, ticks: tickOpts }, x: { grid: { display: false }, ticks: tickOpts } },
    },
  });
}

// ========== GRAFICO GENERO (DONUT MINI) ==========
const ctxG = document.getElementById("graficoGenero")?.getContext("2d");
if (ctxG) {
  new Chart(ctxG, {
    type: "doughnut",
    data: {
      labels: ["Hombres", "Mujeres"],
      datasets: [{ data: [45, 28], backgroundColor: [C.azul, C.rojo], borderWidth: 0, cutout: "70%" }],
    },
    options: {
      responsive: true, maintainAspectRatio: true,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => c.label + ": " + c.raw } } },
    },
  });
}

// ========== INIT ==========
const periodoSelect = document.getElementById("periodoSelector");
if (periodoSelect) {
  periodoSelect.addEventListener("change", (e) => actualizarFinanzas(e.target.value));
}
actualizarFinanzas("semana");
actualizarAsistencia();

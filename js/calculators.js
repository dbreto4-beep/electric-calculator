/* =========================================================
   ElectricCalc - Cálculos eléctricos
   Referencias: IEC 60364-5-52 (intensidades admisibles),
   REBT ITC-BT-19 (caída de tensión máxima 3 % / 5 %).
   ========================================================= */

// Conductividad a 20 °C en m/(Ω·mm²)
const CONDUCTIVITY = { Cu: 56, Al: 35 };

// Secciones normalizadas (mm²)
const STANDARD_SECTIONS = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120];

// Intensidades admisibles (A) para conductores de COBRE, IEC 60364-5-52
// Tablas B.52.2 a B.52.5. Temperatura de referencia 30 °C en aire, 20 °C en suelo (método D).
// Orden de columnas: métodos A1, A2, B1, B2, C, D
const INSTALL_METHODS = ['A1', 'A2', 'B1', 'B2', 'C', 'D'];

const AMPACITY_CU = {
  PVC: {
    2: {
      1.5: [14.5, 14, 17.5, 16.5, 19.5, 22], 2.5: [19.5, 18.5, 24, 23, 27, 29],
      4: [26, 25, 32, 30, 36, 38], 6: [34, 32, 41, 38, 46, 47],
      10: [46, 43, 57, 52, 63, 63], 16: [61, 57, 76, 69, 85, 81],
      25: [80, 75, 101, 90, 112, 104], 35: [99, 92, 125, 111, 138, 125],
      50: [119, 110, 151, 133, 168, 148], 70: [151, 139, 192, 168, 213, 183],
      95: [182, 167, 232, 201, 258, 216], 120: [210, 192, 269, 232, 299, 246]
    },
    3: {
      1.5: [13.5, 13, 15.5, 15, 17.5, 18], 2.5: [18, 17.5, 21, 20, 24, 24],
      4: [24, 23, 28, 27, 32, 31], 6: [31, 29, 36, 34, 41, 39],
      10: [42, 39, 50, 46, 57, 52], 16: [56, 52, 68, 62, 76, 67],
      25: [73, 68, 89, 80, 96, 86], 35: [89, 83, 110, 99, 119, 103],
      50: [108, 99, 134, 118, 144, 122], 70: [136, 125, 171, 149, 184, 151],
      95: [164, 150, 207, 179, 223, 179], 120: [188, 172, 239, 206, 259, 203]
    }
  },
  XLPE: {
    2: {
      1.5: [19, 18.5, 23, 22, 24, 25], 2.5: [26, 25, 31, 30, 33, 33],
      4: [35, 33, 42, 40, 45, 43], 6: [45, 42, 54, 51, 58, 53],
      10: [61, 57, 75, 69, 80, 71], 16: [81, 76, 100, 91, 107, 91],
      25: [106, 99, 133, 119, 138, 116], 35: [131, 121, 164, 146, 171, 139],
      50: [158, 145, 198, 175, 209, 164], 70: [200, 183, 253, 221, 269, 203],
      95: [241, 220, 306, 265, 328, 239], 120: [278, 253, 354, 305, 382, 271]
    },
    3: {
      1.5: [17, 16.5, 20, 19.5, 22, 21], 2.5: [23, 22, 28, 26, 30, 28],
      4: [31, 30, 37, 35, 40, 36], 6: [40, 38, 48, 44, 52, 44],
      10: [54, 51, 66, 60, 71, 58], 16: [73, 68, 88, 80, 96, 75],
      25: [95, 89, 117, 105, 119, 96], 35: [117, 109, 144, 128, 147, 115],
      50: [141, 130, 175, 154, 179, 135], 70: [179, 164, 222, 194, 229, 167],
      95: [216, 197, 269, 233, 278, 197], 120: [249, 227, 312, 268, 322, 223]
    }
  }
};

// Aproximación para aluminio respecto al cobre (solo orientativa)
const AL_FACTOR = 0.78;

// Factores de corrección por temperatura, IEC 60364-5-52 B.52.14 (aire) y B.52.15 (suelo)
const TEMP_FACTORS = {
  air: {
    PVC:  { 10: 1.22, 15: 1.17, 20: 1.12, 25: 1.06, 30: 1.00, 35: 0.94, 40: 0.87, 45: 0.79, 50: 0.71, 55: 0.61, 60: 0.50 },
    XLPE: { 10: 1.15, 15: 1.12, 20: 1.08, 25: 1.04, 30: 1.00, 35: 0.96, 40: 0.91, 45: 0.87, 50: 0.82, 55: 0.76, 60: 0.71 }
  },
  ground: {
    PVC:  { 10: 1.10, 15: 1.05, 20: 1.00, 25: 0.95, 30: 0.89, 35: 0.84, 40: 0.77, 45: 0.71, 50: 0.63, 55: 0.55, 60: 0.45 },
    XLPE: { 10: 1.07, 15: 1.04, 20: 1.00, 25: 0.96, 30: 0.93, 35: 0.89, 40: 0.85, 45: 0.80, 50: 0.76, 55: 0.71, 60: 0.65 }
  }
};

// Factores de agrupamiento, IEC 60364-5-52 B.52.17 (cables agrupados en aire o sobre superficie)
const GROUPING_FACTORS = { 1: 1.00, 2: 0.80, 3: 0.70, 4: 0.65, 5: 0.60, 6: 0.57, 7: 0.54, 8: 0.52, 9: 0.50 };

/* ---------- Funciones de cálculo puras ---------- */

function isThreePhase(voltage) {
  return voltage === 400;
}

// Intensidad de línea (A)
function lineCurrent(power, voltage, cosPhi) {
  return isThreePhase(voltage)
    ? power / (Math.sqrt(3) * voltage * cosPhi)
    : power / (voltage * cosPhi);
}

// Caída de tensión (V). Monofásico: 2·L·P/(γ·S·V). Trifásico: L·P/(γ·S·V)
function voltageDropVolts(power, voltage, distance, section, material) {
  const gamma = CONDUCTIVITY[material];
  const k = isThreePhase(voltage) ? 1 : 2;
  return (k * distance * power) / (gamma * section * voltage);
}

// Sección mínima (mm²) para no superar una caída máxima en %
function minSectionForDrop(power, voltage, distance, maxDropPercent, material) {
  const gamma = CONDUCTIVITY[material];
  const k = isThreePhase(voltage) ? 1 : 2;
  const maxDropV = voltage * maxDropPercent / 100;
  return (k * distance * power) / (gamma * maxDropV * voltage);
}

function nextStandardSection(section) {
  return STANDARD_SECTIONS.find(s => s >= section - 1e-9) || null;
}

function temperatureFactor(insulation, method, temp) {
  const medium = method === 'D' ? 'ground' : 'air';
  return TEMP_FACTORS[medium][insulation][temp];
}

// Intensidad admisible (A) sin factores de corrección
function baseAmpacity(section, insulation, loaded, method, material) {
  const row = AMPACITY_CU[insulation][loaded][section];
  if (!row) return null;
  const iz = row[INSTALL_METHODS.indexOf(method)];
  return material === 'Al' ? iz * AL_FACTOR : iz;
}

function statusFor(percentageDrop) {
  if (percentageDrop <= 3) {
    return { cls: 'alert alert-success', text: '✓ CORRECTO - Cumple IEC 60364 (≤ 3 %)' };
  }
  if (percentageDrop <= 5) {
    return { cls: 'alert alert-warning', text: '⚠ ALERTA - Válido solo para usos distintos de alumbrado (≤ 5 %)' };
  }
  return { cls: 'alert alert-danger', text: '✗ CRÍTICO - Usa sección mayor de cable (> 5 %)' };
}

function fmt(n, decimals) {
  return n.toLocaleString('es-ES', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function readNumber(id) {
  return parseFloat(document.getElementById(id).value);
}

function showResults() {
  document.getElementById('resultsContainer').style.display = 'block';
  document.getElementById('waitingContainer').style.display = 'none';
}

function hideResults() {
  document.getElementById('resultsContainer').style.display = 'none';
  document.getElementById('waitingContainer').style.display = 'block';
}

/* ---------- Calculadora: caída de tensión ---------- */

function calculateVoltageDrop() {
  const power = readNumber('power');
  const voltage = readNumber('voltage');
  const cosPhi = readNumber('cosPhi');
  const distance = readNumber('distance');
  const wireSection = readNumber('wireSection');
  const material = document.getElementById('material').value;

  if (!(power > 0) || !(distance > 0) || !(wireSection > 0) || !(cosPhi > 0 && cosPhi <= 1)) {
    alert('Completa todos los campos con valores válidos');
    return;
  }

  const intensity = lineCurrent(power, voltage, cosPhi);
  const resistance = distance / (CONDUCTIVITY[material] * wireSection); // un conductor
  const voltageDrop = voltageDropVolts(power, voltage, distance, wireSection, material);
  const percentageDrop = (voltageDrop / voltage) * 100;

  document.getElementById('voltageDropValue').textContent = fmt(voltageDrop, 2) + ' V';
  document.getElementById('percentDropValue').textContent = fmt(percentageDrop, 2) + ' %';
  document.getElementById('intensityValue').textContent = fmt(intensity, 2) + ' A';
  document.getElementById('resistanceValue').textContent = fmt(resistance, 4) + ' Ω';

  const status = statusFor(percentageDrop);
  const statusAlert = document.getElementById('statusAlert');
  statusAlert.className = status.cls;
  statusAlert.textContent = status.text;

  showResults();

  if (typeof renderVoltageDropChart === 'function') {
    renderVoltageDropChart(power, voltage, distance, material, wireSection);
  }

  trackEvent('calculate', { calculator: 'voltage_drop' });
}

/* ---------- Calculadora: sección de cable ---------- */

function calculateWireGauge() {
  const power = readNumber('power');
  const voltage = readNumber('voltage');
  const cosPhi = readNumber('cosPhi');
  const distance = readNumber('distance');
  const maxDrop = readNumber('maxDrop');
  const material = document.getElementById('material').value;
  const insulation = document.getElementById('insulation').value;
  const method = document.getElementById('method').value;

  if (!(power > 0) || !(distance > 0) || !(cosPhi > 0 && cosPhi <= 1)) {
    alert('Completa todos los campos con valores válidos');
    return;
  }

  const intensity = lineCurrent(power, voltage, cosPhi);
  const loaded = isThreePhase(voltage) ? 3 : 2;

  // Criterio 1: caída de tensión
  const sMinDrop = minSectionForDrop(power, voltage, distance, maxDrop, material);
  const sByDrop = nextStandardSection(sMinDrop);

  // Criterio 2: intensidad admisible (30 °C, sin agrupamiento)
  const sByAmpacity = STANDARD_SECTIONS.find(
    s => baseAmpacity(s, insulation, loaded, method, material) >= intensity
  ) || null;

  const statusAlert = document.getElementById('statusAlert');

  if (!sByDrop || !sByAmpacity) {
    statusAlert.className = 'alert alert-danger';
    statusAlert.textContent = '✗ Se necesita una sección mayor de 120 mm². Divide el circuito o usa conductores en paralelo.';
    document.getElementById('recommendedValue').textContent = '> 120 mm²';
    document.getElementById('intensityValue').textContent = fmt(intensity, 2) + ' A';
    document.getElementById('sDropValue').textContent = sByDrop ? sByDrop + ' mm²' : '> 120 mm²';
    document.getElementById('sAmpValue').textContent = sByAmpacity ? sByAmpacity + ' mm²' : '> 120 mm²';
    document.getElementById('sMinValue').textContent = fmt(sMinDrop, 2) + ' mm²';
    document.getElementById('realDropValue').textContent = '-';
    document.getElementById('izValue').textContent = '-';
    showResults();
    return;
  }

  const recommended = Math.max(sByDrop, sByAmpacity);
  const realDrop = voltageDropVolts(power, voltage, distance, recommended, material) / voltage * 100;
  const iz = baseAmpacity(recommended, insulation, loaded, method, material);

  document.getElementById('recommendedValue').textContent = recommended + ' mm²';
  document.getElementById('intensityValue').textContent = fmt(intensity, 2) + ' A';
  document.getElementById('sMinValue').textContent = fmt(sMinDrop, 2) + ' mm²';
  document.getElementById('sDropValue').textContent = sByDrop + ' mm²';
  document.getElementById('sAmpValue').textContent = sByAmpacity + ' mm²';
  document.getElementById('realDropValue').textContent = fmt(realDrop, 2) + ' %';
  document.getElementById('izValue').textContent = fmt(iz, 1) + ' A';

  const governing = sByDrop >= sByAmpacity ? 'la caída de tensión' : 'la intensidad admisible';
  statusAlert.className = 'alert alert-success';
  statusAlert.textContent = '✓ Sección recomendada: ' + recommended + ' mm² ' +
    (material === 'Cu' ? 'Cu' : 'Al') + ' (criterio determinante: ' + governing + ')';

  document.getElementById('alNote').style.display = material === 'Al' ? 'block' : 'none';

  showResults();
  trackEvent('calculate', { calculator: 'wire_gauge' });
}

/* ---------- Calculadora: intensidad admisible ---------- */

function calculateAmpacity() {
  const section = readNumber('wireSection');
  const insulation = document.getElementById('insulation').value;
  const method = document.getElementById('method').value;
  const loaded = parseInt(document.getElementById('loaded').value, 10);
  const temp = parseInt(document.getElementById('ambientTemp').value, 10);
  const circuits = parseInt(document.getElementById('circuits').value, 10);
  const designCurrent = readNumber('designCurrent');

  const kt = temperatureFactor(insulation, method, temp);
  const kg = GROUPING_FACTORS[circuits];
  const base = baseAmpacity(section, insulation, loaded, method, 'Cu');
  const iz = base * kt * kg;

  document.getElementById('izValue').textContent = fmt(iz, 1) + ' A';
  document.getElementById('baseValue').textContent = fmt(base, 1) + ' A';
  document.getElementById('ktValue').textContent = fmt(kt, 2);
  document.getElementById('kgValue').textContent = fmt(kg, 2);

  const statusAlert = document.getElementById('statusAlert');
  if (designCurrent > 0) {
    if (designCurrent <= iz) {
      statusAlert.className = 'alert alert-success';
      statusAlert.textContent = '✓ CORRECTO - Ib = ' + fmt(designCurrent, 1) + ' A ≤ Iz = ' + fmt(iz, 1) + ' A';
    } else {
      statusAlert.className = 'alert alert-danger';
      statusAlert.textContent = '✗ INSUFICIENTE - Ib = ' + fmt(designCurrent, 1) + ' A > Iz = ' + fmt(iz, 1) + ' A. Aumenta la sección.';
    }
    statusAlert.style.display = 'block';
  } else {
    statusAlert.style.display = 'none';
  }

  // Tabla con todas las secciones en las mismas condiciones
  const tbody = document.getElementById('sectionsTableBody');
  tbody.innerHTML = '';
  STANDARD_SECTIONS.forEach(s => {
    const sBase = baseAmpacity(s, insulation, loaded, method, 'Cu');
    const sIz = sBase * kt * kg;
    const tr = document.createElement('tr');
    if (s === section) tr.className = 'table-primary fw-bold';
    else if (designCurrent > 0 && sIz < designCurrent) tr.className = 'text-body-tertiary';
    tr.innerHTML = '<td>' + s + '</td><td>' + fmt(sBase, 1) + '</td><td>' + fmt(sIz, 1) + '</td>';
    tbody.appendChild(tr);
  });

  document.getElementById('groundNote').style.display = method === 'D' ? 'block' : 'none';

  showResults();
  trackEvent('calculate', { calculator: 'ampacity' });
}

function trackEvent(name, data) {
  if (typeof gtag !== 'undefined') {
    gtag('event', name, data);
  }
}

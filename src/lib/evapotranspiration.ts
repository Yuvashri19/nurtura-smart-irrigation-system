/**
 * Hargreaves-Samani Reference Evapotranspiration (ET₀) Module
 * 
 * Provides daily reference evapotranspiration estimation based on ambient
 * temperature extrema (Tmax, Tmin), solar astronomical declination,
 * extraterrestrial radiation (Ra), and geographic latitude.
 * 
 * Standard Daily Hargreaves-Samani Equation:
 *   ET₀ = 0.0023 × Ra × (Tmean + 17.8) × √(Tmax − Tmin)
 * 
 * Where:
 *   Tmean = (Tmax + Tmin) / 2
 *   Ra is extraterrestrial solar radiation in MJ/m²/day derived from latitude & day of year
 *   ET₀ is expressed in mm/day
 */

// Default garden latitude (configurable in User Settings)
// Default set to 11.6640° N (Subtropical/Tropical agricultural zone)
export const DEFAULT_GARDEN_LATITUDE = 11.664;

export interface ETCalculationResult {
  date: string; // ISO date format YYYY-MM-DD
  dayOfYear: number; // 1 to 365/366
  latitude: number; // degrees (-90 to +90)
  Tmax: number; // °C
  Tmin: number; // °C
  Tmean: number; // °C
  Ra: number; // MJ/m²/day
  ET0: number; // mm/day
  // Standard lowercase aliases for database consistency
  tmax: number;
  tmin: number;
  tmean: number;
  ra: number;
  et0: number;
  isValid: boolean;
  statusMessage?: string;
  isDemo?: boolean;
}

export interface ExtraterrestrialRadiationResult {
  ra: number; // MJ/m²/day
  dayOfYear: number;
  dr: number; // inverse relative distance Earth-Sun
  delta: number; // solar declination in radians
  ws: number; // sunset hour angle in radians
}

export interface DailyETRecord extends ETCalculationResult {
  id?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 1. Day of Year (J) calculation
 * Calculates day of year (1-366) from given date object or string.
 */
export function getDayOfYear(dateInput: Date | string): number {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) {
    throw new Error('Invalid date provided to getDayOfYear');
  }
  const startOfYear = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - startOfYear.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

/**
 * 2. Mean Temperature calculation
 * Tmean = (Tmax + Tmin) / 2
 */
export function calculateMeanTemperature(tmax: number, tmin: number): number {
  return (tmax + tmin) / 2;
}

/**
 * 3. Extraterrestrial Radiation (Ra) calculation
 * Astronomical equation based on FAO-56 and standard solar geometry:
 * 
 * Inputs:
 * - latitude: degrees (-90 to +90)
 * - dateInput: Date object or YYYY-MM-DD string
 * 
 * Returns Ra in MJ/m²/day
 */
export function calculateExtraterrestrialRadiation(
  latitude: number,
  dateInput: Date | string
): ExtraterrestrialRadiationResult {
  if (typeof latitude !== 'number' || isNaN(latitude) || latitude < -90 || latitude > 90) {
    throw new Error(`Invalid latitude: ${latitude}. Must be between -90 and +90 degrees.`);
  }

  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) {
    throw new Error('Invalid date provided for Ra calculation');
  }

  const J = getDayOfYear(d);

  // Latitude in radians (phi)
  const phi = (Math.PI / 180) * latitude;

  // Inverse relative distance Earth-Sun (dr)
  const dr = 1 + 0.033 * Math.cos(((2 * Math.PI) / 365) * J);

  // Solar declination in radians (delta)
  const delta = 0.409 * Math.sin(((2 * Math.PI) / 365) * J - 1.39);

  // Sunset hour angle (ws)
  // ws = arccos(-tan(phi) * tan(delta))
  const x = -Math.tan(phi) * Math.tan(delta);
  let ws = 0;
  if (x <= -1) {
    // Polar day (continuous daylight)
    ws = Math.PI;
  } else if (x >= 1) {
    // Polar night (continuous darkness)
    ws = 0;
  } else {
    ws = Math.acos(x);
  }

  // Solar constant Gsc = 0.0820 MJ m-2 min-1
  const Gsc = 0.0820;

  // Daily extraterrestrial radiation (Ra) in MJ m-2 day-1
  // Ra = (24(60)/pi) * Gsc * dr * [ws*sin(phi)*sin(delta) + cos(phi)*cos(delta)*sin(ws)]
  const term1 = ((24 * 60) / Math.PI) * Gsc * dr;
  const term2 =
    ws * Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.sin(ws);

  const ra = Math.max(0, term1 * term2);

  return {
    ra: Number(ra.toFixed(3)),
    dayOfYear: J,
    dr: Number(dr.toFixed(5)),
    delta: Number(delta.toFixed(5)),
    ws: Number(ws.toFixed(5)),
  };
}

/**
 * 4. Hargreaves-Samani ET₀ calculation
 * Standard Daily Equation:
 *   ET₀ = 0.0023 × Ra × (Tmean + 17.8) × √(Tmax − Tmin)
 * 
 * Handles comprehensive validation for edge cases:
 * - Tmax < Tmin
 * - Tmax === Tmin
 * - Missing/NaN temperatures
 * - Invalid latitudes
 * - Invalid dates
 */
export function calculateHargreavesET0(
  tmax: number | null | undefined,
  tmin: number | null | undefined,
  latitude: number = DEFAULT_GARDEN_LATITUDE,
  dateInput: Date | string = new Date()
): ETCalculationResult {
  // Normalize date
  let d: Date;
  try {
    d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) {
      return createInvalidETResult('Invalid date parameter', latitude, dateInput);
    }
  } catch {
    return createInvalidETResult('Invalid date parameter', latitude, dateInput);
  }

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}`;

  // Validate latitude
  if (typeof latitude !== 'number' || isNaN(latitude) || latitude < -90 || latitude > 90) {
    return createInvalidETResult('Invalid latitude. Must be between -90° and +90°', latitude, dateStr);
  }

  // Validate temperatures
  if (
    tmax === null ||
    tmax === undefined ||
    tmin === null ||
    tmin === undefined ||
    isNaN(tmax) ||
    isNaN(tmin)
  ) {
    return createInvalidETResult('Collecting temperature data', latitude, dateStr);
  }

  if (tmax < tmin) {
    return createInvalidETResult(
      `Invalid temperature range: Tmax (${tmax}°C) cannot be lower than Tmin (${tmin}°C)`,
      latitude,
      dateStr,
      tmax,
      tmin
    );
  }

  if (Math.abs(tmax - tmin) < 0.1) {
    return createInvalidETResult(
      'Equal or near-equal Tmax and Tmin; insufficient diurnal variation',
      latitude,
      dateStr,
      tmax,
      tmin
    );
  }

  const { ra, dayOfYear } = calculateExtraterrestrialRadiation(latitude, d);
  const tmean = calculateMeanTemperature(tmax, tmin);

  // Hargreaves-Samani formula
  const tempDiff = Math.max(0, tmax - tmin);
  const et0 = 0.0023 * ra * (tmean + 17.8) * Math.sqrt(tempDiff);

  const roundedTmax = Number(tmax.toFixed(1));
  const roundedTmin = Number(tmin.toFixed(1));
  const roundedTmean = Number(tmean.toFixed(1));
  const roundedRa = Number(ra.toFixed(1));
  const roundedEt0 = Number(Math.max(0, et0).toFixed(2));

  return {
    date: dateStr,
    dayOfYear,
    latitude: Number(latitude.toFixed(4)),
    Tmax: roundedTmax,
    Tmin: roundedTmin,
    Tmean: roundedTmean,
    Ra: roundedRa,
    ET0: roundedEt0,
    tmax: roundedTmax,
    tmin: roundedTmin,
    tmean: roundedTmean,
    ra: roundedRa,
    et0: roundedEt0,
    isValid: true,
  };
}

function createInvalidETResult(
  message: string,
  latitude: number,
  dateInput: Date | string,
  tmax: number = 0,
  tmin: number = 0
): ETCalculationResult {
  let dateStr = 'unknown';
  let dayOfYear = 1;
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (!isNaN(d.getTime())) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      dateStr = `${yyyy}-${mm}-${dd}`;
      dayOfYear = getDayOfYear(d);
    }
  } catch {
    // fallback
  }

  return {
    date: dateStr,
    dayOfYear,
    latitude: typeof latitude === 'number' && !isNaN(latitude) ? Number(latitude.toFixed(4)) : DEFAULT_GARDEN_LATITUDE,
    Tmax: tmax,
    Tmin: tmin,
    Tmean: (tmax + tmin) / 2,
    Ra: 0,
    ET0: 0,
    tmax,
    tmin,
    tmean: (tmax + tmin) / 2,
    ra: 0,
    et0: 0,
    isValid: false,
    statusMessage: message,
  };
}

/**
 * Generates realistic historical ET₀ and temperature records for Demo Mode
 * covering the past 30 days.
 */
export function generateDemoETHistory(
  latitude: number = DEFAULT_GARDEN_LATITUDE,
  daysCount: number = 30
): DailyETRecord[] {
  const records: DailyETRecord[] = [];
  const today = new Date();

  // Typical warm diurnal profile baseline for agricultural garden
  // Tmin ~ 21.0 - 23.5°C, Tmax ~ 31.0 - 34.5°C
  for (let i = daysCount - 1; i >= 0; i--) {
    const targetDate = new Date();
    targetDate.setDate(today.getDate() - i);

    // Weather variation wave
    const wave = Math.sin((i / 5) * Math.PI);
    const randomJitter = (Math.sin(i * 3.7) + 1) * 0.4;
    const tmin = Number((21.5 + wave * 1.2 + randomJitter * 0.8).toFixed(1));
    const tmax = Number((32.2 + wave * 1.8 + randomJitter * 1.1).toFixed(1));

    const calc = calculateHargreavesET0(tmax, tmin, latitude, targetDate);

    records.push({
      ...calc,
      id: `demo-et-${calc.date}`,
      isDemo: true,
      createdAt: targetDate.toISOString(),
      updatedAt: targetDate.toISOString(),
    });
  }

  return records;
}

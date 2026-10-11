import { FlowCondition, SimulationSpeed, SimulatorSensors, SimulatorStatus } from './simulationTypes';

export const DEFAULT_SIMULATION_STATE: SimulatorSensors = {
  soilMoisture: 24, // Realistic low moisture
  temperature: 32, // 32°C
  humidity: 58, // 58%
  rainDetected: false,
  flowRate: 0,
  deliveredVolume: 0,
  targetVolume: 500,
  pumpActive: false,
  presenceDetected: false,
  flowCondition: 'normal',
  simulationSpeed: 5,
  status: 'WATERING_RECOMMENDED',
  statusReason: 'Soil moisture (24%) is below plant threshold (38%). Irrigation recommended.',
};

/**
 * Pure evaluation function for recommendation state based on moisture, threshold, and rain.
 */
export function evaluateSimulatorRecommendation(
  soilMoisture: number,
  threshold: number,
  rainDetected: boolean,
  currentStatus: SimulatorStatus
): { status: SimulatorStatus; statusReason: string } {
  // If active watering cycle, don't overwrite with IDLE/RECOMMENDED
  if (currentStatus === 'WATERING' || currentStatus === 'STARTING' || currentStatus === 'VERIFYING') {
    return { status: currentStatus, statusReason: 'Irrigation cycle currently active.' };
  }

  if (rainDetected) {
    return {
      status: 'WATERING_DELAYED',
      statusReason: 'Rain detected — irrigation postponed.',
    };
  }

  if (soilMoisture < threshold) {
    return {
      status: 'WATERING_RECOMMENDED',
      statusReason: `Soil moisture (${soilMoisture}%) is below plant threshold (${threshold}%). Watering recommended.`,
    };
  }

  return {
    status: 'IDLE',
    statusReason: `Soil moisture (${soilMoisture}%) is within healthy target range (${threshold}%+).`,
  };
}

/**
 * Calculates current flow rate based on flow condition and pump status.
 */
export function calculateNominalFlow(condition: FlowCondition, pumpActive: boolean): number {
  if (!pumpActive) return 0;
  switch (condition) {
    case 'no_flow':
      return 0;
    case 'low_flow':
      return 15 + Math.floor(Math.random() * 5); // 15–19 mL/min
    case 'normal':
    default:
      return 72 + Math.floor(Math.random() * 11); // 72–82 mL/min
  }
}

/**
 * Computes water delivered increment per tick based on flow condition and simulation speed.
 * Base tick is 500ms.
 */
export function calculateVolumeIncrement(
  condition: FlowCondition,
  speed: SimulationSpeed,
  currentDelivered: number,
  targetVolume: number
): number {
  if (condition === 'no_flow') return 0;

  let baseRate = 35; // mL per tick at 1x
  if (condition === 'low_flow') {
    baseRate = 8;
  }

  // Scale with simulation speed (1x, 2x, 5x, 10x)
  const increment = Math.round(baseRate * (speed / 2.5));
  const remaining = targetVolume - currentDelivered;
  return Math.min(remaining, Math.max(1, increment));
}

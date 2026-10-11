export type FlowCondition = 'normal' | 'low_flow' | 'no_flow';

export type SimulationSpeed = 1 | 2 | 5 | 10;

export type SimulatorStatus =
  | 'IDLE'
  | 'WATERING_RECOMMENDED'
  | 'STARTING'
  | 'WATERING'
  | 'VERIFYING'
  | 'COMPLETED'
  | 'INTERRUPTED'
  | 'FAULT'
  | 'WATERING_DELAYED';

export interface SimulatorSensors {
  soilMoisture: number; // 0–100%
  temperature: number; // °C
  humidity: number; // %
  rainDetected: boolean;
  flowRate: number; // mL/min (nominal ~72–82, low ~15, zero 0)
  deliveredVolume: number; // mL
  targetVolume: number; // mL
  pumpActive: boolean;
  presenceDetected: boolean;
  flowCondition: FlowCondition;
  simulationSpeed: SimulationSpeed;
  status: SimulatorStatus;
  statusReason: string;
}

export interface ScenarioDefinition {
  id: string;
  name: string;
  description: string;
  badge?: string;
  action: () => void;
}

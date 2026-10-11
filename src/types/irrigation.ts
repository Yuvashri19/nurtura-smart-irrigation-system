export type IrrigationStatus =
  | 'IDLE'                  // Watering Not Required
  | 'WATERING_RECOMMENDED'  // Moisture below threshold
  | 'STARTING'              // Preparing irrigation...
  | 'WATERING'              // Watering In Progress (Pump ON)
  | 'VERIFYING'             // Target reached, final sensor verification
  | 'COMPLETED'             // Watering Complete ✓
  | 'INTERRUPTED'           // Manually stopped by user
  | 'FAULT'                 // No water flow detected
  | 'WATERING_DELAYED';     // Rain detected

export type GrowthStage = 'Seedling' | 'Vegetative' | 'Flowering' | 'Fruiting' | 'Mature';

export type PlantCategory =
  | 'Vegetable'
  | 'Fruit'
  | 'Herb'
  | 'Flower'
  | 'Indoor Plant'
  | 'Outdoor Plant'
  | 'Succulent'
  | 'Other';

export type MoisturePreference = 'Low' | 'Moderate' | 'High';

export interface StageProfile {
  stage: GrowthStage;
  minMoisture: number; // e.g. 40%
  maxMoisture: number; // e.g. 65%
  targetWaterMl: number; // e.g. 500 mL
  description: string;
}

export interface Plant {
  id: string;
  name: string;
  scientificName: string;
  image: string;
  description: string;
  stages: Record<GrowthStage, StageProfile>;
  // Custom plant properties (optional for predefined, populated for user-added plants)
  isCustom?: boolean;
  category?: PlantCategory;
  moisturePreference?: MoisturePreference;
  targetMoisture?: number;
  minMoisture?: number;
  maxMoisture?: number;
  defaultWateringVolume?: number;
  areaM2?: number;
  kc?: number | null;
  notes?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomPlantInput {
  name: string;
  category: PlantCategory;
  growthStage: GrowthStage;
  moisturePreference: MoisturePreference;
  notes?: string;
  minMoisture?: number;
  targetMoisture?: number;
  maxMoisture?: number;
  defaultWateringVolume?: number;
  areaM2?: number;
  kc?: number | null;
}

export interface GardenSetupConfig {
  setupCompleted: boolean;
  plantCount: number;
  latitude: number;
  longitude: number;
  locationSource: 'browser_geolocation' | 'manual' | 'simulated';
  locationUpdatedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlantAreaItem {
  id: string; // e.g. "plant1"
  name: string; // e.g. "Plant 1"
  areaM2: number; // e.g. 0.25
}

export interface HistoryEvent {
  id: string;
  timestamp: string; // e.g. "10:38 AM"
  waterDelivered: number; // mL
  targetVolume: number; // mL
  durationMinutes: number; // min
  status: 'complete' | 'interrupted' | 'fault' | 'low_flow';
  statusLabel: string; // "✓ Complete", "⚠ Interrupted", "⚠ No Flow"
  notes?: string;
  plantName: string;
  stage: GrowthStage;
}

export interface TimelineEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'start' | 'progress' | 'complete' | 'warning' | 'fault';
}

export interface SensorData {
  soilMoisture: number; // %
  temperature: number; // °C
  humidity: number; // %
  lightLux: number; // Lux
  rainDetected: boolean;
  flowRate: number; // mL/min (nominal 82, low-flow 18, zero 0)
  deliveredVolume: number; // mL
  targetVolume: number; // mL
  pumpActive: boolean;
  lowFlowActive: boolean;
  noFlowActive: boolean;
  autoWateringEnabled: boolean;
  presenceDetected?: boolean;
}

export interface GraphDataPoint {
  timeLabel: string;
  soilMoisture: number;
  pumpState: boolean;
  event?: HistoryEvent;
}

export interface ETCalculationResult {
  date: string;
  dayOfYear: number;
  latitude: number;
  Tmax: number;
  Tmin: number;
  Tmean: number;
  Ra: number;
  ET0: number;
  tmax: number;
  tmin: number;
  tmean: number;
  ra: number;
  et0: number;
  isValid: boolean;
  statusMessage?: string;
  isDemo?: boolean;
}

export interface DailyETRecord extends ETCalculationResult {
  id?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

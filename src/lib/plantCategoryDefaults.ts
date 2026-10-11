import { PlantCategory, MoisturePreference, GrowthStage, StageProfile, Plant } from '../types/irrigation';

export const PLANT_CATEGORIES: PlantCategory[] = [
  'Vegetable',
  'Fruit',
  'Herb',
  'Flower',
  'Indoor Plant',
  'Outdoor Plant',
  'Succulent',
  'Other',
];

export const MOISTURE_PREFERENCES: MoisturePreference[] = ['Low', 'Moderate', 'High'];

export const CATEGORY_ICONS: Record<PlantCategory, string> = {
  Vegetable: '🥕',
  Fruit: '🍓',
  Herb: '🌿',
  Flower: '🌸',
  'Indoor Plant': '🪴',
  'Outdoor Plant': '🌳',
  Succulent: '🌵',
  Other: '🌱',
};

// Return sensible default moisture thresholds and dosing based on preference and category
export function getDefaultMoistureTargets(
  category: PlantCategory,
  preference: MoisturePreference
): { minMoisture: number; targetMoisture: number; maxMoisture: number; defaultWateringVolume: number } {
  if (category === 'Succulent') {
    return {
      minMoisture: 18,
      targetMoisture: 30,
      maxMoisture: 42,
      defaultWateringVolume: 200,
    };
  }

  switch (preference) {
    case 'Low':
      return {
        minMoisture: 22,
        targetMoisture: 35,
        maxMoisture: 48,
        defaultWateringVolume: 300,
      };
    case 'High':
      return {
        minMoisture: 45,
        targetMoisture: 60,
        maxMoisture: 75,
        defaultWateringVolume: 600,
      };
    case 'Moderate':
    default:
      return {
        minMoisture: 35,
        targetMoisture: 50,
        maxMoisture: 65,
        defaultWateringVolume: 450,
      };
  }
}

// Convert a custom plant document into a full Plant object satisfying existing NURTURA interfaces
export function createCustomPlantObject(docData: {
  id: string;
  name: string;
  category: PlantCategory;
  growthStage: GrowthStage;
  moisturePreference: MoisturePreference;
  minMoisture?: number;
  targetMoisture?: number;
  maxMoisture?: number;
  defaultWateringVolume?: number;
  areaM2?: number;
  kc?: number | null;
  notes?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}): Plant {
  const defaults = getDefaultMoistureTargets(docData.category, docData.moisturePreference);
  const minM = typeof docData.minMoisture === 'number' ? docData.minMoisture : defaults.minMoisture;
  const targetM = typeof docData.targetMoisture === 'number' ? docData.targetMoisture : defaults.targetMoisture;
  const maxM = typeof docData.maxMoisture === 'number' ? docData.maxMoisture : defaults.maxMoisture;
  const targetVol = typeof docData.defaultWateringVolume === 'number' ? docData.defaultWateringVolume : defaults.defaultWateringVolume;

  const stages: Record<GrowthStage, StageProfile> = {
    Seedling: {
      stage: 'Seedling',
      minMoisture: Math.min(100, Math.round(minM * 1.15)),
      maxMoisture: Math.min(100, Math.round(maxM * 1.05)),
      targetWaterMl: Math.max(100, Math.round(targetVol * 0.6)),
      description: 'Delicate seedling development requiring consistent, gentle moisture.',
    },
    Vegetative: {
      stage: 'Vegetative',
      minMoisture: minM,
      maxMoisture: maxM,
      targetWaterMl: targetVol,
      description: 'Active leaf and shoot development. Balanced hydration prevents wilting.',
    },
    Flowering: {
      stage: 'Flowering',
      minMoisture: Math.min(100, Math.round(minM * 1.1)),
      maxMoisture: Math.min(100, Math.round(maxM * 1.05)),
      targetWaterMl: Math.round(targetVol * 1.1),
      description: 'Bloom formation requiring stable moisture to prevent premature flower drop.',
    },
    Fruiting: {
      stage: 'Fruiting',
      minMoisture: Math.min(100, Math.round(minM * 1.08)),
      maxMoisture: maxM,
      targetWaterMl: Math.round(targetVol * 1.2),
      description: 'Fruit and pod expansion demanding continuous, regulated hydration.',
    },
    Mature: {
      stage: 'Mature',
      minMoisture: Math.max(10, Math.round(minM * 0.9)),
      maxMoisture: Math.max(25, Math.round(maxM * 0.95)),
      targetWaterMl: Math.round(targetVol * 0.9),
      description: 'Established mature crop with deep roots and steady moisture requirements.',
    },
  };

  const icon = CATEGORY_ICONS[docData.category] || '🌱';

  // SVG representation for custom plant avatar matching the clean NURTURA styling
  const svgAvatar = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="100%" height="100%" fill="%23EDF3EB"/><circle cx="150" cy="150" r="90" fill="%23CFDFCB"/><text x="150" y="175" font-size="95" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">${icon}</text></svg>`;

  return {
    id: docData.id,
    name: docData.name,
    scientificName: `${docData.category} · ${docData.moisturePreference} Moisture`,
    image: svgAvatar,
    description: docData.notes || `Custom ${docData.category.toLowerCase()} configured for ${docData.moisturePreference.toLowerCase()} moisture irrigation.`,
    stages,
    isCustom: true,
    category: docData.category,
    moisturePreference: docData.moisturePreference,
    minMoisture: minM,
    targetMoisture: targetM,
    maxMoisture: maxM,
    defaultWateringVolume: targetVol,
    areaM2: docData.areaM2,
    kc: docData.kc ?? null,
    notes: docData.notes || '',
    userId: docData.userId,
    createdAt: docData.createdAt,
    updatedAt: docData.updatedAt,
  };
}

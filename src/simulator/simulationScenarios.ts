export interface SimulationScenarioActions {
  simulateDrySoil: () => void;
  simulateNormalSoil: () => void;
  simulateRain: () => void;
  simulateClearRain: () => void;
  simulateNormalWatering: () => void;
  simulateLowFlow: () => void;
  simulateNoFlow: () => void;
  simulatePresence: () => void;
  resetSimulation: () => void;
}

export const SCENARIO_DESCRIPTIONS = {
  normal: {
    title: 'Normal Irrigation Cycle',
    description: 'Demonstrates automated closed-loop irrigation: dry substrate triggers dosing until target volume is reached.',
  },
  rain: {
    title: 'Rain Postponement',
    description: 'Optical precipitation sensor blocks watering cycles to prevent water waste and root rot.',
  },
  lowFlow: {
    title: 'Low Flow Safety Interrupt',
    description: 'Recognizes pinched tubing or restricted flow (~18 mL/min) and safely cuts off the dosing cycle.',
  },
  noFlow: {
    title: 'Zero Flow Hardware Cutoff',
    description: 'Simulates pump cavitation or depleted reservoir (0 mL/min) and trips the emergency cutoff.',
  },
  presence: {
    title: 'Balcony Presence Detection',
    description: 'PIR motion sensor detects garden activity and dispatches safety notification.',
  },
};

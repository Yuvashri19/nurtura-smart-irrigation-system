import { useState, useRef, useCallback, useEffect } from 'react';
import {
  FlowCondition,
  SimulationSpeed,
  SimulatorSensors,
  SimulatorStatus,
} from './simulationTypes';
import {
  DEFAULT_SIMULATION_STATE,
  calculateNominalFlow,
  calculateVolumeIncrement,
  evaluateSimulatorRecommendation,
} from './simulationEngine';

export interface UseNurturaSimulatorProps {
  thresholdMoisture: number;
  plantName: string;
  stageName: string;
  onRecordHistory?: (event: {
    waterDelivered: number;
    targetVolume: number;
    durationMinutes: number;
    status: 'complete' | 'interrupted' | 'fault' | 'low_flow';
    statusLabel: string;
    notes: string;
  }) => void;
  onAddAlert?: (title: string, message: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}

export function useNurturaSimulator({
  thresholdMoisture,
  plantName,
  stageName,
  onRecordHistory,
  onAddAlert,
}: UseNurturaSimulatorProps) {
  const [simulatorState, setSimulatorState] = useState<SimulatorSensors>(DEFAULT_SIMULATION_STATE);

  const activeCycleStartRef = useRef<number>(0);
  const deliveryTimerRef = useRef<number | null>(null);
  const faultTimerRef = useRef<number | null>(null);

  // Stop active loops safely
  const stopTimers = useCallback(() => {
    if (deliveryTimerRef.current !== null) {
      clearInterval(deliveryTimerRef.current);
      deliveryTimerRef.current = null;
    }
    if (faultTimerRef.current !== null) {
      clearTimeout(faultTimerRef.current);
      faultTimerRef.current = null;
    }
  }, []);

  // Update Environment Parameters
  const setSoilMoisture = useCallback((val: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(val)));
    setSimulatorState((prev) => {
      const evalResult = evaluateSimulatorRecommendation(
        clamped,
        thresholdMoisture,
        prev.rainDetected,
        prev.status
      );
      return {
        ...prev,
        soilMoisture: clamped,
        status: evalResult.status,
        statusReason: evalResult.statusReason,
      };
    });
  }, [thresholdMoisture]);

  const setTemperature = useCallback((val: number) => {
    const clamped = Math.max(15, Math.min(45, Math.round(val * 10) / 10));
    setSimulatorState((prev) => ({ ...prev, temperature: clamped }));
  }, []);

  const setHumidity = useCallback((val: number) => {
    const clamped = Math.max(20, Math.min(95, Math.round(val)));
    setSimulatorState((prev) => ({ ...prev, humidity: clamped }));
  }, []);

  const setRainDetected = useCallback((detected: boolean) => {
    setSimulatorState((prev) => {
      const evalResult = evaluateSimulatorRecommendation(
        prev.soilMoisture,
        thresholdMoisture,
        detected,
        prev.status
      );
      return {
        ...prev,
        rainDetected: detected,
        status: evalResult.status,
        statusReason: evalResult.statusReason,
      };
    });
  }, [thresholdMoisture]);

  const setTargetVolume = useCallback((volume: number) => {
    setSimulatorState((prev) => ({ ...prev, targetVolume: volume }));
  }, []);

  const setFlowCondition = useCallback((condition: FlowCondition) => {
    setSimulatorState((prev) => {
      const flow = calculateNominalFlow(condition, prev.pumpActive);
      return {
        ...prev,
        flowCondition: condition,
        flowRate: flow,
      };
    });
  }, []);

  const setSimulationSpeed = useCallback((speed: SimulationSpeed) => {
    setSimulatorState((prev) => ({ ...prev, simulationSpeed: speed }));
  }, []);

  const setPresenceDetected = useCallback((detected: boolean) => {
    setSimulatorState((prev) => ({ ...prev, presenceDetected: detected }));
    if (detected && onAddAlert) {
      onAddAlert(
        'Presence Detected',
        'Activity detected near garden crop zone by PIR motion sensor.',
        'info'
      );
    }
  }, [onAddAlert]);

  // Start Watering Cycle
  const startWatering = useCallback(() => {
    if (simulatorState.rainDetected) {
      if (onAddAlert) {
        onAddAlert('Watering Postponed', 'Rain is detected. Automatic watering is delayed.', 'warning');
      }
      return;
    }

    stopTimers();
    activeCycleStartRef.current = Date.now();

    const flow = calculateNominalFlow(simulatorState.flowCondition, true);

    setSimulatorState((prev) => ({
      ...prev,
      pumpActive: true,
      deliveredVolume: 0,
      flowRate: flow,
      status: 'WATERING',
      statusReason: 'Watering in progress. Dispensing calibrated flow.',
    }));

    // If No Flow, trip cutoff after timeout
    if (simulatorState.flowCondition === 'no_flow') {
      const noFlowTimeoutMs = Math.round(2500 / (simulatorState.simulationSpeed / 2));
      faultTimerRef.current = window.setTimeout(() => {
        stopTimers();
        setSimulatorState((prev) => ({
          ...prev,
          pumpActive: false,
          flowRate: 0,
          status: 'FAULT',
          statusReason: 'No Water Flow Detected. Check water reservoir or tubing line.',
        }));
        if (onAddAlert) {
          onAddAlert(
            'Watering Interrupted',
            'No water flow detected while pump is engaged.',
            'error'
          );
        }
        if (onRecordHistory) {
          onRecordHistory({
            waterDelivered: 0,
            targetVolume: simulatorState.targetVolume,
            durationMinutes: 1,
            status: 'fault',
            statusLabel: '⚠ No Flow',
            notes: 'Emergency shutoff triggered: 0 mL/min flow detected during active dosing.',
          });
        }
      }, noFlowTimeoutMs);
      return;
    }

    // Incremental Delivery Loop
    const tickMs = Math.max(100, Math.round(500 / simulatorState.simulationSpeed));
    let delivered = 0;
    let currentMoisture = simulatorState.soilMoisture;
    let lowFlowWarned = false;

    deliveryTimerRef.current = window.setInterval(() => {
      // Low Flow Detection Logic
      if (simulatorState.flowCondition === 'low_flow' && !lowFlowWarned && delivered >= 40) {
        lowFlowWarned = true;
        if (onAddAlert) {
          onAddAlert('⚠ Low Flow Detected', 'Restricted line flow observed (15 mL/min).', 'warning');
        }

        // Low flow interruption timeout
        faultTimerRef.current = window.setTimeout(() => {
          stopTimers();
          setSimulatorState((prev) => ({
            ...prev,
            pumpActive: false,
            flowRate: 0,
            status: 'INTERRUPTED',
            statusReason: 'Watering Interrupted — Low Flow detected.',
          }));
          if (onAddAlert) {
            onAddAlert(
              'Watering Interrupted — Low Flow',
              `Cycle interrupted after delivering ${delivered} mL due to flow restriction.`,
              'warning'
            );
          }
          if (onRecordHistory) {
            onRecordHistory({
              waterDelivered: delivered,
              targetVolume: simulatorState.targetVolume,
              durationMinutes: 2,
              status: 'low_flow',
              statusLabel: '⚠ Low Flow',
              notes: 'Cycle stopped automatically due to sustained low flow restriction.',
            });
          }
        }, 1200);
        return;
      }

      const increment = calculateVolumeIncrement(
        simulatorState.flowCondition,
        simulatorState.simulationSpeed,
        delivered,
        simulatorState.targetVolume
      );

      delivered += increment;
      // Gradual elevation of soil moisture
      currentMoisture = Math.min(65, currentMoisture + (increment / simulatorState.targetVolume) * 22);

      if (delivered >= simulatorState.targetVolume) {
        stopTimers();
        const finalDelivered = simulatorState.targetVolume;
        const postMoisture = Math.round(currentMoisture);

        // Enter verifying stage
        setSimulatorState((prev) => ({
          ...prev,
          deliveredVolume: finalDelivered,
          soilMoisture: postMoisture,
          pumpActive: false,
          flowRate: 0,
          status: 'VERIFYING',
          statusReason: 'Target reached. Conducting final sensor verification...',
        }));

        // Transition to COMPLETED after short verification delay
        window.setTimeout(() => {
          setSimulatorState((prev) => ({
            ...prev,
            status: 'COMPLETED',
            statusReason: `${finalDelivered} mL delivered successfully. Irrigation Verified.`,
          }));

          if (onAddAlert) {
            onAddAlert(
              'Watering Complete ✓',
              `Target ${finalDelivered} mL delivered. Plant hydration verified.`,
              'success'
            );
          }

          if (onRecordHistory) {
            onRecordHistory({
              waterDelivered: finalDelivered,
              targetVolume: finalDelivered,
              durationMinutes: Math.max(1, Math.round((Date.now() - activeCycleStartRef.current) / 60000) || 5),
              status: 'complete',
              statusLabel: '✓ Complete',
              notes: `Nominal flow cycle completed. Substrate moisture elevated to ${postMoisture}%. [DEMO]`,
            });
          }
        }, Math.max(300, Math.round(800 / simulatorState.simulationSpeed)));
      } else {
        const liveFlow = calculateNominalFlow(simulatorState.flowCondition, true);
        setSimulatorState((prev) => ({
          ...prev,
          deliveredVolume: delivered,
          soilMoisture: Math.round(currentMoisture),
          flowRate: liveFlow,
        }));
      }
    }, tickMs);
  }, [
    simulatorState.flowCondition,
    simulatorState.simulationSpeed,
    simulatorState.soilMoisture,
    simulatorState.targetVolume,
    simulatorState.rainDetected,
    stopTimers,
    onAddAlert,
    onRecordHistory,
  ]);

  // Stop Watering
  const stopWatering = useCallback(() => {
    stopTimers();
    const stoppedVolume = simulatorState.deliveredVolume;
    setSimulatorState((prev) => ({
      ...prev,
      pumpActive: false,
      flowRate: 0,
      status: 'INTERRUPTED',
      statusReason: `Watering manually interrupted at ${stoppedVolume} mL.`,
    }));

    if (onAddAlert) {
      onAddAlert('Watering Stopped', `Cycle paused by user at ${stoppedVolume} mL.`, 'warning');
    }
  }, [stopTimers, simulatorState.deliveredVolume, onAddAlert]);

  // 1-Click Scenario Handlers
  const simulateDrySoil = useCallback(() => {
    setSoilMoisture(24);
    setRainDetected(false);
    if (onAddAlert) {
      onAddAlert('Simulated Substrate Dry', 'Soil capacitance set to 24%. Irrigation recommended.', 'info');
    }
  }, [setSoilMoisture, setRainDetected, onAddAlert]);

  const simulateNormalSoil = useCallback(() => {
    setSoilMoisture(55);
    if (onAddAlert) {
      onAddAlert('Simulated Substrate Moist', 'Soil capacitance set to 55%. Hydration sufficient.', 'info');
    }
  }, [setSoilMoisture, onAddAlert]);

  const simulateRain = useCallback(() => {
    setRainDetected(true);
    if (onAddAlert) {
      onAddAlert('Precipitation Sensed', 'Optical sensor activated. Irrigation postponed.', 'warning');
    }
  }, [setRainDetected, onAddAlert]);

  const simulateClearRain = useCallback(() => {
    setRainDetected(false);
    if (onAddAlert) {
      onAddAlert('Precipitation Cleared', 'Rain hold disengaged.', 'info');
    }
  }, [setRainDetected, onAddAlert]);

  const simulateNormalWatering = useCallback(() => {
    stopTimers();
    setFlowCondition('normal');
    setSoilMoisture(24);
    setRainDetected(false);
    // Slight pause so the user sees the 24% state before actuation
    setTimeout(() => {
      startWatering();
    }, 200);
  }, [stopTimers, setFlowCondition, setSoilMoisture, setRainDetected, startWatering]);

  const simulateLowFlow = useCallback(() => {
    stopTimers();
    setSoilMoisture(24);
    setRainDetected(false);
    setFlowCondition('low_flow');
    setTimeout(() => {
      startWatering();
    }, 200);
  }, [stopTimers, setSoilMoisture, setRainDetected, setFlowCondition, startWatering]);

  const simulateNoFlow = useCallback(() => {
    stopTimers();
    setSoilMoisture(24);
    setRainDetected(false);
    setFlowCondition('no_flow');
    setTimeout(() => {
      startWatering();
    }, 200);
  }, [stopTimers, setSoilMoisture, setRainDetected, setFlowCondition, startWatering]);

  const simulatePresence = useCallback(() => {
    setPresenceDetected(true);
    setTimeout(() => {
      setPresenceDetected(false);
    }, 6000);
  }, [setPresenceDetected]);

  const resetSimulation = useCallback(() => {
    stopTimers();
    setSimulatorState({
      ...DEFAULT_SIMULATION_STATE,
      soilMoisture: 24,
      temperature: 32,
      humidity: 58,
      rainDetected: false,
      flowRate: 0,
      deliveredVolume: 0,
      pumpActive: false,
      presenceDetected: false,
      flowCondition: 'normal',
      status: 'WATERING_RECOMMENDED',
      statusReason: `Soil moisture (24%) is below plant threshold (${thresholdMoisture}%). Watering recommended.`,
    });
    if (onAddAlert) {
      onAddAlert('Simulation Reset', 'Restored baseline parameters (Soil: 24%, Temp: 32°C).', 'info');
    }
  }, [stopTimers, thresholdMoisture, onAddAlert]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      stopTimers();
    };
  }, [stopTimers]);

  return {
    simulatorState,
    setSoilMoisture,
    setTemperature,
    setHumidity,
    setRainDetected,
    setTargetVolume,
    setFlowCondition,
    setSimulationSpeed,
    setPresenceDetected,
    startWatering,
    stopWatering,
    simulateDrySoil,
    simulateNormalSoil,
    simulateRain,
    simulateClearRain,
    simulateNormalWatering,
    simulateLowFlow,
    simulateNoFlow,
    simulatePresence,
    resetSimulation,
  };
}

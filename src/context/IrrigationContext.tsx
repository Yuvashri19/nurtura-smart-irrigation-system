import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  Plant,
  GrowthStage,
  IrrigationStatus,
  SensorData,
  HistoryEvent,
  TimelineEntry,
  GraphDataPoint,
  CustomPlantInput,
  ETCalculationResult,
  DailyETRecord,
  GardenSetupConfig,
  PlantAreaItem,
} from '../types/irrigation';
import { FlowCondition, SimulationSpeed } from '../simulator/simulationTypes';
import { calculateNominalFlow, calculateVolumeIncrement } from '../simulator/simulationEngine';
import { PLANTS, INITIAL_HISTORY } from '../data/plantData';
import { createCustomPlantObject } from '../lib/plantCategoryDefaults';
import {
  DEFAULT_GARDEN_LATITUDE,
  calculateHargreavesET0,
  generateDemoETHistory,
} from '../lib/evapotranspiration';
import { auth, db, testFirestoreConnection } from '../lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { handleFirestoreError, logFirestoreError, OperationType } from '../lib/firestoreErrors';
import { getAuthErrorMessage } from '../lib/authErrors';

export type PlantMood = 'happy' | 'crying' | 'neutral';

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  controllerNodeId: string;
}

interface ToastAlert {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  timestamp: string;
}

interface IrrigationContextType {
  // Auth & Profile
  isLoggedIn: boolean;
  isDemoMode: boolean;
  authLoading: boolean;
  currentUser: UserProfile | null;
  loginError: string | null;
  loginLoading: boolean;
  setLoginError: (err: string | null) => void;
  signInWithEmail: (email: string, pass: string) => Promise<boolean>;
  signUpWithEmail: (email: string, pass: string, displayName?: string) => Promise<boolean>;
  loginWithPassword: (email: string, pass: string) => boolean;
  loginAsDemo: () => void;
  logout: () => Promise<void>;

  // Navigation
  currentTab: 'dashboard' | 'plant' | 'history' | 'settings';
  setCurrentTab: (tab: 'dashboard' | 'plant' | 'history' | 'settings') => void;

  // Plant selection
  selectedPlant: Plant;
  selectedStage: GrowthStage;
  setSelectedPlant: (plant: Plant) => void;
  setSelectedStage: (stage: GrowthStage) => void;
  customPlants: Plant[];
  addCustomPlant: (input: CustomPlantInput) => Promise<Plant>;
  updateCustomPlant: (plantId: string, input: CustomPlantInput) => Promise<Plant>;
  deleteCustomPlant: (plantId: string) => Promise<void>;

  // Status & Sensors
  status: IrrigationStatus;
  statusReason: string;
  plantMood: PlantMood;
  sensors: SensorData;
  history: HistoryEvent[];
  timeline: TimelineEntry[];
  graphPoints: GraphDataPoint[];
  alerts: ToastAlert[];
  dismissAlert: (id: string) => void;
  addAlert: (title: string, message: string, type: 'success' | 'warning' | 'error' | 'info') => void;

  // Irrigation Actions
  startWatering: () => void;
  requestStopWatering: () => void;
  confirmStopWatering: () => void;
  cancelStopWatering: () => void;
  isStopModalOpen: boolean;

  // Calibration & Hardware Diagnostics
  isDiagnosticsOpen: boolean;
  setIsDiagnosticsOpen: (open: boolean) => void;
  makeSoilDry: () => void;
  makeSoilWet: () => void;
  makeSoilNormal: () => void;
  simulateDrySoil: () => void;
  simulateNormalSoil: () => void;
  simulateRain: () => void;
  clearRain: () => void;
  simulateLowFlow: () => void;
  simulateNoFlow: () => void;
  clearFaults: () => void;
  completeWateringInstantly: () => void;
  toggleAutoWatering: () => void;
  resetCalibration: () => void;
  isResetModalOpen: boolean;
  setIsResetModalOpen: (open: boolean) => void;

  // Hardware diagram modal
  isArchitectureModalOpen: boolean;
  setIsArchitectureModalOpen: (open: boolean) => void;

  // Graph inspect modal
  selectedGraphEvent: HistoryEvent | null;
  setSelectedGraphEvent: (event: HistoryEvent | null) => void;

  // Evapotranspiration (ET₀) Stage 1 Intelligence
  latitude: number;
  updateUserLatitude: (lat: number) => Promise<void>;
  todayET: ETCalculationResult;
  etHistory: DailyETRecord[];
  refreshET: () => void;

  // Simulator & Demo Mode Controls
  simulationSpeed: SimulationSpeed;
  setSimulationSpeed: (speed: SimulationSpeed) => void;
  flowCondition: FlowCondition;
  setFlowCondition: (cond: FlowCondition) => void;
  presenceDetected: boolean;
  setPresenceDetected: (detected: boolean) => void;
  setSimulatorSoilMoisture: (val: number) => void;
  setSimulatorTemperature: (val: number) => void;
  setSimulatorHumidity: (val: number) => void;
  setSimulatorTargetVolume: (val: number) => void;
  toggleSimulatorRain: () => void;
  simulateNormalWatering: () => void;
  simulatePresence: () => void;
  resetSimulation: () => void;

  // Garden Setup & Onboarding
  isSetupCompleted: boolean;
  isSetupWizardOpen: boolean;
  setIsSetupWizardOpen: (open: boolean) => void;
  gardenSetup: GardenSetupConfig | null;
  plantAreas: PlantAreaItem[];
  completeGardenSetup: (config: {
    plantCount: number;
    plantAreas: PlantAreaItem[];
    latitude: number;
    longitude: number;
    locationSource: 'browser_geolocation' | 'manual' | 'simulated';
  }) => Promise<void>;
  saveAcquiredLocation: (coords: {
    latitude: number;
    longitude: number;
    plantCount?: number;
  }) => Promise<void>;
}

const IrrigationContext = createContext<IrrigationContextType | undefined>(undefined);

function getFormattedTime(): string {
  const now = new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${minutes} ${ampm}`;
}

export const IrrigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // App navigation
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'plant' | 'history' | 'settings'>('dashboard');

  // Plant & Stage
  const [selectedPlant, setSelectedPlantState] = useState<Plant>(PLANTS[0]); // San Marzano Tomato
  const [selectedStage, setSelectedStageState] = useState<GrowthStage>('Vegetative');
  const [customPlants, setCustomPlants] = useState<Plant[]>([]);
  const customPlantsRef = useRef<Plant[]>([]);
  customPlantsRef.current = customPlants;
  const selectedPlantRef = useRef<Plant>(PLANTS[0]);
  selectedPlantRef.current = selectedPlant;

  // Status & Reason
  const [status, setStatus] = useState<IrrigationStatus>('IDLE');
  const [statusReason, setStatusReason] = useState<string>('Your plant currently has sufficient moisture.');

  // Live Controller Sensors
  const [sensors, setSensors] = useState<SensorData>({
    soilMoisture: 42,
    temperature: 28.4,
    humidity: 67,
    lightLux: 780,
    rainDetected: false,
    flowRate: 0,
    deliveredVolume: 0,
    targetVolume: 500,
    pumpActive: false,
    lowFlowActive: false,
    noFlowActive: false,
    autoWateringEnabled: true,
  });

  // History & Timeline
  const [history, setHistory] = useState<HistoryEvent[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([
    {
      id: 'time-init-1',
      timestamp: '10:31 AM',
      message: 'Watering Started',
      type: 'start',
    },
    {
      id: 'time-init-2',
      timestamp: '10:34 AM',
      message: '220 mL Delivered',
      type: 'progress',
    },
    {
      id: 'time-init-3',
      timestamp: '10:38 AM',
      message: '500 mL Delivered',
      type: 'progress',
    },
    {
      id: 'time-init-4',
      timestamp: '10:38 AM',
      message: 'Watering Completed ✓',
      type: 'complete',
    },
  ]);

  // Graph Data
  const [graphPoints, setGraphPoints] = useState<GraphDataPoint[]>([
    { timeLabel: '08:00', soilMoisture: 35, pumpState: false },
    { timeLabel: '09:00', soilMoisture: 33, pumpState: false },
    { timeLabel: '10:00', soilMoisture: 32, pumpState: false },
    { timeLabel: '10:38', soilMoisture: 42, pumpState: true },
    { timeLabel: '11:30', soilMoisture: 41, pumpState: false },
    { timeLabel: '12:30', soilMoisture: 40, pumpState: false },
    { timeLabel: '13:20', soilMoisture: 43, pumpState: true },
    { timeLabel: '15:00', soilMoisture: 42, pumpState: false },
  ]);

  // Modals & Panels
  const [alerts, setAlerts] = useState<ToastAlert[]>([]);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [isStopModalOpen, setIsStopModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isArchitectureModalOpen, setIsArchitectureModalOpen] = useState(false);
  const [selectedGraphEvent, setSelectedGraphEvent] = useState<HistoryEvent | null>(null);

  // Evapotranspiration (ET₀) & Latitude Configuration
  const [latitude, setLatitude] = useState<number>(DEFAULT_GARDEN_LATITUDE);
  const latitudeRef = useRef<number>(DEFAULT_GARDEN_LATITUDE);
  latitudeRef.current = latitude;

  // Simulator State
  const [simulationSpeed, setSimulationSpeed] = useState<SimulationSpeed>(5);
  const [flowCondition, setFlowConditionState] = useState<FlowCondition>('normal');
  const [presenceDetected, setPresenceDetectedState] = useState<boolean>(false);
  const lowFlowWarnedRef = useRef<boolean>(false);

  // Garden Setup & Onboarding State
  const [isSetupCompleted, setIsSetupCompleted] = useState<boolean>(true);
  const [isSetupWizardOpen, setIsSetupWizardOpen] = useState<boolean>(false);
  const [gardenSetup, setGardenSetup] = useState<GardenSetupConfig | null>({
    setupCompleted: true,
    plantCount: 6,
    latitude: DEFAULT_GARDEN_LATITUDE,
    longitude: 78.1460,
    locationSource: 'browser_geolocation',
    locationUpdatedAt: new Date().toISOString(),
  });
  const [plantAreas, setPlantAreas] = useState<PlantAreaItem[]>([
    { id: 'plant1', name: 'Plant 1', areaM2: 0.25 },
    { id: 'plant2', name: 'Plant 2', areaM2: 0.30 },
    { id: 'plant3', name: 'Plant 3', areaM2: 0.20 },
    { id: 'plant4', name: 'Plant 4', areaM2: 0.25 },
    { id: 'plant5', name: 'Plant 5', areaM2: 0.35 },
    { id: 'plant6', name: 'Plant 6', areaM2: 0.25 },
  ]);

  // Real temperature tracking for today
  const [dailyTemps, setDailyTemps] = useState<{
    date: string;
    tmin: number | null;
    tmax: number | null;
    samples: number;
  }>(() => {
    const today = new Date().toISOString().split('T')[0];
    return { date: today, tmin: null, tmax: null, samples: 0 };
  });

  const [todayET, setTodayET] = useState<ETCalculationResult>(() => {
    // Initial realistic demonstration value
    const initial = calculateHargreavesET0(33.2, 21.8, DEFAULT_GARDEN_LATITUDE, new Date());
    initial.isDemo = true;
    return initial;
  });

  const [etHistory, setEtHistory] = useState<DailyETRecord[]>(() => {
    return generateDemoETHistory(DEFAULT_GARDEN_LATITUDE, 30);
  });

  // Interval references
  const wateringIntervalRef = useRef<number | null>(null);
  const activeCycleStartTimeRef = useRef<number>(0);
  const startingTimeoutRef = useRef<number | null>(null);
  const noFlowTimeoutRef = useRef<number | null>(null);

  // Derive plant emotional mood
  const minThreshold = selectedPlant.stages[selectedStage]?.minMoisture ?? 38;
  const plantMood: PlantMood =
    status === 'WATERING' || status === 'COMPLETED'
      ? 'happy'
      : sensors.soilMoisture < minThreshold
      ? 'crying'
      : 'happy';

  const addAlert = useCallback((title: string, message: string, type: 'success' | 'warning' | 'error' | 'info') => {
    const timestamp = getFormattedTime();
    const tempId = `alert-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    if (!isDemoMode && auth.currentUser) {
      const alertsCol = collection(db, 'users', auth.currentUser.uid, 'alerts');
      addDoc(alertsCol, {
        userId: auth.currentUser.uid,
        title,
        message,
        type,
        timestamp,
      })
        .then((docRef) => {
          if (type !== 'error') {
            setTimeout(() => {
              deleteDoc(docRef).catch(() => {});
            }, 7000);
          }
        })
        .catch((err) => {
          console.warn('Could not persist alert to Firestore, showing locally:', err);
          setAlerts((prev) => [{ id: tempId, title, message, type, timestamp }, ...prev]);
        });
    } else {
      setAlerts((prev) => [{ id: tempId, title, message, type, timestamp }, ...prev]);
      if (type !== 'error') {
        setTimeout(() => {
          setAlerts((prev) => prev.filter((a) => a.id !== tempId));
        }, 7000);
      }
    }
  }, [isDemoMode]);

  const dismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    if (!isDemoMode && auth.currentUser) {
      deleteDoc(doc(db, 'users', auth.currentUser.uid, 'alerts', id)).catch(() => {});
    }
  };

  // Test Firestore connection on boot
  useEffect(() => {
    testFirestoreConnection();
  }, []);

  // Firebase Authentication & Cloud Firestore Real-Time Synchronization
  useEffect(() => {
    let unsubs: (() => void)[] = [];

    const cleanupListeners = () => {
      unsubs.forEach((unsub) => {
        try {
          unsub();
        } catch (e) {
          console.error('Error unsubscribing listener:', e);
        }
      });
      unsubs = [];
    };

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      cleanupListeners();

      if (firebaseUser) {
        setIsLoggedIn(true);
        setIsDemoMode(false);
        setLoginError(null);

        try {
          // 1. User Profile Real-Time Listener
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const unsubProfile = onSnapshot(
            userDocRef,
            (userProfileSnap) => {
              if (userProfileSnap.exists()) {
                const data = userProfileSnap.data();
                setCurrentUser({
                  name: data?.displayName || firebaseUser.email?.split('@')[0] || 'Garden Admin',
                  email: firebaseUser.email || data?.email || '',
                  role: data?.role || 'Garden Administrator',
                  controllerNodeId: data?.controllerNodeId || 'balc-esp32-node1',
                });
                if (data?.setupCompleted === true || data?.setup?.setupCompleted === true) {
                  setIsSetupCompleted(true);
                  setIsSetupWizardOpen(false);
                }
              } else {
                const displayName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Garden Admin';
                const newUserData = {
                  id: firebaseUser.uid,
                  email: firebaseUser.email || '',
                  displayName,
                  role: 'Garden Administrator',
                  controllerNodeId: 'balc-esp32-node1',
                  createdAt: new Date().toISOString(),
                };
                setDoc(userDocRef, newUserData).catch((err) =>
                  logFirestoreError(err, OperationType.CREATE, `users/${firebaseUser.uid}`)
                );
              }
            },
            (error) => {
              logFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
            }
          );
          unsubs.push(unsubProfile);

          // 1b. Real-Time Garden Setup Listener (/users/{userId}/setup/config)
          const setupRef = doc(db, 'users', firebaseUser.uid, 'setup', 'config');
          const unsubSetup = onSnapshot(
            setupRef,
            (setupSnap) => {
              if (setupSnap.exists()) {
                const s = setupSnap.data();
                const completed = s?.setupCompleted === true;
                setIsSetupCompleted(completed);
                if (!completed) {
                  setIsSetupWizardOpen(true);
                } else {
                  setIsSetupWizardOpen(false);
                }
                setGardenSetup({
                  setupCompleted: completed,
                  plantCount: typeof s?.plantCount === 'number' ? s.plantCount : 6,
                  latitude: typeof s?.latitude === 'number' ? s.latitude : latitudeRef.current,
                  longitude: typeof s?.longitude === 'number' ? s.longitude : 0,
                  locationSource: s?.locationSource || 'browser_geolocation',
                  locationUpdatedAt: s?.locationUpdatedAt,
                  createdAt: s?.createdAt,
                  updatedAt: s?.updatedAt,
                });
                if (typeof s?.latitude === 'number' && !isNaN(s.latitude)) {
                  setLatitude(s.latitude);
                  latitudeRef.current = s.latitude;
                }
              } else {
                getDoc(userDocRef)
                  .then((uSnap) => {
                    const uData = uSnap.data();
                    if (uData?.setupCompleted === true || uData?.setup?.setupCompleted === true) {
                      setIsSetupCompleted(true);
                      setIsSetupWizardOpen(false);
                    } else {
                      setIsSetupCompleted(false);
                      setIsSetupWizardOpen(true);
                    }
                  })
                  .catch(() => {
                    setIsSetupCompleted(false);
                    setIsSetupWizardOpen(true);
                  });
              }
            },
            (error) => {
              logFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}/setup/config`);
            }
          );
          unsubs.push(unsubSetup);

          // 2. Real-Time Irrigation Settings Listener (/users/{userId}/settings/irrigation)
          const settingsRef = doc(db, 'users', firebaseUser.uid, 'settings', 'irrigation');
          console.log('[Firestore] irrigation settings listener active');
          const unsubSettings = onSnapshot(
            settingsRef,
            (docSnap) => {
              if (docSnap.exists()) {
                console.log('[Firestore] irrigation settings updated');
                const sData = docSnap.data();

                // Plant species matching (check predefined PLANTS first, then user custom plants)
                let targetPlant = selectedPlantRef.current;
                if (sData?.selectedPlantId) {
                  const matchedPredefined = PLANTS.find((p) => p.id === sData.selectedPlantId);
                  const matchedCustom = customPlantsRef.current.find((p) => p.id === sData.selectedPlantId);
                  const matched = matchedPredefined || matchedCustom;
                  if (matched) {
                    targetPlant = matched;
                    setSelectedPlantState(matched);
                  }
                }

                // Growth stage
                let targetStage = selectedStage;
                if (sData?.selectedStage && targetPlant.stages[sData.selectedStage as GrowthStage]) {
                  targetStage = sData.selectedStage as GrowthStage;
                  setSelectedStageState(targetStage);
                }

                // Volume and autoWatering settings
                const targetVol =
                  typeof sData?.targetVolume === 'number'
                    ? sData.targetVolume
                    : targetPlant.stages[targetStage]?.targetWaterMl ?? 500;
                const autoWater =
                  typeof sData?.autoWateringEnabled === 'boolean'
                    ? sData.autoWateringEnabled
                    : true;

                // User garden latitude
                if (typeof sData?.latitude === 'number' && !isNaN(sData.latitude)) {
                  setLatitude(sData.latitude);
                  latitudeRef.current = sData.latitude;
                }

                setSensors((prev) => ({
                  ...prev,
                  targetVolume: targetVol,
                  autoWateringEnabled: autoWater,
                }));

                // Call evaluateRecommendation outside of setSensors to prevent nested state update crashes
                evaluateRecommendation(sensors.soilMoisture, targetPlant, targetStage, sensors.rainDetected);
              } else {
                // Seed initial settings document if not present
                setDoc(settingsRef, {
                  userId: firebaseUser.uid,
                  selectedPlantId: 'tomato',
                  selectedStage: 'Vegetative',
                  targetVolume: 500,
                  autoWateringEnabled: true,
                  latitude: DEFAULT_GARDEN_LATITUDE,
                  updatedAt: new Date().toISOString(),
                }).catch((err) =>
                  logFirestoreError(err, OperationType.CREATE, `users/${firebaseUser.uid}/settings/irrigation`)
                );
              }
            },
            (error) => {
              logFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}/settings/irrigation`);
            }
          );
          unsubs.push(unsubSettings);

          // 3. Real-Time Custom Plants Listener (/users/{userId}/plants)
          const plantsCol = collection(db, 'users', firebaseUser.uid, 'plants');
          console.log('[Firestore] custom plants listener active');
          const unsubPlants = onSnapshot(
            plantsCol,
            (snapshot) => {
              const liveCustomPlants: Plant[] = snapshot.docs.map((docSnap) => {
                const d = docSnap.data();
                return createCustomPlantObject({
                  id: docSnap.id,
                  name: d?.name || 'Custom Plant',
                  category: d?.category || 'Other',
                  growthStage: d?.growthStage || 'Vegetative',
                  moisturePreference: d?.moisturePreference || 'Moderate',
                  minMoisture: typeof d?.minMoisture === 'number' ? d.minMoisture : undefined,
                  targetMoisture: typeof d?.targetMoisture === 'number' ? d.targetMoisture : undefined,
                  maxMoisture: typeof d?.maxMoisture === 'number' ? d.maxMoisture : undefined,
                  defaultWateringVolume: typeof d?.defaultWateringVolume === 'number' ? d.defaultWateringVolume : undefined,
                  kc: typeof d?.kc === 'number' ? d.kc : null,
                  notes: d?.notes || '',
                  userId: d?.userId || firebaseUser.uid,
                  createdAt: d?.createdAt,
                  updatedAt: d?.updatedAt,
                });
              });

              // Reverse-chronological or by creation date
              liveCustomPlants.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

              setCustomPlants(liveCustomPlants);
              customPlantsRef.current = liveCustomPlants;

              // Check if any plants have areaM2 defined and keep plantAreas synchronized
              const foundAreas: PlantAreaItem[] = snapshot.docs
                .filter((d) => typeof d.data()?.areaM2 === 'number')
                .map((docSnap) => ({
                  id: docSnap.id,
                  name: docSnap.data()?.name || docSnap.id,
                  areaM2: docSnap.data().areaM2,
                }));
              if (foundAreas.length > 0) {
                setPlantAreas(foundAreas);
              }

              // If the currently selected plant is custom, refresh its reference with any newly edited info
              if (selectedPlantRef.current?.isCustom) {
                const updatedActive = liveCustomPlants.find((p) => p.id === selectedPlantRef.current.id);
                if (updatedActive) {
                  setSelectedPlantState(updatedActive);
                  selectedPlantRef.current = updatedActive;
                }
              }
            },
            (error) => {
              logFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}/plants`);
            }
          );
          unsubs.push(unsubPlants);

          // 4. Real-Time History Listener (/users/{userId}/history)
          const historyCol = collection(db, 'users', firebaseUser.uid, 'history');
          console.log('[Firestore] history listener active');
          const unsubHistory = onSnapshot(
            historyCol,
            (snapshot) => {
              const events: HistoryEvent[] = snapshot.docs.map((docSnap) => {
                const d = docSnap.data();
                return {
                  id: docSnap.id,
                  timestamp: d?.timestamp || 'Just now',
                  waterDelivered: typeof d?.waterDelivered === 'number' ? d.waterDelivered : 0,
                  targetVolume: typeof d?.targetVolume === 'number' ? d.targetVolume : 500,
                  durationMinutes: typeof d?.durationMinutes === 'number' ? d.durationMinutes : 1,
                  status: d?.status || 'complete',
                  statusLabel: d?.statusLabel || (d?.status === 'complete' ? '✓ Complete' : '⚠ Interrupted'),
                  notes: d?.notes || '',
                  plantName: d?.plantName || 'Tomato (San Marzano)',
                  stage: (d?.stage as GrowthStage) || 'Vegetative',
                };
              });

              // Order reverse-chronologically
              events.sort((a, b) => b.id.localeCompare(a.id));

              setHistory(events);

              // Update graph points and timeline automatically
              if (events.length > 0) {
                const newGraphPoints: GraphDataPoint[] = events.slice(0, 8).map((evt) => ({
                  timeLabel: evt.timestamp,
                  soilMoisture: evt.status === 'complete' ? 44 : 32,
                  pumpState: true,
                  event: evt,
                }));
                setGraphPoints(newGraphPoints);

                // Update timeline stream with latest verified cycle milestones
                const historyTimeline: TimelineEntry[] = events.slice(0, 5).flatMap((evt) => [
                  {
                    id: `tl-${evt.id}-status`,
                    timestamp: evt.timestamp,
                    message:
                      evt.status === 'complete'
                        ? 'Watering Completed ✓'
                        : `${evt.statusLabel} at ${evt.waterDelivered} mL`,
                    type: evt.status === 'complete' ? 'complete' : evt.status === 'fault' ? 'fault' : 'warning',
                  },
                  {
                    id: `tl-${evt.id}-vol`,
                    timestamp: evt.timestamp,
                    message: `${evt.waterDelivered} mL Delivered`,
                    type: 'progress',
                  },
                ]);
                if (historyTimeline.length > 0) {
                  setTimeline(historyTimeline);
                }
              }
            },
            (error) => {
              logFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}/history`);
            }
          );
          unsubs.push(unsubHistory);

          // 4. Real-Time Alerts Listener (/users/{userId}/alerts)
          const alertsCol = collection(db, 'users', firebaseUser.uid, 'alerts');
          console.log('[Firestore] alerts listener active');
          const unsubAlerts = onSnapshot(
            alertsCol,
            (snapshot) => {
              const liveAlerts: ToastAlert[] = snapshot.docs.map((docSnap) => {
                const d = docSnap.data();
                return {
                  id: docSnap.id,
                  title: d?.title || 'System Notification',
                  message: d?.message || '',
                  type: (d?.type as ToastAlert['type']) || 'info',
                  timestamp: d?.timestamp || getFormattedTime(),
                };
              });

              setAlerts(liveAlerts);
            },
            (error) => {
              logFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}/alerts`);
            }
          );
          unsubs.push(unsubAlerts);

          // 5. Real-Time ET History Listener (/users/{userId}/etHistory)
          const etCol = collection(db, 'users', firebaseUser.uid, 'etHistory');
          console.log('[Firestore] etHistory listener active');
          const unsubEt = onSnapshot(
            etCol,
            (snapshot) => {
              const liveEtRecords: DailyETRecord[] = snapshot.docs.map((docSnap) => {
                const d = docSnap.data();
                const tmax = typeof d?.tmax === 'number' ? d.tmax : 0;
                const tmin = typeof d?.tmin === 'number' ? d.tmin : 0;
                const tmean = typeof d?.tmean === 'number' ? d.tmean : 0;
                const ra = typeof d?.ra === 'number' ? d.ra : 0;
                const et0 = typeof d?.et0 === 'number' ? d.et0 : 0;

                return {
                  id: docSnap.id,
                  date: d?.date || docSnap.id,
                  dayOfYear: typeof d?.dayOfYear === 'number' ? d.dayOfYear : 1,
                  latitude: typeof d?.latitude === 'number' ? d.latitude : latitudeRef.current,
                  Tmax: tmax,
                  Tmin: tmin,
                  Tmean: tmean,
                  Ra: ra,
                  ET0: et0,
                  tmax,
                  tmin,
                  tmean,
                  ra,
                  et0,
                  isValid: true,
                  userId: d?.userId || firebaseUser.uid,
                  createdAt: d?.createdAt,
                  updatedAt: d?.updatedAt,
                };
              });

              liveEtRecords.sort((a, b) => a.date.localeCompare(b.date));
              setEtHistory(liveEtRecords);

              const todayStr = new Date().toISOString().split('T')[0];
              const todayMatch = liveEtRecords.find((r) => r.date === todayStr);
              if (todayMatch) {
                setTodayET(todayMatch);
              }
            },
            (error) => {
              logFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}/etHistory`);
            }
          );
          unsubs.push(unsubEt);
        } catch (err) {
          console.error('Failed to initialize authenticated user data from Firestore:', err);
        }
      } else {
        if (!isDemoMode) {
          setIsLoggedIn(false);
          setCurrentUser(null);
          setHistory([]);
          setAlerts([]);
          setCustomPlants([]);
          setEtHistory([]);
          setTodayET(calculateHargreavesET0(null, null, latitudeRef.current, new Date()));
        }
      }
      setAuthLoading(false);
    });

    return () => {
      unsubscribeAuth();
      cleanupListeners();
    };
  }, [isDemoMode]);

  // Sign In with Firebase Authentication
  const signInWithEmail = async (email: string, pass: string): Promise<boolean> => {
    setLoginLoading(true);
    setLoginError(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
      addAlert('Signed In', 'Connected to Nurtura cloud controller.', 'success');
      setCurrentTab('dashboard');
      return true;
    } catch (err: unknown) {
      console.error('Firebase Auth signIn error:', err);
      const code = (err as { code?: string })?.code || '';
      const rawMessage = (err as { message?: string })?.message || '';
      const message = getAuthErrorMessage(code, rawMessage);
      setLoginError(message);
      return false;
    } finally {
      setLoginLoading(false);
    }
  };

  // Create Account with Firebase Authentication & Firestore User Profile
  const signUpWithEmail = async (email: string, pass: string, displayName?: string): Promise<boolean> => {
    setLoginLoading(true);
    setLoginError(null);

    if (pass.length < 6) {
      setLoginError('Password must be at least 6 characters.');
      setLoginLoading(false);
      return false;
    }

    try {
      console.log('Initiating createUserWithEmailAndPassword for:', email.trim());
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      const user = userCredential.user;
      console.log('User created successfully in Firebase Auth, UID:', user.uid);
      const cleanName = displayName?.trim() || email.split('@')[0];

      // 1. Create User Document in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userPayload = {
        id: user.uid,
        email: user.email || email.trim(),
        displayName: cleanName,
        role: 'Garden Administrator',
        controllerNodeId: 'balc-esp32-node1',
        createdAt: new Date().toISOString(),
      };
      try {
        await setDoc(userDocRef, userPayload);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}`);
      }

      // 2. Create Initial Settings Document in Firestore
      const settingsRef = doc(db, 'users', user.uid, 'settings', 'irrigation');
      try {
        await setDoc(settingsRef, {
          userId: user.uid,
          selectedPlantId: 'tomato',
          selectedStage: 'Vegetative',
          targetVolume: 500,
          autoWateringEnabled: true,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/settings/irrigation`);
      }

      // 3. Seed an initial verified calibration cycle
      const historyCol = collection(db, 'users', user.uid, 'history');
      try {
        await addDoc(historyCol, {
          userId: user.uid,
          waterDelivered: 500,
          targetVolume: 500,
          durationMinutes: 6,
          status: 'complete',
          statusLabel: '✓ Complete',
          notes: 'Initial factory flow calibration verified at 82 mL/min.',
          plantName: 'Tomato (San Marzano)',
          stage: 'Vegetative',
          timestamp: getFormattedTime(),
          createdAt: new Date().toISOString(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}/history`);
      }

      setCurrentUser({
        name: cleanName,
        email: user.email || '',
        role: 'Garden Administrator',
        controllerNodeId: 'balc-esp32-node1',
      });

      // New user registration -> Trigger TerraFlux First-Time Setup Wizard
      setIsSetupCompleted(false);
      setIsSetupWizardOpen(true);

      addAlert('Account Created', 'Welcome to TerraFlux! Let us set up your garden.', 'success');
      setCurrentTab('dashboard');
      return true;
    } catch (err: unknown) {
      console.error('Firebase Auth signUp error:', err);
      const code = (err as { code?: string })?.code || '';
      const rawMessage = (err as { message?: string })?.message || '';
      const message = getAuthErrorMessage(code, rawMessage);
      setLoginError(message);
      return false;
    } finally {
      setLoginLoading(false);
    }
  };

  // Backwards-compatible password login handler
  const loginWithPassword = (email: string, pass: string): boolean => {
    signInWithEmail(email, pass);
    return true;
  };

  // Demo Mode login (fully isolated from real Firebase data)
  const loginAsDemo = () => {
    setLoginLoading(true);
    setLoginError(null);
    setFlowConditionState('normal');
    setPresenceDetectedState(false);
    setTimeout(() => {
      setIsDemoMode(true);
      setIsLoggedIn(true);
      setIsSetupCompleted(true);
      setIsSetupWizardOpen(false);
      setGardenSetup({
        setupCompleted: true,
        plantCount: 6,
        latitude: DEFAULT_GARDEN_LATITUDE,
        longitude: 78.1460,
        locationSource: 'simulated',
        locationUpdatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setPlantAreas([
        { id: 'plant1', name: 'Plant 1', areaM2: 0.25 },
        { id: 'plant2', name: 'Plant 2', areaM2: 0.30 },
        { id: 'plant3', name: 'Plant 3', areaM2: 0.20 },
        { id: 'plant4', name: 'Plant 4', areaM2: 0.25 },
        { id: 'plant5', name: 'Plant 5', areaM2: 0.35 },
        { id: 'plant6', name: 'Plant 6', areaM2: 0.25 },
      ]);
      setCurrentUser({
        name: 'Elena Vance (Demo)',
        email: 'demo@nurtura.local',
        role: 'Garden Administrator',
        controllerNodeId: 'balc-esp32-node1',
      });
      setHistory(INITIAL_HISTORY);
      const demoCalc = calculateHargreavesET0(33.2, 21.8, latitudeRef.current, new Date());
      demoCalc.isDemo = true;
      setTodayET(demoCalc);
      setEtHistory(generateDemoETHistory(latitudeRef.current, 30));
      setCurrentTab('dashboard');
      addAlert('Demo Mode Active', 'Operating on local simulation without cloud sync.', 'info');
      setLoginLoading(false);
    }, 400);
  };

  // Sign out
  const logout = async () => {
    if (auth.currentUser) {
      await signOut(auth);
    }
    setIsLoggedIn(false);
    setIsDemoMode(false);
    setCurrentUser(null);
    setHistory([]);
    setAlerts([]);
    setCustomPlants([]);
    setEtHistory([]);
    setTodayET(calculateHargreavesET0(null, null, latitudeRef.current, new Date()));
    setCurrentTab('dashboard');
  };

  // Save watering event to Firestore (or local state in Demo Mode)
  const saveWateringEvent = async (event: HistoryEvent) => {
    if (isDemoMode || !auth.currentUser) {
      setHistory((prev) => [event, ...prev]);
      return;
    }

    try {
      const historyCol = collection(db, 'users', auth.currentUser.uid, 'history');
      await addDoc(historyCol, {
        userId: auth.currentUser.uid,
        waterDelivered: event.waterDelivered,
        targetVolume: event.targetVolume,
        durationMinutes: event.durationMinutes,
        status: event.status,
        statusLabel: event.statusLabel,
        notes: event.notes || '',
        plantName: event.plantName,
        stage: event.stage,
        timestamp: event.timestamp,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${auth.currentUser.uid}/history`);
    }
  };

  // Plant and Stage selection with Firestore persistence
  const updatePlantAndStage = (plant: Plant, stage: GrowthStage) => {
    const profile = plant.stages[stage];
    setSensors((prev) => ({
      ...prev,
      targetVolume: profile.targetWaterMl,
    }));
  };

  const setSelectedPlant = async (plant: Plant) => {
    setSelectedPlantState(plant);
    updatePlantAndStage(plant, selectedStage);
    evaluateRecommendation(sensors.soilMoisture, plant, selectedStage, sensors.rainDetected);

    if (!isDemoMode && auth.currentUser) {
      try {
        const settingsRef = doc(db, 'users', auth.currentUser.uid, 'settings', 'irrigation');
        await setDoc(
          settingsRef,
          {
            userId: auth.currentUser.uid,
            selectedPlantId: plant.id,
            selectedStage: selectedStage,
            targetVolume: plant.stages[selectedStage].targetWaterMl,
            autoWateringEnabled: sensors.autoWateringEnabled,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${auth.currentUser.uid}/settings/irrigation`);
      }
    }
  };

  const setSelectedStage = async (stage: GrowthStage) => {
    setSelectedStageState(stage);
    updatePlantAndStage(selectedPlant, stage);
    evaluateRecommendation(sensors.soilMoisture, selectedPlant, stage, sensors.rainDetected);

    if (!isDemoMode && auth.currentUser) {
      try {
        const settingsRef = doc(db, 'users', auth.currentUser.uid, 'settings', 'irrigation');
        await setDoc(
          settingsRef,
          {
            userId: auth.currentUser.uid,
            selectedPlantId: selectedPlant.id,
            selectedStage: stage,
            targetVolume: selectedPlant.stages[stage].targetWaterMl,
            autoWateringEnabled: sensors.autoWateringEnabled,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${auth.currentUser.uid}/settings/irrigation`);
      }
    }
  };

  // Add Custom Plant
  const addCustomPlant = async (input: CustomPlantInput): Promise<Plant> => {
    const timestamp = new Date().toISOString();
    const tempId = `custom-plant-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const newPlantDoc = {
      name: input.name,
      category: input.category,
      growthStage: input.growthStage,
      moisturePreference: input.moisturePreference,
      minMoisture: input.minMoisture,
      targetMoisture: input.targetMoisture,
      maxMoisture: input.maxMoisture,
      defaultWateringVolume: input.defaultWateringVolume,
      kc: input.kc ?? null,
      notes: input.notes || '',
      createdAt: timestamp,
      updatedAt: timestamp,
      isCustom: true,
      userId: auth.currentUser?.uid || 'demo-user',
    };

    if (!isDemoMode && auth.currentUser) {
      const plantsCol = collection(db, 'users', auth.currentUser.uid, 'plants');
      const docRef = await addDoc(plantsCol, newPlantDoc);
      const createdObj = createCustomPlantObject({
        id: docRef.id,
        ...newPlantDoc,
      });
      addAlert('🌱 Plant added successfully', `${createdObj.name} has been saved to your garden profile.`, 'success');
      return createdObj;
    } else {
      // Demo mode fallback
      const createdObj = createCustomPlantObject({
        id: tempId,
        ...newPlantDoc,
      });
      setCustomPlants((prev) => [createdObj, ...prev]);
      addAlert('🌱 Plant added successfully', `${createdObj.name} has been added to My Plants.`, 'success');
      return createdObj;
    }
  };

  // Update Custom Plant
  const updateCustomPlant = async (plantId: string, input: CustomPlantInput): Promise<Plant> => {
    const timestamp = new Date().toISOString();
    const updatePayload = {
      name: input.name,
      category: input.category,
      growthStage: input.growthStage,
      moisturePreference: input.moisturePreference,
      minMoisture: input.minMoisture,
      targetMoisture: input.targetMoisture,
      maxMoisture: input.maxMoisture,
      defaultWateringVolume: input.defaultWateringVolume,
      kc: input.kc ?? null,
      notes: input.notes || '',
      updatedAt: timestamp,
    };

    if (!isDemoMode && auth.currentUser) {
      const plantDocRef = doc(db, 'users', auth.currentUser.uid, 'plants', plantId);
      await setDoc(plantDocRef, updatePayload, { merge: true });
      const updatedObj = createCustomPlantObject({
        id: plantId,
        ...updatePayload,
        userId: auth.currentUser.uid,
      });
      addAlert('Plant updated', `${updatedObj.name} specifications have been refreshed.`, 'info');
      return updatedObj;
    } else {
      let updatedObj: Plant | null = null;
      setCustomPlants((prev) =>
        prev.map((p) => {
          if (p.id === plantId) {
            updatedObj = createCustomPlantObject({
              id: plantId,
              ...updatePayload,
              createdAt: p.createdAt,
            });
            return updatedObj;
          }
          return p;
        })
      );
      if (selectedPlant.id === plantId && updatedObj) {
        setSelectedPlantState(updatedObj);
        updatePlantAndStage(updatedObj, selectedStage);
      }
      addAlert('Plant updated', `Plant specifications have been refreshed.`, 'info');
      return updatedObj || (selectedPlant as Plant);
    }
  };

  // Delete Custom Plant
  const deleteCustomPlant = async (plantId: string): Promise<void> => {
    // If the plant being deleted is currently active, fall back cleanly to default plant
    if (selectedPlant.id === plantId) {
      const fallback = PLANTS[0];
      setSelectedPlantState(fallback);
      updatePlantAndStage(fallback, 'Vegetative');
      if (!isDemoMode && auth.currentUser) {
        const settingsRef = doc(db, 'users', auth.currentUser.uid, 'settings', 'irrigation');
        setDoc(
          settingsRef,
          {
            selectedPlantId: fallback.id,
            selectedStage: 'Vegetative',
            targetVolume: fallback.stages.Vegetative.targetWaterMl,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        ).catch(() => {});
      }
    }

    if (!isDemoMode && auth.currentUser) {
      const plantDocRef = doc(db, 'users', auth.currentUser.uid, 'plants', plantId);
      await deleteDoc(plantDocRef);
      addAlert('Plant removed', 'The custom plant profile was deleted from your list.', 'info');
    } else {
      setCustomPlants((prev) => prev.filter((p) => p.id !== plantId));
      addAlert('Plant removed', 'The custom plant profile was removed.', 'info');
    }
  };

  // Persist daily ET calculation to Firestore
  const persistEtToFirestore = useCallback(async (rec: ETCalculationResult) => {
    if (!isDemoMode && auth.currentUser && rec.isValid) {
      try {
        const etDocRef = doc(db, 'users', auth.currentUser.uid, 'etHistory', rec.date);
        await setDoc(
          etDocRef,
          {
            userId: auth.currentUser.uid,
            date: rec.date,
            dayOfYear: rec.dayOfYear,
            latitude: rec.latitude,
            tmax: rec.tmax,
            tmin: rec.tmin,
            tmean: rec.tmean,
            ra: rec.ra,
            et0: rec.et0,
            updatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (err) {
        logFirestoreError(err, OperationType.CREATE, `users/${auth.currentUser.uid}/etHistory/${rec.date}`);
      }
    }
  }, [isDemoMode]);

  // Track continuous DHT22 temperature extrema
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    setDailyTemps((prev) => {
      if (prev.date !== todayStr) {
        return {
          date: todayStr,
          tmin: sensors.temperature,
          tmax: sensors.temperature,
          samples: 1,
        };
      }
      const newMin = prev.tmin !== null ? Math.min(prev.tmin, sensors.temperature) : sensors.temperature;
      const newMax = prev.tmax !== null ? Math.max(prev.tmax, sensors.temperature) : sensors.temperature;
      return {
        date: todayStr,
        tmin: newMin,
        tmax: newMax,
        samples: prev.samples + 1,
      };
    });
  }, [sensors.temperature]);

  // Re-evaluate ET₀ calculation
  const refreshET = useCallback(() => {
    if (isDemoMode) {
      const demoCalc = calculateHargreavesET0(33.2, 21.8, latitudeRef.current, new Date());
      demoCalc.isDemo = true;
      setTodayET(demoCalc);
    } else {
      if (
        dailyTemps.samples >= 2 &&
        dailyTemps.tmax !== null &&
        dailyTemps.tmin !== null &&
        dailyTemps.tmax > dailyTemps.tmin
      ) {
        const result = calculateHargreavesET0(dailyTemps.tmax, dailyTemps.tmin, latitudeRef.current, new Date());
        setTodayET(result);
        if (result.isValid && auth.currentUser) {
          persistEtToFirestore(result);
        }
      } else {
        setTodayET(calculateHargreavesET0(null, null, latitudeRef.current, new Date()));
      }
    }
  }, [isDemoMode, dailyTemps, persistEtToFirestore]);

  useEffect(() => {
    refreshET();
  }, [refreshET]);

  // Update user garden latitude
  const updateUserLatitude = async (newLat: number): Promise<void> => {
    if (typeof newLat !== 'number' || isNaN(newLat) || newLat < -90 || newLat > 90) {
      throw new Error('Latitude must be a valid number between -90° and +90°');
    }
    const cleanLat = Number(newLat.toFixed(4));
    setLatitude(cleanLat);
    latitudeRef.current = cleanLat;

    if (isDemoMode) {
      const demoCalc = calculateHargreavesET0(33.2, 21.8, cleanLat, new Date());
      demoCalc.isDemo = true;
      setTodayET(demoCalc);
      setEtHistory(generateDemoETHistory(cleanLat, 30));
    } else {
      if (
        dailyTemps.samples >= 2 &&
        dailyTemps.tmax !== null &&
        dailyTemps.tmin !== null &&
        dailyTemps.tmax > dailyTemps.tmin
      ) {
        const recalculated = calculateHargreavesET0(dailyTemps.tmax, dailyTemps.tmin, cleanLat, new Date());
        setTodayET(recalculated);
        if (auth.currentUser) persistEtToFirestore(recalculated);
      }
      if (auth.currentUser) {
        const settingsRef = doc(db, 'users', auth.currentUser.uid, 'settings', 'irrigation');
        setDoc(settingsRef, { latitude: cleanLat, updatedAt: new Date().toISOString() }, { merge: true }).catch((err) =>
          logFirestoreError(err, OperationType.CREATE, `users/${auth.currentUser?.uid}/settings/irrigation`)
        );
      }
    }

    addAlert('Location Calibrated', `Garden latitude calibrated to ${cleanLat.toFixed(4)}°.`, 'info');
  };

  // Complete Garden Setup Handler (TerraFlux First-Time Setup & Re-calibration)
  const completeGardenSetup = async (config: {
    plantCount: number;
    plantAreas: PlantAreaItem[];
    latitude: number;
    longitude: number;
    locationSource: 'browser_geolocation' | 'manual' | 'simulated';
  }) => {
    const nowIso = new Date().toISOString();
    const cleanLat = Number(config.latitude.toFixed(4));
    const cleanLng = Number(config.longitude.toFixed(4));

    setLatitude(cleanLat);
    latitudeRef.current = cleanLat;
    setGardenSetup({
      setupCompleted: true,
      plantCount: config.plantCount,
      latitude: cleanLat,
      longitude: cleanLng,
      locationSource: config.locationSource,
      locationUpdatedAt: nowIso,
      createdAt: nowIso,
      updatedAt: nowIso,
    });
    setPlantAreas(config.plantAreas);
    setIsSetupCompleted(true);
    setIsSetupWizardOpen(false);

    if (isDemoMode || !auth.currentUser) {
      const demoCalc = calculateHargreavesET0(33.2, 21.8, cleanLat, new Date());
      demoCalc.isDemo = true;
      setTodayET(demoCalc);
      setEtHistory(generateDemoETHistory(cleanLat, 30));
      addAlert('Setup Complete', `TerraFlux garden configured with ${config.plantCount} plants.`, 'success');
      return;
    }

    const uid = auth.currentUser.uid;
    try {
      // 1. Store users/{uid}/setup/config
      const setupDocRef = doc(db, 'users', uid, 'setup', 'config');
      await setDoc(
        setupDocRef,
        {
          userId: uid,
          setupCompleted: true,
          plantCount: config.plantCount,
          latitude: cleanLat,
          longitude: cleanLng,
          locationSource: config.locationSource,
          locationUpdatedAt: nowIso,
          updatedAt: nowIso,
          createdAt: nowIso,
        },
        { merge: true }
      );

      // 2. Store on users/{uid} root profile
      const userDocRef = doc(db, 'users', uid);
      await setDoc(
        userDocRef,
        {
          setupCompleted: true,
          plantCount: config.plantCount,
          latitude: cleanLat,
          longitude: cleanLng,
          setup: {
            setupCompleted: true,
            plantCount: config.plantCount,
            latitude: cleanLat,
            longitude: cleanLng,
            locationSource: config.locationSource,
            locationUpdatedAt: nowIso,
          },
        },
        { merge: true }
      );

      // 3. Store individual plants in users/{uid}/plants/{plantId}
      for (const p of config.plantAreas) {
        const plantRef = doc(db, 'users', uid, 'plants', p.id);
        await setDoc(
          plantRef,
          {
            id: p.id,
            name: p.name || `Plant ${p.id.replace('plant', '')}`,
            areaM2: p.areaM2,
            userId: uid,
            category: 'Vegetable',
            growthStage: 'Vegetative',
            moisturePreference: 'Moderate',
            isCustom: true,
            updatedAt: nowIso,
            createdAt: nowIso,
          },
          { merge: true }
        );
      }

      // 4. Update settings with latitude for Hargreaves-Samani ET0
      const settingsRef = doc(db, 'users', uid, 'settings', 'irrigation');
      await setDoc(
        settingsRef,
        {
          latitude: cleanLat,
          plantCount: config.plantCount,
          updatedAt: nowIso,
        },
        { merge: true }
      );

      // Recalculate ET0 with the newly saved latitude
      refreshET();

      addAlert(
        'Garden Setup Complete',
        `TerraFlux garden calibrated with ${config.plantCount} plants at ${cleanLat}° N, ${cleanLng}° E.`,
        'success'
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}/setup/config`);
    }
  };

  // Save interim acquired geolocation to existing Firebase user setup structure
  const saveAcquiredLocation = async (coords: {
    latitude: number;
    longitude: number;
    plantCount?: number;
  }) => {
    const cleanLat = Number(coords.latitude.toFixed(4));
    const cleanLng = Number(coords.longitude.toFixed(4));
    setLatitude(cleanLat);
    latitudeRef.current = cleanLat;

    if (isDemoMode || !auth.currentUser) {
      return;
    }

    const uid = auth.currentUser.uid;
    const nowIso = new Date().toISOString();
    const count = coords.plantCount || gardenSetup?.plantCount || 6;

    try {
      // 1. users/{uid}/setup/config
      const setupDocRef = doc(db, 'users', uid, 'setup', 'config');
      await setDoc(
        setupDocRef,
        {
          userId: uid,
          setupCompleted: false,
          plantCount: count,
          latitude: cleanLat,
          longitude: cleanLng,
          locationSource: 'browser_geolocation',
          locationUpdatedAt: serverTimestamp(),
          updatedAt: nowIso,
        },
        { merge: true }
      );

      // 2. users/{uid} root profile document
      const userDocRef = doc(db, 'users', uid);
      await setDoc(
        userDocRef,
        {
          latitude: cleanLat,
          longitude: cleanLng,
          setup: {
            setupCompleted: false,
            plantCount: count,
            latitude: cleanLat,
            longitude: cleanLng,
            locationSource: 'browser_geolocation',
            locationUpdatedAt: nowIso,
          },
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Could not save interim location coordinates to Firebase:', err);
    }
  };

  // Recommendation evaluation
  const evaluateRecommendation = (
    moisture: number,
    plant: Plant,
    stage: GrowthStage,
    rain: boolean
  ) => {
    if (status === 'WATERING' || status === 'STARTING') {
      return;
    }

    const stageProfile = plant.stages[stage];

    if (rain) {
      setStatus('WATERING_DELAYED');
      setStatusReason('Rain has been detected, so watering is currently not recommended.');
      return;
    }

    if (moisture < stageProfile.minMoisture) {
      setStatus('WATERING_RECOMMENDED');
      setStatusReason(`Soil moisture (${moisture}%) has fallen below the preferred level (${stageProfile.minMoisture}%).`);
    } else {
      setStatus('IDLE');
      setStatusReason(`Your plant currently has sufficient moisture (${moisture}%). Target range is ${stageProfile.minMoisture}% - ${stageProfile.maxMoisture}%.`);
    }
  };

  // Ambient sensor drift simulation
  useEffect(() => {
    const ambientInterval = window.setInterval(() => {
      setSensors((prev) => {
        const tempDrift = (Math.random() - 0.48) * 0.12;
        const newTemp = Math.round((prev.temperature + tempDrift) * 10) / 10;
        const clampedTemp = Math.max(27.5, Math.min(29.5, newTemp));

        const humDrift = (Math.random() - 0.5) * 0.35;
        const newHum = Math.round(prev.humidity + humDrift);
        const clampedHum = Math.max(62, Math.min(72, newHum));

        const lightDrift = Math.floor((Math.random() - 0.5) * 10);
        const newLight = Math.max(700, Math.min(920, prev.lightLux + lightDrift));

        return {
          ...prev,
          temperature: clampedTemp,
          humidity: clampedHum,
          lightLux: newLight,
        };
      });
    }, 4500);

    return () => clearInterval(ambientInterval);
  }, []);

  // Automatic watering trigger
  useEffect(() => {
    if (
      sensors.autoWateringEnabled &&
      status === 'WATERING_RECOMMENDED' &&
      !sensors.rainDetected &&
      !sensors.pumpActive
    ) {
      const timer = setTimeout(() => {
        addAlert('Automatic Irrigation Triggered', 'Soil moisture dropped below threshold in Automatic Mode.', 'info');
        startWatering();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [sensors.autoWateringEnabled, status, sensors.rainDetected, sensors.pumpActive]);

  // Start Watering
  const startWatering = () => {
    if (status === 'WATERING' || status === 'STARTING') return;

    if (sensors.rainDetected) {
      addAlert('Automatic watering paused', 'Rain detected. Irrigation delayed.', 'warning');
      return;
    }

    setStatus('STARTING');
    setStatusReason('Preparing irrigation system...');
    activeCycleStartTimeRef.current = Date.now();

    const currentTime = getFormattedTime();
    setTimeline((prev) => [
      {
        id: `time-${Date.now()}-start`,
        timestamp: currentTime,
        message: 'Watering Started',
        type: 'start',
      },
      ...prev,
    ]);

    startingTimeoutRef.current = window.setTimeout(() => {
      setStatusReason('Starting watering...');
      startingTimeoutRef.current = window.setTimeout(() => {
        setStatus('WATERING');
        setStatusReason('Irrigation cycle active. Monitoring flow rate and pressure.');

        const nominalFlow = sensors.noFlowActive ? 0 : sensors.lowFlowActive ? 18 : 82;

        setSensors((prev) => ({
          ...prev,
          pumpActive: true,
          deliveredVolume: 0,
          flowRate: nominalFlow,
        }));

        if (sensors.noFlowActive) {
          noFlowTimeoutRef.current = window.setTimeout(() => {
            handleNoFlowFault();
          }, Math.max(800, Math.round(2400 / (simulationSpeed / 2))));
          return;
        }

        runWaterDeliveryLoop(nominalFlow);
      }, Math.max(200, Math.round(700 / (simulationSpeed / 2))));
    }, Math.max(250, Math.round(800 / (simulationSpeed / 2))));
  };

  // Water delivery incremental loop
  const runWaterDeliveryLoop = (initialFlow: number) => {
    if (wateringIntervalRef.current) {
      clearInterval(wateringIntervalRef.current);
    }
    lowFlowWarnedRef.current = false;

    let currentDelivered = 0;
    const target = sensors.targetVolume;
    let milestoneReported220 = false;
    const intervalMs = Math.max(100, Math.round(500 / simulationSpeed));

    wateringIntervalRef.current = window.setInterval(() => {
      setSensors((currentSensors) => {
        if (currentSensors.noFlowActive || flowCondition === 'no_flow') {
          if (wateringIntervalRef.current) clearInterval(wateringIntervalRef.current);
          handleNoFlowFault();
          return currentSensors;
        }

        // Low flow warning & cutoff simulation
        if ((currentSensors.lowFlowActive || flowCondition === 'low_flow') && !lowFlowWarnedRef.current && currentDelivered >= 35) {
          lowFlowWarnedRef.current = true;
          addAlert('⚠ Low Flow Detected', 'Restricted line flow observed (18 mL/min).', 'warning');

          window.setTimeout(() => {
            if (wateringIntervalRef.current) {
              clearInterval(wateringIntervalRef.current);
              wateringIntervalRef.current = null;
            }
            setStatus('INTERRUPTED');
            setStatusReason('Watering Interrupted — Low Flow detected.');
            setSensors((s) => ({
              ...s,
              pumpActive: false,
              flowRate: 0,
            }));
            const lowFlowEvent: HistoryEvent = {
              id: `hist-${Date.now()}`,
              timestamp: getFormattedTime(),
              waterDelivered: currentDelivered,
              targetVolume: target,
              durationMinutes: 2,
              status: 'low_flow',
              statusLabel: '⚠ Low Flow',
              notes: 'Cycle stopped automatically due to sustained low flow restriction. [DEMO]',
              plantName: selectedPlant.name,
              stage: selectedStage,
            };
            saveWateringEvent(lowFlowEvent);
            addAlert('Watering Interrupted — Low Flow', `Stopped after ${currentDelivered} mL due to restricted line flow.`, 'warning');
          }, Math.max(600, Math.round(1800 / simulationSpeed)));
        }

        const flow = currentSensors.lowFlowActive || flowCondition === 'low_flow' ? 18 : 82;
        const increment = calculateVolumeIncrement(
          currentSensors.lowFlowActive || flowCondition === 'low_flow' ? 'low_flow' : 'normal',
          simulationSpeed,
          currentDelivered,
          target
        );

        const nextDelivered = Math.min(target, currentDelivered + increment);
        currentDelivered = nextDelivered;

        if (!milestoneReported220 && nextDelivered >= 220 && nextDelivered < 400) {
          milestoneReported220 = true;
          setTimeline((prev) => [
            {
              id: `time-${Date.now()}-220`,
              timestamp: getFormattedTime(),
              message: `${nextDelivered} mL Delivered`,
              type: 'progress',
            },
            ...prev,
          ]);
        }

        // Elevate soil moisture gradually without nested setState
        const nextMoisture = Math.min(65, Math.round(currentSensors.soilMoisture + (increment / target) * 16));

        if (nextDelivered >= target) {
          if (wateringIntervalRef.current) {
            clearInterval(wateringIntervalRef.current);
            wateringIntervalRef.current = null;
          }
          // Enter VERIFYING state first
          setStatus('VERIFYING');
          setStatusReason('Target reached. Conducting final sensor verification...');

          window.setTimeout(() => {
            handleTargetReached(target);
          }, Math.max(300, Math.round(700 / simulationSpeed)));

          return {
            ...currentSensors,
            deliveredVolume: target,
            pumpActive: false,
            flowRate: 0,
            soilMoisture: nextMoisture,
          };
        }

        return {
          ...currentSensors,
          deliveredVolume: nextDelivered,
          flowRate: flow,
          soilMoisture: nextMoisture,
        };
      });
    }, intervalMs);
  };

  // Target Reached
  const handleTargetReached = (finalVolume: number) => {
    const currentTime = getFormattedTime();
    const durationMinutes = Math.max(
      1,
      Math.round((Date.now() - activeCycleStartTimeRef.current) / 60000) || 7
    );

    setStatus('COMPLETED');
    setStatusReason(`${finalVolume} mL delivered successfully. Irrigation Verified.`);

    const postMoisture = Math.min(62, Math.max(48, Math.round(selectedPlant.stages[selectedStage].minMoisture + 12)));

    setSensors((prev) => ({
      ...prev,
      pumpActive: false,
      flowRate: 0,
      deliveredVolume: finalVolume,
      soilMoisture: postMoisture,
    }));

    const newEvent: HistoryEvent = {
      id: `hist-${Date.now()}`,
      timestamp: currentTime,
      waterDelivered: finalVolume,
      targetVolume: finalVolume,
      durationMinutes,
      status: 'complete',
      statusLabel: '✓ Complete',
      notes: `Target volume achieved with nominal 82 mL/min delivery. Soil moisture elevated to ${postMoisture}%.`,
      plantName: selectedPlant.name,
      stage: selectedStage,
    };

    saveWateringEvent(newEvent);

    setTimeline((prev) => [
      {
        id: `time-${Date.now()}-done`,
        timestamp: currentTime,
        message: 'Watering Completed ✓',
        type: 'complete',
      },
      {
        id: `time-${Date.now()}-target`,
        timestamp: currentTime,
        message: `${finalVolume} mL Delivered`,
        type: 'progress',
      },
      ...prev,
    ]);

    setGraphPoints((prev) => [
      ...prev,
      {
        timeLabel: currentTime,
        soilMoisture: postMoisture,
        pumpState: false,
        event: newEvent,
      },
    ]);

    addAlert('Watering Complete ✓', `${finalVolume} mL delivered successfully. Plant is healthy and happy.`, 'success');
  };

  // Manual stop
  const requestStopWatering = () => {
    setIsStopModalOpen(true);
  };

  const cancelStopWatering = () => {
    setIsStopModalOpen(false);
  };

  const confirmStopWatering = () => {
    setIsStopModalOpen(false);

    if (wateringIntervalRef.current) {
      clearInterval(wateringIntervalRef.current);
      wateringIntervalRef.current = null;
    }
    if (startingTimeoutRef.current) clearTimeout(startingTimeoutRef.current);
    if (noFlowTimeoutRef.current) clearTimeout(noFlowTimeoutRef.current);

    const stoppedVolume = sensors.deliveredVolume || 320;
    const currentTime = getFormattedTime();
    const durationMinutes = Math.max(1, Math.round((Date.now() - activeCycleStartTimeRef.current) / 60000) || 5);

    setStatus('INTERRUPTED');
    setStatusReason(`${stoppedVolume} mL delivered before watering was stopped.`);

    setSensors((prev) => ({
      ...prev,
      pumpActive: false,
      flowRate: 0,
      deliveredVolume: stoppedVolume,
    }));

    const interruptedEvent: HistoryEvent = {
      id: `hist-${Date.now()}`,
      timestamp: currentTime,
      waterDelivered: stoppedVolume,
      targetVolume: sensors.targetVolume,
      durationMinutes,
      status: 'interrupted',
      statusLabel: '⚠ Interrupted',
      notes: `${stoppedVolume} mL delivered of ${sensors.targetVolume} mL target before user manual stop.`,
      plantName: selectedPlant.name,
      stage: selectedStage,
    };

    saveWateringEvent(interruptedEvent);

    setTimeline((prev) => [
      {
        id: `time-${Date.now()}-stopped`,
        timestamp: currentTime,
        message: `Watering Interrupted at ${stoppedVolume} mL`,
        type: 'warning',
      },
      ...prev,
    ]);

    setGraphPoints((prev) => [
      ...prev,
      {
        timeLabel: currentTime,
        soilMoisture: sensors.soilMoisture,
        pumpState: false,
        event: interruptedEvent,
      },
    ]);

    addAlert('⚠ Watering Interrupted', `${stoppedVolume} mL delivered before watering was stopped.`, 'warning');
  };

  // No-Flow Fault handling
  const handleNoFlowFault = () => {
    if (wateringIntervalRef.current) {
      clearInterval(wateringIntervalRef.current);
      wateringIntervalRef.current = null;
    }

    const currentTime = getFormattedTime();

    setStatus('FAULT');
    setStatusReason('Watering started, but water delivery was not detected. Check water supply or irrigation path.');

    setSensors((prev) => ({
      ...prev,
      pumpActive: false,
      flowRate: 0,
      noFlowActive: true,
    }));

    const faultEvent: HistoryEvent = {
      id: `hist-${Date.now()}`,
      timestamp: currentTime,
      waterDelivered: 0,
      targetVolume: sensors.targetVolume,
      durationMinutes: 1,
      status: 'fault',
      statusLabel: '⚠ No Flow',
      notes: 'Pump powered on but line sensor registered 0 mL/min delivery. Safety cutoff engaged.',
      plantName: selectedPlant.name,
      stage: selectedStage,
    };

    saveWateringEvent(faultEvent);

    setTimeline((prev) => [
      {
        id: `time-${Date.now()}-fault`,
        timestamp: currentTime,
        message: '⚠ No Water Flow Detected — Pump Halted',
        type: 'fault',
      },
      ...prev,
    ]);

    addAlert('⚠ No Water Flow Detected', 'Watering started, but water delivery was not detected.', 'error');
  };

  // Diagnostic calibration tools (for offline simulation & field testing)
  const makeSoilDry = () => {
    let step = 0;
    const values = [35, 28, 22];

    const stepInterval = setInterval(() => {
      if (step < values.length) {
        const val = values[step];
        setSensors((prev) => ({ ...prev, soilMoisture: val }));
        step++;
      } else {
        clearInterval(stepInterval);
        evaluateRecommendation(22, selectedPlant, selectedStage, sensors.rainDetected);
        addAlert('Soil Moisture Low', 'Moisture dropped to 22%. Plant is crying and needs water!', 'warning');
      }
    }, 350);
  };

  const makeSoilWet = () => {
    let step = 0;
    const values = [35, 48, 60];

    const stepInterval = setInterval(() => {
      if (step < values.length) {
        const val = values[step];
        setSensors((prev) => ({ ...prev, soilMoisture: val }));
        step++;
      } else {
        clearInterval(stepInterval);
        evaluateRecommendation(60, selectedPlant, selectedStage, sensors.rainDetected);
        addAlert('Soil Hydrated', 'Moisture reached 60%. Plant is happy and thriving!', 'info');
      }
    }, 350);
  };

  const makeSoilNormal = () => {
    setSensors((prev) => ({ ...prev, soilMoisture: 42 }));
    evaluateRecommendation(42, selectedPlant, selectedStage, sensors.rainDetected);
    addAlert('Moisture Balanced', 'Moisture calibrated at 42%. Plant is content.', 'info');
  };

  const simulateRain = () => {
    setSensors((prev) => ({ ...prev, rainDetected: true }));
    setStatus('WATERING_DELAYED');
    setStatusReason('Rain has been detected, so watering is currently not recommended.');
    addAlert('☔ Rain Detected', 'Atmospheric rain sensor active. Irrigation cycle held.', 'info');
  };

  const clearRain = () => {
    setSensors((prev) => ({ ...prev, rainDetected: false }));
    evaluateRecommendation(sensors.soilMoisture, selectedPlant, selectedStage, false);
    addAlert('Rain Cleared', 'Rain sensor clear. Regular irrigation schedule resumed.', 'info');
  };

  const simulateLowFlow = () => {
    setSensors((prev) => ({
      ...prev,
      lowFlowActive: true,
      flowRate: prev.pumpActive ? 18 : 0,
    }));
    addAlert('⚠ Low Flow Detected', 'Flow rate dropped to 18 mL/min (nominal 82 mL/min).', 'warning');
  };

  const simulateNoFlow = () => {
    setSensors((prev) => ({
      ...prev,
      noFlowActive: true,
      flowRate: 0,
    }));
    if (status === 'WATERING') {
      handleNoFlowFault();
    } else {
      addAlert('Zero Flow Test Armed', 'Next cycle will test pump safety auto-cutoff.', 'warning');
    }
  };

  const clearFaults = () => {
    setSensors((prev) => ({
      ...prev,
      lowFlowActive: false,
      noFlowActive: false,
      flowRate: prev.pumpActive ? 82 : 0,
    }));
    if (status === 'FAULT') {
      evaluateRecommendation(sensors.soilMoisture, selectedPlant, selectedStage, sensors.rainDetected);
    }
    addAlert('Telemetry Restored', 'Flow calibrated to nominal 82 mL/min.', 'info');
  };

  const completeWateringInstantly = () => {
    if (wateringIntervalRef.current) {
      clearInterval(wateringIntervalRef.current);
      wateringIntervalRef.current = null;
    }
    handleTargetReached(sensors.targetVolume);
  };

  const toggleAutoWatering = async () => {
    const nextVal = !sensors.autoWateringEnabled;
    setSensors((prev) => ({
      ...prev,
      autoWateringEnabled: nextVal,
    }));
    addAlert(
      nextVal ? 'Autonomous Mode Engaged' : 'Manual Operation Active',
      nextVal
        ? 'Nurtura will automatically trigger watering when soil moisture falls below threshold.'
        : 'Irrigation requires manual confirmation.',
      'info'
    );

    if (!isDemoMode && auth.currentUser) {
      try {
        const settingsRef = doc(db, 'users', auth.currentUser.uid, 'settings', 'irrigation');
        await setDoc(
          settingsRef,
          {
            userId: auth.currentUser.uid,
            selectedPlantId: selectedPlant.id,
            selectedStage: selectedStage,
            targetVolume: sensors.targetVolume,
            autoWateringEnabled: nextVal,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${auth.currentUser.uid}/settings/irrigation`);
      }
    }
  };

  const resetCalibration = () => {
    setIsResetModalOpen(false);
    if (wateringIntervalRef.current) {
      clearInterval(wateringIntervalRef.current);
      wateringIntervalRef.current = null;
    }
    if (startingTimeoutRef.current) clearTimeout(startingTimeoutRef.current);
    if (noFlowTimeoutRef.current) clearTimeout(noFlowTimeoutRef.current);

    setSelectedPlantState(PLANTS[0]);
    setSelectedStageState('Vegetative');
    setStatus('IDLE');
    setStatusReason('Your plant currently has sufficient moisture.');

    setSensors({
      soilMoisture: 42,
      temperature: 28.4,
      humidity: 67,
      lightLux: 780,
      rainDetected: false,
      flowRate: 0,
      deliveredVolume: 0,
      targetVolume: 500,
      pumpActive: false,
      lowFlowActive: false,
      noFlowActive: false,
      autoWateringEnabled: true,
    });

    if (isDemoMode) {
      setHistory(INITIAL_HISTORY);
    }
    setAlerts([]);
    addAlert('Calibration Reset', 'Sensors restored to nominal factory baseline.', 'info');
  };

  // Simulator Control Handlers
  const setSimulatorSoilMoisture = (val: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(val)));
    setSensors((prev) => ({
      ...prev,
      soilMoisture: clamped,
    }));
    evaluateRecommendation(clamped, selectedPlant, selectedStage, sensors.rainDetected);
  };

  const setSimulatorTemperature = (val: number) => {
    const clamped = Math.max(15, Math.min(45, Math.round(val * 10) / 10));
    setSensors((prev) => ({
      ...prev,
      temperature: clamped,
    }));
  };

  const setSimulatorHumidity = (val: number) => {
    const clamped = Math.max(20, Math.min(95, Math.round(val)));
    setSensors((prev) => ({
      ...prev,
      humidity: clamped,
    }));
  };

  const setSimulatorTargetVolume = (vol: number) => {
    setSensors((prev) => ({
      ...prev,
      targetVolume: vol,
    }));
  };

  const toggleSimulatorRain = () => {
    const nextRain = !sensors.rainDetected;
    if (nextRain) {
      simulateRain();
    } else {
      clearRain();
    }
  };

  const setFlowCondition = (cond: FlowCondition) => {
    setFlowConditionState(cond);
    if (cond === 'low_flow') {
      simulateLowFlow();
    } else if (cond === 'no_flow') {
      simulateNoFlow();
    } else {
      clearFaults();
    }
  };

  const setPresenceDetected = (detected: boolean) => {
    setPresenceDetectedState(detected);
    setSensors((prev) => ({ ...prev, presenceDetected: detected }));
    if (detected) {
      addAlert('Presence Detected', 'Activity detected near garden crop zone by PIR motion sensor.', 'info');
    }
  };

  const simulatePresence = () => {
    setPresenceDetected(true);
    setTimeout(() => {
      setPresenceDetectedState(false);
      setSensors((prev) => ({ ...prev, presenceDetected: false }));
    }, 6000);
  };

  const simulateNormalWatering = () => {
    clearFaults();
    clearRain();
    setFlowConditionState('normal');
    setSensors((prev) => ({
      ...prev,
      soilMoisture: 24,
      rainDetected: false,
      lowFlowActive: false,
      noFlowActive: false,
    }));
    evaluateRecommendation(24, selectedPlant, selectedStage, false);
    setTimeout(() => {
      startWatering();
    }, 300);
  };

  const resetSimulation = () => {
    if (wateringIntervalRef.current) {
      clearInterval(wateringIntervalRef.current);
      wateringIntervalRef.current = null;
    }
    if (startingTimeoutRef.current) clearTimeout(startingTimeoutRef.current);
    if (noFlowTimeoutRef.current) clearTimeout(noFlowTimeoutRef.current);

    setFlowConditionState('normal');
    setPresenceDetectedState(false);
    setStatus('IDLE');
    setStatusReason('Simulation restored to factory baseline. Substrate moisture optimal.');
    setSensors({
      soilMoisture: 24,
      temperature: 32,
      humidity: 58,
      lightLux: 780,
      rainDetected: false,
      flowRate: 0,
      deliveredVolume: 0,
      targetVolume: 500,
      pumpActive: false,
      lowFlowActive: false,
      noFlowActive: false,
      autoWateringEnabled: true,
      presenceDetected: false,
    });
    evaluateRecommendation(24, selectedPlant, selectedStage, false);
    addAlert('Simulation Reset', 'Restored baseline parameters (Soil: 24%, Temp: 32°C).', 'info');
  };

  return (
    <IrrigationContext.Provider
      value={{
        isLoggedIn,
        isDemoMode,
        authLoading,
        currentUser,
        loginError,
        loginLoading,
        setLoginError,
        signInWithEmail,
        signUpWithEmail,
        loginWithPassword,
        loginAsDemo,
        logout,
        currentTab,
        setCurrentTab,
        selectedPlant,
        selectedStage,
        setSelectedPlant,
        setSelectedStage,
        customPlants,
        addCustomPlant,
        updateCustomPlant,
        deleteCustomPlant,
        status,
        statusReason,
        plantMood,
        sensors,
        history,
        timeline,
        graphPoints,
        alerts,
        dismissAlert,
        addAlert,
        startWatering,
        requestStopWatering,
        confirmStopWatering,
        cancelStopWatering,
        isStopModalOpen,
        isDiagnosticsOpen,
        setIsDiagnosticsOpen,
        makeSoilDry,
        makeSoilWet,
        makeSoilNormal,
        simulateDrySoil: makeSoilDry,
        simulateNormalSoil: makeSoilNormal,
        simulateRain,
        clearRain,
        simulateLowFlow,
        simulateNoFlow,
        clearFaults,
        completeWateringInstantly,
        toggleAutoWatering,
        resetCalibration,
        isResetModalOpen,
        setIsResetModalOpen,
        isArchitectureModalOpen,
        setIsArchitectureModalOpen,
        selectedGraphEvent,
        setSelectedGraphEvent,
        latitude,
        updateUserLatitude,
        todayET,
        etHistory,
        refreshET,
        simulationSpeed,
        setSimulationSpeed,
        flowCondition,
        setFlowCondition,
        presenceDetected,
        setPresenceDetected,
        setSimulatorSoilMoisture,
        setSimulatorTemperature,
        setSimulatorHumidity,
        setSimulatorTargetVolume,
        toggleSimulatorRain,
        simulateNormalWatering,
        simulatePresence,
        resetSimulation,
        isSetupCompleted,
        isSetupWizardOpen,
        setIsSetupWizardOpen,
        gardenSetup,
        plantAreas,
        completeGardenSetup,
        saveAcquiredLocation,
      }}
    >
      {children}
    </IrrigationContext.Provider>
  );
};

export const useIrrigation = () => {
  const context = useContext(IrrigationContext);
  if (!context) {
    throw new Error('useIrrigation must be used within an IrrigationProvider');
  }
  return context;
};

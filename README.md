# NURTURA — Smart Irrigation for Compact Gardens

NURTURA is a modern, closed-loop smart irrigation web application designed for compact balcony planters and indoor gardens. It features real-time capacitive substrate sensing, flow-rate telemetry (nominal 82 mL/min), automatic safety cutoffs, empathetic plant emotion feedback (crying when dry, happy when hydrated), and autonomous dosing.

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Launch the development server:**
   ```bash
   npm run dev
   ```

3. Open your browser at `http://localhost:3000` (or the port indicated by Vite).

4. **Sign in to Controller:**
   - Use default preset: `elena@garden.local` / `pass123`
   - Or enter any email and password (min 4 characters).

## 🛠 Key Features

- **Empathetic Plant Indicators**: Crying tears when soil drops below threshold, happy blooming posture when hydrated.
- **Hero Section**: Architectural showcase of the compact balcony planter with floating telemetry badges (`SOIL 42%`, `TEMP 28.4°C`, `WATER 500 mL`).
- **Autonomous Dosing**: Automatically calculates hydration based on growth stage (`Seedling` → `Vegetative` → `Flowering` → `Fruiting` → `Mature`).
- **Safety Fault Cutoffs**: Restricted low-flow detection (18 mL/min) and zero-flow emergency pump auto-cutoff (0 mL/min).
- **Precipitation Override**: Optical rain sensing pauses automatic watering during rainfall.
- **Controller Diagnostics**: Integrated hardware calibration drawer to simulate dry/wet soil, rain, and flow conditions.
- **Embedded OLED Mirror**: Monospace 0.96" display mirror of active controller telemetry.

## 📦 Project Structure

```text
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   ├── assets/images/
│   ├── components/
│   │   ├── ArchitectureModal.tsx
│   │   ├── DashboardView.tsx
│   │   ├── DemoControlPanel.tsx
│   │   ├── HeroSection.tsx
│   │   ├── HistoryView.tsx
│   │   ├── IrrigationTimeline.tsx
│   │   ├── LoginView.tsx
│   │   ├── Navbar.tsx
│   │   ├── OledPreviewCard.tsx
│   │   ├── PlantSelectionView.tsx
│   │   ├── ResetDemoModal.tsx
│   │   ├── SensorMetricCards.tsx
│   │   ├── SensorTrendGraph.tsx
│   │   ├── SettingsView.tsx
│   │   ├── StopWateringModal.tsx
│   │   └── ToastNotification.tsx
│   ├── context/
│   │   └── IrrigationContext.tsx
│   ├── data/
│   │   └── plantData.ts
│   └── types/
│       └── irrigation.ts
```

## 📜 License
Apache-2.0

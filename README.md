# Life Tracker (LifeDB)

> Personal operating system and activity telemetry engine featuring 24-hour timeline scheduling, multidimensional equilibrium analytics, and offline-first persistence.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-life--db--roan.vercel.app-2563EB?style=flat)](https://life-db-roan.vercel.app)
[![React 19](https://img.shields.io/badge/React-19.0-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Bundler-Vite-646CFF?style=flat&logo=vite)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

**Live Production URL:** [https://life-db-roan.vercel.app](https://life-db-roan.vercel.app)

---

## Overview

Life Tracker (LifeDB) is a personal productivity and time telemetry platform built for developers and operators managing structured daily routines. Built with **React 19, TypeScript, and Vite**, it integrates time-series calendar scheduling with strict behavioral state machines and real-time radar analytics.

---

## System Architecture

```mermaid
flowchart TD
    User([User / Operator]) <-->|Drag-and-Drop & Logging| UI[LifeDB Client Application]

    subgraph "State Machine & Telemetry"
        UI <--> StateEngine[In-Memory Telemetry Engine]
        StateEngine --> TaskStore[(Tasks & Protocols Store)]
        StateEngine --> LogStore[(Daily Time-Series Logs)]
        StateEngine --> StreakEngine[Accountability State Machine]
    end

    subgraph "Analytical Feedback Loops"
        StateEngine --> BalanceRadar[Multidimensional Equilibrium Radar]
        StateEngine --> VelocityMetric[Completion Velocity Tracking]
        StreakEngine -->|Skip Triggered| JustificationGate[Mandatory Written Justification Gate]
    end

    subgraph "Persistence"
        StateEngine <--> LocalCache[LocalStorage Reactive Sync]
    end
```

---

## Key Features

### 1. Interactive 24-Hour Timeline Scheduler
* Sub-hour precision scheduling with Day, Week, and Month planning views.
* Interactive drag-and-drop rescheduling with visual collision detection for overlapping deep work blocks.

### 2. High-Friction Accountability Gate
* Bypassing high-priority protocols requires entering a mandatory written explanation (minimum 20 characters) to discourage impulsive procrastination.
* Automatically updates streaks and commits excuses to immutable daily audit records.

### 3. Multidimensional Balance Radar
* Real-time radar visualization calculating life domain equilibrium across Social, Spiritual, Study, Gym, Diet, Work, and Balance.
* Identifies under-indexed domains algorithmically to guide schedule adjustments.

### 4. Offline-First In-Memory Architecture
* Reactive state updates execute with sub-millisecond responsiveness with zero server lag.
* Transparent persistence layer synchronizes structured JSON records to browser local storage.

---

## Tech Stack

* **Framework:** React 19, TypeScript, Vite
* **Styling:** Modular CSS3 (Custom Glassmorphism Design System, Responsive Breakpoints)
* **Icons:** Lucide React
* **Hosting:** Vercel Global Edge Network

---

## Local Development

```bash
# Clone the repository
git clone https://github.com/harkiratsinghh27-sketch/life-tracker.git
cd life-tracker

# Install dependencies
npm install

# Run the local development server
npm run dev
```

---

## License

MIT License. See [LICENSE](LICENSE) for details.

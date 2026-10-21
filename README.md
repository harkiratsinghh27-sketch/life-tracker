# Life Tracker (LifeDB) — Real-Time Activity Telemetry & Life Operating System

[![Vercel Deployment](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat&logo=vercel)](https://life-db-roan.vercel.app)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-life--db--roan.vercel.app-blue)](https://life-db-roan.vercel.app)
[![React 19](https://img.shields.io/badge/React-19.0-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Bundler-Vite-646CFF?style=flat&logo=vite)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

> 🚀 **Live Production Application**: [https://life-db-roan.vercel.app](https://life-db-roan.vercel.app)

---

## 📌 Overview

**Life Tracker (LifeDB)** is a high-performance personal operating system, activity telemetry database, and disciplined execution engine. Built with **React 19, TypeScript, and Vite**, it combines structured time-series scheduling, strict accountability state machines, multidimensional equilibrium analytics, and an interactive conversational copilot into a unified interface.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    User([👤 User / Operator]) <-->|Interactive Drag-and-Drop & Logging| UI[🖥️ LifeDB Web Application (Vercel Edge)]

    subgraph "Core State & Telemetry Store"
        UI <--> StateEngine[⚡ In-Memory Telemetry & LocalStorage Sync]
        StateEngine --> TaskStore[(📋 Protocols & Tasks State)]
        StateEngine --> LogStore[(⏱️ Time-Series Daily Logs)]
        StateEngine --> StreakMachine[🔥 Accountability & Streak Engine]
    end

    subgraph "Analytics & Behavioral Feedback Loops"
        StateEngine --> RadarCalc[📊 Multi-Axis Life Balance Equilibrium Radar]
        StateEngine --> VelocityMetric[📈 Completion Velocity & Consistency Metrics]
        StreakMachine -->|Skip Triggered| HighFrictionModal[🛡️ Mandatory Justification Gate (20+ chars)]
    end

    subgraph "Conversational Copilot"
        User <-->|Schedule Queries & Natural Logging| Copilot[🤖 Contextual AI Assistant]
        Copilot <--> StateEngine
    end
```

---

## 🌟 Key Capabilities

### 1. Interactive 24-Hour Timeline & Multi-View Schedulers
* **Sub-Hour Precision:** Dynamic drag-and-drop schedule planner featuring Day, Week, and Month views.
* **Collision Detection:** Visual conflict alerts when deep work intervals overlap with scheduled protocols.

### 2. High-Friction Accountability State Machine
* **Anti-Procrastination Guardrails:** Bypassing any high-priority protocol requires a mandatory written justification (minimum 20 characters).
* **Deterministic Streak Preservation:** Unjustified skips instantly reset running streaks and log the justification to immutable historical daily records.

### 3. Multi-Axis Equilibrium Radar
* **Holistic Balance Tracking:** Real-time multi-dimensional radar dynamically computing life domain equilibrium across Social, Spiritual, Study, Gym, Diet, Work, and Balance.
* **Algorithmic Weighting:** Highlights under-indexed domains and recommends priority adjustments.

### 4. Offline-First In-Memory Persistence
* **Sub-Millisecond UI Response:** Fully reactive state architecture delivering instantaneous optimistic updates without server latency.
* **Resilient Data Storage:** Structured schemas automatically backed up to browser local storage.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | React 19, TypeScript, Vite |
| **Styling & Design** | Pure CSS3 (Dark Mode, Glassmorphic Tokens, Responsive Breakpoints) |
| **Icons & Visuals** | Lucide React |
| **Deployment** | Vercel Global Edge CDN ([life-db-roan.vercel.app](https://life-db-roan.vercel.app)) |

---

## 🚀 Local Development

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/harkiratsinghh27-sketch/life-tracker.git
   cd life-tracker
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local dev server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

---

## 🔗 Live Application

The production application is continuously deployed and accessible at:
👉 **[https://life-db-roan.vercel.app](https://life-db-roan.vercel.app)**

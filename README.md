# FINDIT — The Last-Minute Campus Finder

> **Find available campus resources before time runs out.**

FINDIT is an AI-powered college campus resource finder and reservation system. When students urgently need equipment (scientific calculators, laptop chargers, HDMI adapters, lab goggles, noise-canceling headphones, or umbrellas) right before an exam, lab, or lecture, FINDIT parses natural-language requests, evaluates proximity and inventory, ranks the fastest available solutions, and manages the entire borrowing lifecycle.

---

## ✨ Features

- **Natural Language Intent Parsing**: Type requests like *"I have an exam in 20 minutes and need a scientific calculator near Block B"*—the AI identifies the required item, urgency level, duration, and user location.
- **Explainable Match Ranking**: Scores campus resources by proximity, availability, and urgency with transparent breakdown reasons.
- **Full Resource Lifecycle**:
  - `Available` → `Reserved` → `Borrowed` → `Returned` → `Available`
  - Automated `Overdue` handling with live seconds-precision countdowns.
- **Pickup & Check-in Verification**: 6-character reservation codes (e.g., `LF-4821`) and desk verification.
- **Interactive Returns & Inspection**: Return items with condition checks (`Same condition`, `Minor damage`, `Damaged`) and QR code scan simulation.
- **Loan Extensions**: In-app extension requests (+15, +30, +60 mins) with automated conflict checking against pending reservations.
- **Borrowing Eligibility Enforcement**: Overdue items automatically restrict users from borrowing new resources until returned.
- **Interactive Campus Map**: Visual campus map of academic blocks, libraries, and labs with walking time indicators.
- **Peer-to-Peer Student Sharing**: Community board for students to lend and borrow gear between classmates.
- **Admin Facility Dashboard**: Real-time fleet inventory tracking, overdue rosters, one-click return reminders, and condition audit logs.
- **Simulation Control Panel**: Quick demo buttons for testing borrow, return, overdue, and reset states.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React, Motion
- **Backend / Proxy**: Node.js, Express, tsx
- **AI Integration**: Google Gemini API via `@google/genai` SDK
- **Build Tool**: Vite 6, esbuild

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm** or **bun** / **yarn** / **pnpm**
- A **Google Gemini API Key** (from [Google AI Studio](https://aistudio.google.com/))

### 2. Installation

Clone this repository and install dependencies:

```bash
git clone https://github.com/YOUR_USERNAME/findit-campus-finder.git
cd findit-campus-finder
npm install
```

### 3. Environment Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Open `.env` and add your Gemini API key:

```env
GEMINI_API_KEY="your-gemini-api-key-here"
```

*(Note: The app includes intelligent local fallback parsing even without an API key, but providing a key enables full Gemini model intelligence).*

### 4. Running the Development Server

Start the full-stack dev server:

```bash
npm run dev
```

Open your browser at `http://localhost:3000` (or the port specified in terminal).

### 5. Production Build

To create an optimized production build:

```bash
npm run build
npm start
```

---

## 📂 Project Structure

```text
findit-campus-finder/
├── server.ts                  # Express server & Gemini API proxy endpoint
├── index.html                 # HTML entry point with metadata
├── src/
│   ├── main.tsx               # React entry point
│   ├── App.tsx                # Central state, lifecycle workflows & modals
│   ├── types.ts               # Core TypeScript models (Resources, Transactions, Intent)
│   ├── components/
│   │   ├── Navigation.tsx     # Desktop sidebar and mobile navigation
│   │   ├── HomeHero.tsx       # Search box, quick categories, popular tags
│   │   ├── SearchResults.tsx  # Best match card & explainable AI breakdown
│   │   ├── CampusMap.tsx      # SVG interactive campus map with routes
│   │   ├── ReservationModal.tsx # Hold reservations & time duration picker
│   │   ├── PickupModal.tsx    # Desk verification and checkout flow
│   │   ├── ReturnModal.tsx    # Condition inspection & QR scanner simulation
│   │   ├── ExtensionModal.tsx # Loan extension requests
│   │   ├── OverdueRestrictionModal.tsx # Borrowing blocker for overdue users
│   │   ├── NotificationToasts.tsx      # In-app alert banners & reminders
│   │   ├── MyReservations.tsx # Active loans, live countdowns, borrow history
│   │   ├── StudentSharing.tsx # Peer-to-peer student resource exchange
│   │   ├── AdminAnalytics.tsx # Admin dashboard, telemetry & audit logs
│   │   ├── ExploreDirectory.tsx # Filterable full campus catalog
│   │   └── DemoSimulationPanel.tsx # Floating demo lifecycle triggers
│   ├── data/
│   │   └── mockResources.ts   # Mock campus resources, buildings & demo data
│   └── utils/
│       └── matchingAlgorithm.ts # Proximity & relevance scoring algorithm
├── .env.example               # Template environment configuration
├── package.json
└── tsconfig.json
```

---

## 📄 License

MIT License. Designed and built as a campus utility prototype.

<img width="1527" height="670" alt="Screenshot 2026-10-05 211058" src="https://github.com/user-attachments/assets/a80dc731-0231-4cb2-b6a7-aa516d3eac02" />
<img width="1527" height="657" alt="Screenshot 2026-10-05 211018" src="https://github.com/user-attachments/assets/1a6e9d2a-ca95-48c7-b1ac-9d8053ddb0a1" />
<img width="1528" height="670" alt="Screenshot 2026-10-05 210949" src="https://github.com/user-attachments/assets/326f39ea-f236-49f6-b886-cf6b3b55653a" />
<img width="1525" height="666" alt="Screenshot 2026-10-05 210916" src="https://github.com/user-attachments/assets/e7272654-c586-4810-b6c8-013d9796f6ef" />


# ✦ WalletWarp — Personal Finance Companion

> *Money, flowing your way.*

A polished personal finance companion built with React Native + Expo for the competition assignment. Designed to feel **personal**, work **offline-first**, and be **intuitive enough for any user** while surfacing genuinely useful financial insights. 

Originally conceived as "Flo Finance", this application has been fully rebranded and engineered into a robust, production-ready product: **WalletWarp**.

---

## 🎯 What Makes This Stand Out

### Karma Score (Signature Feature)
A gamified 0–100 financial health score computed live from real data:
- **Streak** — consistency of daily logging (up to 20 pts)
- **Savings rate** — % of income saved this month (up to 20 pts)
- **Budget adherence** — staying within your monthly cap (up to 20 pts)
- **Transaction count** — engagement with the app (up to 20 pts)
- **Goals** — active + completed goals (up to 20 pts)

Animated gradient ring on every launch. Users unlock levels: `🌱 Novice → ⚡ Tracker → 🌟 Saver → 💎 Master → 👑 Legend`. Personal finance that feels like a game worth playing.

### Robust Recurring Transactions Engine
Automate your financial tracking with a built-in recurrence engine. Support for `daily`, `weekly`, `biweekly`, `monthly`, `quarterly`, and `yearly` rules. The smart background processor auto-generates your pending transactions the moment you launch the app—meaning you never have to manually log your rent, streaming subscriptions, or salary ever again. Complete with a dedicated dashboard to understand your monthly scheduled cash flow.

### True End-to-End Cloud Sync (E2EE)
Firebase integration that allows users to seamlessly back up their app state to the cloud. Before exiting your device, all financial data is mathematically scrambled into cipher text via **AES-256 encryption** using a local password. Your password never leaves your device and acts as your End-to-End Encryption key. Not even the cloud database administrators can read the user's financial data.

### Secure App Lock & Biometrics
WalletWarp features a fully integrated application lock state. Users can create a custom 4-digit passcode, complemented by system-level hardware **Biometrics** (FaceID/TouchID/Fingerprint). Includes intelligent "grace period" configurations (e.g., Immediate, 30s, 1m) to prevent annoying lockouts while multitasking or swiping between apps.

### Comprehensive Export Suite & Receipt Management
- **Universal Export**: One-tap generation of beautifully formatted **PDF Reports**, actionable **CSV Spreadsheets**, and developer-friendly **JSON payloads**. Export your entire financial footprint at a moment's notice.
- **Receipt Capture**: Directly snap photos of receipts via the device Camera or select them from your Media Library. WalletWarp securely stores these images locally and attaches them natively to transactions for painless auditing.

### Native-Feeling Interactions
- **Swipe-to-delete** transactions with spring physics and confirmation
- **Custom numpad** for amount entry (no system keyboard covering the form)
- **Haptic feedback** on every meaningful action across the entire interface
- **Pull-to-refresh** on the home screen and animated ring progress bars
- **Seamless Dark/Light Mode** rendering using a centralized theme system

---

## 📱 Screens

| Screen | Key Features |
|---|---|
| **Onboarding** | 3-slide intro, profile, currency selection, and budget baseline setup. |
| **Home** | Balance hero card, animated Karma ring, savings rate, weekly bar chart, recent transactions. |
| **Transactions** | Date-grouped list, summary strip, advanced search, type + date range filters, swipe-to-delete. |
| **Add/Edit** | Custom numpad, 19 categories, **Camera/Gallery receipt attachment**, 7-day date picker, notes. |
| **Recurring** | Auto-logging engine for daily, weekly, monthly, yearly rules. Active/paused management and monthly impact summaries. |
| **Goals** | Savings goals, no-spend challenges, budget limits; add modal, contribute modal, visual progress rings. |
| **Insights** | Smart insight cards, monthly grid, week comparison bars, donut chart by category, 6-month historical trend. |
| **Settings** | Security & passcodes, biometrics toggle, data export (PDF/CSV/JSON), clear data, E2EE vault access, theme toggle. |
| **Backup** | Firebase vault access management, encryption password handling, and one-tap restore/backup actions. |

---

## 🏗️ Architecture

```text
flo-finance/
├── App.tsx                          # Root: GestureHandler + NavigationContainer
├── src/
│   ├── types/index.ts               # Core TypeScript interfaces definitions
│   ├── constants/                   # Design Tokens (Colors, Typography, Spacing)
│   ├── store/
│   │   ├── useAppStore.ts           # Settings, theme, PIN security (Zustand)
│   │   ├── useTransactionStore.ts   # Core CRUD + filtering engine (Zustand)
│   │   ├── useGoalStore.ts          # Financial goals + tracking (Zustand)
│   │   └── useRecurringStore.ts     # Engine for evaluating recurring rules (Zustand)
│   ├── utils/
│   │   ├── storage.ts               # Typed AsyncStorage wrappers
│   │   ├── encryption.ts            # Local AES-256 routines
│   │   ├── export.ts                # PDF, CSV, and JSON generation pipelines
│   │   ├── imageHelpers.ts          # FileSystem handling for Receipt images
│   │   ├── passcode.ts              # Keychain/Passcode security mechanisms
│   │   └── recurring.ts             # Smart auto-generation business logic
│   ├── hooks/                       # useTheme, useKarma, etc.
│   ├── navigation/                  # Complex Root Stack + Tab combinations
│   ├── components/                  # Extensive library of modular, abstracted UI elements
│   └── screens/
│       ├── HomeScreen.tsx
│       ├── TransactionsScreen.tsx
│       ├── AddTransactionScreen.tsx
│       ├── RecurringScreen.tsx
│       ├── BackupScreen.tsx
│       └── ...
```

---

## ⚙️ Tech Stack

| Layer | Choice | Why |
|---|---|---|
| **Framework** | React Native + Expo SDK 54 | Cross-platform, fast iteration, modern native integration APIs |
| **State** | Zustand | Zero boilerplate, built-in selectors, TypeScript-first state architecture |
| **Persistence** | AsyncStorage | Reliable offline-first capability; typed JSON-stringified caching |
| **Cloud Sync** | Firebase Auth + Firestore | Secure identity linking allowing true cross-device data continuity |
| **Security** | `expo-secure-store` + `crypto-js` | Fallback-capable Keystores + Local AES-256 End-to-End Encryption |
| **Native APIs** | `expo-local-authentication`, `expo-image-picker` | Direct access to FaceID, TouchID, Camera arrays, and Photo Albums |
| **Export/Print**| `expo-print`, `expo-sharing` | For flawless, native-rendered PDF invoice generations |
| **Navigation** | React Navigation v7 | Industry standard, deeply configurable stack and tab navigation |
| **UI/UX** | Custom SVG (`react-native-svg`) + Haptics | Pixel-perfect customized charts with physical app responsiveness |

---

## 🚀 Setup & Running

### Prerequisites
- Node.js 18+
- `npm install -g expo-cli` (or simply use `npx expo`)
- iOS Simulator / Android Emulator **or** Expo Go on a physical device

### Quick Start

```bash
# Install all required dependencies
npm install

# Start the Expo development server
npm start

# Execution Options:
# Press `i` to launch in iOS Simulator
# Press `a` to launch in Android Emulator
# Scan the Terminal QR code with Expo Go to run on a physical device
```

---

## 📋 Feature Coverage Matrix

### Core Objectives
| Goal / Requirement | Status | Implementation Details |
|---|---|---|
| Dashboard Hub | ✅ | Live net balance counting, month over month insights, and latest expenditures |
| Data Visualizations | ✅ | High-quality bar charts (weekly), donut charts (categorical), SVG progress rings |
| Advanced Transactions | ✅ | Complete CRUD, custom numpad, custom 7-day picker, search engines |
| Image & Receipt Capture | ✅ | Direct integrations with device internal cameras and media storage |
| Goal tracking capability | ✅ | Tracks savings goals, tracks "No-Spend" streaks, calculates adherence |
| State Management | ✅ | Masterfully architected using robust Zustand modules and strict TS implementations |
| Data Persistence | ✅ | Fully offline mode default architecture via local persistence layers |

### Pro / Premium Specifics
| Pro Enhancement | Status | Implementation Details |
|---|---|---|
| Cloud Synchronization | ✅ | Password-protected vaults via Firebase using native localized encryption layers |
| Data Export Engine | ✅ | Multi-layer exports directly out to system share sheets (PDF, CSV, JSON forms) |
| App Security Protocol | ✅ | Passcode generation UI mapped to hardware biometric layers. Allows grace periods! |
| Recurring Auto-Generators | ✅ | Sets up 'Smart Rules' that will compute missed transactions upon launch. |
| Premium UX / UI Themes | ✅ | Absolute fluid animations. Context-aware dark/light modes. Granular haptic feedback. |
| Multi-Currency Support | ✅ | Switch localized currencies dynamically seamlessly. |

---

## 🔧 Engineering Decisions

- **Local End-to-End Encryption Paradigm**: We firmly opted not to send plaintext transactions to the database. All user data is locally converted to unreadable AES-256 blocks before internet transmission to guarantee privacy.
- **Background Context Engine for Recurring Rules**: Since this is purely a standalone mobile client—with no centralized Node server running cron jobs—the recurring engine fires asynchronously on app mount. It computes logical intervals and diffs between `lastProcessed` and `today` offsets to inject required transactions retroactively.
- **Custom Numpad Control**: Native keyboards consume up to 45% of available screen real estate which interrupts the UX flow of an add transaction. The custom flexbox numpad provides satisfyingly large hit areas while retaining total screen contextual visibility.

---

<div align="center">
  <strong>✦ WalletWarp</strong><br/>
  Track it. Understand it. Improve it.
</div>
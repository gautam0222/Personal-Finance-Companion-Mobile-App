# ✦ Flo Finance — Personal Finance Companion

> *Money, flowing your way.*

A polished personal finance companion built with React Native + Expo for the competition assignment. Designed to feel **personal**, work **offline-first**, and be **intuitive enough for any user** while surfacing genuinely useful financial insights.

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

### Smart Insight Engine
7 types of locally-computed insights shown as horizontal swipeable cards:
budget warnings at 70% and 90%, week-over-week spending changes, top category callouts, savings rate coaching, streak celebrations, and new-user nudges. No API. No internet. All computed from local transaction data.

### Native-Feeling Interactions
- **Swipe-to-delete** transactions with spring physics and confirmation
- **Custom numpad** for amount entry (no keyboard covering the form)
- **Haptic feedback** on every meaningful action
- **Pull-to-refresh** on the home screen
- **Animated ring progress** on karma and goals

---

## 📱 Screens

| Screen | Key Features |
|---|---|
| **Onboarding** | 3-slide intro, name + currency + budget setup, skip option |
| **Home** | Balance hero card, animated Karma ring, savings rate, weekly bar chart, recent transactions |
| **Transactions** | Date-grouped list, summary strip, search, type + date range filters, swipe-to-delete |
| **Add/Edit** | Custom numpad, 19 categories, 7-day date picker, note field, income/expense toggle |
| **Goals** | Savings goals, no-spend challenge, budget limit; add modal, contribute modal, progress rings |
| **Insights** | Smart cards, monthly grid, week comparison bars, donut chart by category, 6-month trend |
| **Settings** | Profile edit, currency (6 options), dark/light mode toggle, data management |

---

## 🏗️ Architecture

```
flo-finance/
├── App.tsx                          # Root: GestureHandler + NavigationContainer
├── src/
│   ├── types/index.ts               # All TypeScript interfaces
│   ├── constants/
│   │   ├── colors.ts                # Full dark + light color system
│   │   ├── typography.ts            # Font scale + text style presets
│   │   ├── spacing.ts               # 4-pt spacing grid + radii + shadows
│   │   └── categories.ts            # 19 categories with icons + colors
│   ├── store/
│   │   ├── useAppStore.ts           # Settings, theme, onboarding (Zustand)
│   │   ├── useTransactionStore.ts   # Full CRUD + filter engine (Zustand)
│   │   └── useGoalStore.ts          # Goals CRUD + progress (Zustand)
│   ├── utils/
│   │   ├── storage.ts               # Typed AsyncStorage wrapper
│   │   ├── formatters.ts            # Currency (compact + full), date helpers
│   │   ├── calculations.ts          # Aggregations, streaks, grouping
│   │   └── insights.ts              # Smart insight generation
│   ├── hooks/
│   │   ├── useTheme.ts              # Typed color scheme for current mode
│   │   └── useKarma.ts              # Computes KarmaData from all stores
│   ├── navigation/
│   │   ├── RootNavigator.tsx        # Stack: Onboarding → Tabs → AddTransaction
│   │   └── TabNavigator.tsx         # Custom bottom tab bar with haptics
│   ├── components/
│   │   ├── common/                  # Button, Card, Input, Badge, EmptyState, SectionHeader
│   │   ├── charts/                  # BarChart, DonutChart, RingProgress (custom SVG)
│   │   ├── home/                    # BalanceCard, KarmaRing, QuickStats
│   │   ├── transactions/            # TransactionItem (swipe), CategoryPicker, FilterBar
│   │   └── goals/                   # GoalCard with progress ring
│   └── screens/
│       ├── OnboardingScreen.tsx
│       ├── HomeScreen.tsx
│       ├── TransactionsScreen.tsx
│       ├── AddTransactionScreen.tsx
│       ├── GoalsScreen.tsx
│       ├── InsightsScreen.tsx
│       └── SettingsScreen.tsx
```

---

## ⚙️ Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | React Native + Expo SDK 51 | Cross-platform, fast demo, no native build needed |
| State | Zustand | Zero boilerplate, built-in selectors, TypeScript-first |
| Persistence | AsyncStorage | Simple key-value; typed wrapper for safety |
| Navigation | React Navigation v6 | Industry standard, native animations |
| Charts | Custom SVG (react-native-svg) | Full design control, no heavy chart library deps |
| Animations | Animated API + Reanimated 2 | Ring progress + swipe gestures |
| Gestures | PanResponder + gesture-handler | Swipe-to-delete |
| Haptics | expo-haptics | Tactile feedback on every meaningful action |
| Dates | date-fns | Lightweight, tree-shakeable, excellent TypeScript types |
| Language | TypeScript (strict mode) | End-to-end type safety |

---

## 🚀 Setup & Running

### Prerequisites
- Node.js 18+
- `npm install -g expo-cli` (or use `npx expo`)
- iOS Simulator / Android Emulator **or** Expo Go on your phone

### Quick Start

```bash
# Install dependencies
npm install

# Start Expo development server
npm start

# Then press:
# i  →  iOS Simulator
# a  →  Android Emulator
# Scan QR code with Expo Go app on your phone
```

### Running on a Physical Device
1. Install **Expo Go** from App Store (iOS) or Play Store (Android)
2. Run `npm start`
3. Scan the QR code shown in the terminal

---

## 📋 Feature Coverage

### Required Features

| Requirement | Status | Notes |
|---|---|---|
| Home dashboard with balance | ✅ | Monthly income, expense, net balance |
| Visual element | ✅ | Bar chart (weekly), donut chart (by category), ring progress |
| Savings progress | ✅ | Savings rate % + bar on home screen |
| Add transaction | ✅ | Custom numpad, 19 categories, 7-day date picker |
| View transaction history | ✅ | Grouped by date with day totals |
| Edit transaction | ✅ | Tap any item → pre-filled form |
| Delete transaction | ✅ | Swipe gesture + confirmation |
| Filter / search | ✅ | Type, date range (week/month/3mo/all), text search |
| Goal feature | ✅ | 3 types: savings goal, no-spend challenge, budget limit |
| Insights screen | ✅ | 6 chart/stat sections + smart insight cards |
| Empty states | ✅ | Every list and screen has a tailored empty state |
| Local data storage | ✅ | AsyncStorage, hydrated on launch |
| State management | ✅ | Zustand with 3 stores, TypeScript strict |
| Code structure | ✅ | Feature folders, pure utils, hooks, reusable components |

### Optional Enhancements

| Enhancement | Status |
|---|---|
| Dark mode | ✅ Full dark + light theme, toggleable, respects system |
| Animated transitions | ✅ Ring animation, swipe physics, fade navigation |
| Offline-first | ✅ 100% local, zero network required |
| Profile / settings | ✅ Name, currency, budget all editable |
| Multi-currency | ✅ INR, USD, EUR, GBP, JPY, AED |

---

## 🔧 Assumptions & Decisions

**Custom numpad over system keyboard** — The system keyboard covers ~40% of the screen on most phones, hiding context. The custom numpad keeps the full form visible while providing a satisfying, large-number typing experience.

**Zustand over Redux** — For this scope, Redux adds ~300 lines of boilerplate with identical outcomes. Zustand delivers cleaner, more readable stores that are easier to evaluate.

**Custom SVG charts** — Chart libraries built for web have inconsistent performance on React Native's SVG renderer. Hand-crafted charts are lighter, faster, and pixel-perfectly aligned to the design system.

**Text input for goal deadline** — Used YYYY-MM-DD text input rather than a native DateTimePicker to avoid platform-specific styling differences. A DateTimePicker could be dropped in trivially.

**Karma score does not reset between months** — It's a rolling health indicator based on current habits, not a monthly report card. This feels more motivating.

**Currency number formatting** — Uses `en-IN` locale when INR is selected (₹1,00,000 style), otherwise `en-US`. Compact format (K/L/Cr) used in small spaces.

---

## 📊 Evaluation Criteria Map

| Criterion | Where to look |
|---|---|
| Product Thinking | Karma Score concept, insight engine logic, onboarding UX flow |
| Mobile UI/UX | Custom tab bar, swipe-to-delete, haptics, dark mode, all empty states |
| Creativity | Karma Score + level progression is novel for finance apps |
| Functionality | Full CRUD transactions, goal contribution flow, filter + search |
| Code Quality | Strict TypeScript, pure utility functions, consistent naming, no `any` |
| State & Data Handling | Zustand 3-store architecture, AsyncStorage hydration pattern |
| Responsiveness | SafeAreaView everywhere, KeyboardAvoidingView on forms |
| Documentation | This README + assumptions documented above |

---

<div align="center">
  <strong>✦ Flo Finance</strong><br/>
  Track it. Understand it. Improve it.
</div>
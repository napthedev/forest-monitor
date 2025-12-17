# Forest Monitor — Web Dashboard

Real-time monitoring dashboard for the Forest Monitor project. This web app connects to **Firebase Realtime Database** and visualizes sensor readings coming from the ESP32 devices.

## Features

- **Live sensor dashboard** with at-a-glance cards and quick trends.
- **Dedicated sensor pages** with richer visuals and history:
	- Light
	- Motion (event timeline)
	- Sound (level + alert banner)
	- Vibration (event timeline)
	- Flame (fire alert banner)
	- Temperature
	- Humidity
	- Soil Moisture
	- Gas (MQ-2: LPG/CO/CH4)
- **Real-time updates** via Firebase listeners (no manual refresh).
- **Last-updated timestamps** shown as relative time (e.g. “12 seconds ago”).
- **Basic alerts** for:
	- Flame / Fire detection (based on flame sensor threshold)
	- High sound level (>= 75%)
- **Route-themed UI**: navigation + page styling changes per sensor route.
- **Charts** for analog sensors using Recharts (recent history, last 20 points).

## Data Source (Firebase)

The app reads from Firebase Realtime Database under:

- `/sensors/light`
- `/sensors/motion`
- `/sensors/sound`
- `/sensors/vibration`
- `/sensors/flame`
- `/sensors/temperature`
- `/sensors/humidity`
- `/sensors/soil-moisture`
- `/sensors/gas`

Records are expected to include a `timestamp` (milliseconds since epoch). Some sensors also include a raw value field (for example `value` or `amplitude`) which is converted to a percentage or unit for display.

## Configuration

1. Create an environment file:

```bash
cp .env.example .env.local
```

2. Fill in your Firebase Web App config in `.env.local`:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_DATABASE_URL`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

## Development

Install dependencies:

```bash
pnpm install
```

Run the dev server:

```bash
pnpm dev
```

Open http://localhost:3000

## Scripts

- `pnpm dev` — start Next.js in development
- `pnpm build` — production build
- `pnpm start` — run production server
- `pnpm lint` — run ESLint

## Tech Stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS
- Firebase Realtime Database
- Recharts (graphs)
- Lucide (icons)
- `@bprogress/next` (top loading bar on route changes)

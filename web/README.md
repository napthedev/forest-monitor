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

Records are expected to include a `timestamp` (milliseconds since epoch). Some sensors also include a raw value field (for example `value` or `value`) which is converted to a percentage or unit for display.

## Configuration

### 1. Create `.env.local`

**Important**: This file is gitignored. Do not commit credentials.

```bash
# In web/ directory
touch .env.local
```

### 2. Add Firebase Web App config

Get these values from Firebase Console → Project Settings → Your apps → Web app config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

**Note**: All variables must start with `NEXT_PUBLIC_` to be available in the browser.

## Development

### Prerequisites
- Node.js 20+ (LTS recommended)
- pnpm 8+

### Install dependencies

```bash
pnpm install
```

### Run development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

### Scripts

```bash
pnpm dev        # Start Next.js dev server (hot reload enabled)
pnpm build      # Production build
pnpm start      # Run production server (after build)
pnpm lint       # Run ESLint
```

## Project structure

```
web/
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── page.tsx         # Dashboard (all sensors)
│   │   ├── layout.tsx       # Root layout with providers
│   │   ├── providers.tsx    # Progress bar provider
│   │   ├── globals.css      # Tailwind directives
│   │   ├── flame/page.tsx   # Flame sensor page
│   │   ├── gas/page.tsx     # Gas sensor page
│   │   ├── humidity/page.tsx
│   │   ├── light/page.tsx
│   │   ├── motion/page.tsx
│   │   ├── soil-moisture/page.tsx
│   │   ├── sound/page.tsx
│   │   ├── temperature/page.tsx
│   │   └── vibration/page.tsx
│   ├── components/
│   │   └── Header.tsx       # Navigation bar
│   └── lib/
│       ├── firebase.ts      # Firebase initialization
│       ├── utils.ts         # Helper functions (conversions, formatters)
│       └── route-colors.ts  # Route-specific color themes
├── public/                   # Static assets
├── .env.local               # Environment variables (create this!)
├── next.config.ts           # Next.js configuration
├── tailwind.config.ts       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies
```

## Deployment

### Vercel (recommended)

1. Push to GitHub
2. Import repository in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard (same as `.env.local`)
4. Deploy

**Note**: Vercel automatically detects Next.js and sets correct build settings.

### Other platforms

```bash
pnpm build   # Creates .next/ directory
pnpm start   # Runs production server on port 3000
```

Ensure environment variables are set on your hosting platform.

## Features explained

### Real-time updates

Uses Firebase `onValue()` listeners with automatic reconnection:

```typescript
const sensorRef = ref(database, 'sensors/temperature');
const sensorQuery = query(
  sensorRef,
  orderByChild('timestamp'),
  limitToLast(20)
);

onValue(sensorQuery, (snapshot) => {
  // Updates automatically when ESP32 pushes new data
});
```

### Data conversions

Raw ADC values (0-4095) are converted to percentages in `lib/utils.ts`:
- Light: inverted (darker = higher value)
- Gas: direct mapping
- Flame: inverted (fire = lower value)
- Soil moisture: inverted (wet = higher value)
- Sound: direct mapping

### Route-based theming

Each sensor route has a unique color defined in `lib/route-colors.ts`. The Header component applies the theme dynamically.

## Troubleshooting

### "Failed to fetch data"
- Check Firebase Database URL in `.env.local`
- Verify Firebase Realtime Database rules allow read access
- Ensure ESP32 is uploading data (check Firebase console)

### "Module not found"
```bash
rm -rf node_modules .next
pnpm install
pnpm dev
```

### Build errors
- Check TypeScript errors: `pnpm tsc --noEmit`
- Update dependencies: `pnpm update`

## License

See root repository for license information.

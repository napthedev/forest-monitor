# Forest Monitor (ESP32 + Firebase + Next.js + FreeRTOS)

Realtime environmental monitoring: an ESP32 reads sensors, pushes data to Firebase Realtime Database, a Next.js dashboard renders live charts, and a scheduled GitHub Actions job deletes old records.

## Demo

Live demo: https://forest-monitor.vercel.app/

![Forest Monitor dashboard](assets/website-demo.jpg)

![Hardware components](assets/components.jpg)

![Cleanup workflow demo](assets/clean-up-demo.jpg)

## End-to-end flow

ESP32 sensors
→ connect to WiFi (primary / enterprise fallback)
→ write readings to Firebase Realtime Database
→ Next.js dashboard subscribes and displays live updates
→ GitHub Actions runs a daily cleanup job
→ cleanup deletes records older than the retention window

## What’s in this repo

- `esp32/` — PlatformIO firmware
	- WiFi: primary WPA2-Personal, fallback WPA2-Enterprise
	- Uploads readings under `sensors/<type>/<push-id>` with server timestamps
- `web/` — Next.js dashboard
	- Subscribes with `orderByChild('timestamp')` + `limitToLast(20)` + `onValue(...)`
- `cronjob/` — cleanup script + GitHub Actions workflow
	- Runs daily at 00:00 UTC via `.github/workflows/delete-old-records.yml`
	- Deletes records older than 3 days (configurable in `cronjob/src/index.ts`)
## FreeRTOS architecture

The ESP32 firmware leverages **FreeRTOS** for concurrent task execution across both CPU cores, enabling efficient multi-tasking with proper resource isolation.

### Task structure

Three independent tasks run concurrently:

| Task | Core | Priority | Stack | Responsibility |
|---|---:|---:|---:|---|
| **SensorTask** | 1 | 2 | 4096 | Read analog/digital sensors every 1s, handle interrupts (motion, vibration), push data to queue |
| **CloudTask** | 0 | 1 | 8192 | Maintain WiFi connection, batch sensor readings (10 per batch or 10s intervals), upload to Firebase |
| **UITask** | 1 | 1 | 2048 | Update 20×4 LCD display every 500ms with WiFi status, IP, Firebase state, sync time |

### Inter-task communication

- **`sensorDataQueue`**: Sensor readings flow from SensorTask → CloudTask (size: 10)
- **`eventQueue`**: Motion/vibration events flow from SensorTask → CloudTask (size: 20)
- **`i2cMutex`**: Protects shared I2C bus between LCD (UITask) and DHT11 sensor (SensorTask)

### Key benefits

- **Parallel execution**: Sensor reading (Core 1) runs independently from network operations (Core 0)
- **Decoupling**: Tasks communicate via queues, preventing blocking
- **Batching**: CloudTask accumulates 10 readings before uploading, reducing Firebase API calls
- **Responsive UI**: Display updates at 2 Hz regardless of network latency
- **Interrupt-driven events**: Motion/vibration use ISRs + task notifications for instant detection
## ESP32 sensor pin mapping

Pin assignments are defined in `esp32/src/main.cpp`.

| Sensor | Reading(s) | ESP32 pin (GPIO) | Input type |
|---|---|---:|---|
| Light sensor | `light` | 36 | Analog (ADC) |
| Gas sensor (MQ-*) | `gas` | 39 | Analog (ADC) |
| Flame sensor | `flame` | 34 | Analog (ADC) |
| Soil moisture sensor | `soil-moisture` | 35 | Analog (ADC) |
| Sound sensor | `sound` | 32 | Analog (ADC) |
| PIR motion sensor | `motion` | 23 | Digital |
| Vibration sensor | `vibration` | 19 | Digital |
| DHT11 | `temperature`, `humidity` | 18 | Digital |

### LCD screen pin mapping (I2C)

The 20x4 LCD display uses I2C communication and is defined in `esp32/lib/DisplayManager/DisplayManager.cpp`.

| LCD Pin | ESP32 GPIO | Purpose |
|---|---:|---|
| SDA | 21 | I2C data line |
| SCL | 22 | I2C clock line |

- **I2C Address**: `0x27` (default, configurable in `DisplayManager.h`)
- **Display Size**: 20 columns × 4 rows

## Quick start

1. **ESP32**: configure WiFi + Firebase credentials in `esp32/include/secrets.h`, then build/upload.
	 - Details: [esp32/README.md](esp32/README.md)
2. **Web**: set Firebase client env vars in `web/.env.local`, then run `pnpm install && pnpm dev`.
	 - Details: [web/README.md](web/README.md)
3. **Cleanup**: add GitHub Actions secrets `FIREBASE_DATABASE_URL` and `FIREBASE_AUTH_TOKEN`.
	 - Details: [cronjob/SETUP.md](cronjob/SETUP.md)

## Notes

- `web/.env.local` and `esp32/include/secrets.h` are intentionally ignored—don’t commit secrets.


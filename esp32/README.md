# ESP32 Forest Monitor — Firmware

ESP32 firmware for the Forest Monitor project using FreeRTOS multi-core architecture.

## Features

- **Multi-core FreeRTOS architecture**: 3 concurrent tasks across 2 CPU cores
- **Dual WiFi support**: WPA2-Personal (primary) with WPA2-Enterprise fallback
- **Batch uploads**: Accumulates 10 readings before uploading to Firebase
- **Queue-based communication**: 100-item sensor queue, 100-item event queue
- **LCD display**: 20×4 I2C display showing real-time status
- **Interrupt-driven events**: Hardware interrupts for motion/vibration with 3s debouncing
- **Overflow protection**: Tracks and displays dropped packets
- **ADC1-only analog sensors**: WiFi-safe pin assignments

## Hardware requirements

- ESP32 DevKit (NodeMCU-32S or compatible)
- 5× analog sensors (light, gas, flame, soil moisture, sound)
- 3× digital sensors (DHT11 temp/humidity, PIR motion, vibration)
- 20×4 I2C LCD display (address 0x27)
- USB cable for programming

## Project structure

```
esp32/
├── platformio.ini          # PlatformIO config (board, libraries, settings)
├── include/
│   ├── DataTypes.h        # SensorData & EventData structs
│   └── secrets.h          # WiFi & Firebase credentials (create this!)
├── lib/                   # Custom libraries
│   ├── WiFiManager/       # Dual WiFi with fallback & reconnection
│   ├── AnalogSensors/     # 5 ADC1 sensors (light, gas, flame, soil, sound)
│   ├── DigitalSensors/    # DHT11 + interrupt handlers (motion, vibration)
│   ├── DisplayManager/    # LCD I2C with mutex protection
│   ├── FirebaseManager/   # Batch uploads + authentication
│   └── PushId/            # Firebase push ID generator
└── src/
    ├── main.cpp           # Entry point: setup() creates tasks
    └── tasks/
        ├── SensorTask.cpp # Core 1 Priority 2: Read sensors every 1s
        ├── CloudTask.cpp  # Core 0 Priority 1: Upload batches every 10s
        └── UITask.cpp     # Core 1 Priority 1: Update LCD every 500ms
```

## Configuration

### 1. Create `include/secrets.h`

**Important**: This file is gitignored. Do not commit credentials.

```cpp
#pragma once

// Primary WiFi (WPA2-Personal)
#define PRIMARY_WIFI_SSID "YourHomeNetwork"
#define PRIMARY_WIFI_PASSWORD "your-password"

// Secondary WiFi (WPA2-Enterprise - fallback)
#define SECONDARY_WIFI_SSID "UniversityNetwork"
#define SECONDARY_WIFI_IDENTITY "your@university.edu"
#define SECONDARY_WIFI_USERNAME "your@university.edu"
#define SECONDARY_WIFI_PASSWORD "your-password"

// Firebase Realtime Database
#define FIREBASE_HOST_URL "https://your-project.firebaseio.com"
#define FIREBASE_AUTH_TOKEN "your-legacy-database-secret"
```

**WiFi behavior**: System tries primary WiFi first. On failure, falls back to secondary after 10 seconds.

### 2. Pin configuration

Pins are defined in library headers:
- **Analog sensors** (`lib/AnalogSensors/AnalogSensors.h`): GPIO 32, 34, 35, 36, 39 (ADC1 only)
- **Digital sensors** (`lib/DigitalSensors/DigitalSensors.h`): GPIO 18 (DHT11), 23 (PIR), 19 (vibration)
- **LCD I2C** (`lib/DisplayManager/DisplayManager.h`): GPIO 21 (SDA), 22 (SCL)

## Building and uploading

### Prerequisites
- [VS Code](https://code.visualstudio.com/)
- [PlatformIO extension](https://platformio.org/install/ide?install=vscode)

### Commands

```bash
# Build only
pio run

# Upload to ESP32
pio run -t upload

# Upload + monitor serial output
pio run -t upload -t monitor

# Monitor only (after upload)
pio run -t monitor

# Clean build
pio run -t clean
```

### Expected serial output

```
=== ESP32 Forest Monitor - FreeRTOS Version ===
Queues and mutex created successfully.
Sensor Task created on Core 1 (Priority 2)
Cloud Task created on Core 0 (Priority 1)
UI Task created on Core 1 (Priority 1)

=== All tasks started successfully ===

Cloud Task started on Core 0
Attempting primary WiFi (WPA2-Personal)...
Connected to primary WiFi
IP address: 192.168.1.100
Firebase initialized.

Sensor Task started on Core 1
Analog sensors initialized (ADC1 pins)
DHT11 sensor initialized.
Digital sensor interrupts attached.

UI Task started on Core 1

Sensor data queued: Light=1234, Gas=567, Flame=890, Soil=2345, Sound=123
Temperature: 25.5°C, Humidity: 60.0%
Added to batch (1/10)

[... every 1 second ...]

--------------------------------
Uploading batch of 10 sensor readings...
Batch sensor data pushed successfully.
Batch uploaded successfully!

Motion event detected! Uploading...
motion event uploaded successfully.
```

## FreeRTOS task details

| Task | Core | Priority | Stack | Interval | Function |
|---|---:|---:|---:|---|---|
| **SensorTask** | 1 | 2 (High) | 4KB | 1s | Read all sensors, handle interrupts, queue data |
| **CloudTask** | 0 | 1 (Low) | 8KB | 10s | Maintain WiFi, batch & upload to Firebase |
| **UITask** | 1 | 1 (Low) | 2KB | 500ms | Update LCD with status info |

### Communication
- **sensorDataQueue**: 100 items, `SensorData` structs (52 bytes each)
- **eventQueue**: 100 items, `EventData` structs (16 bytes each)
- **i2cMutex**: Protects LCD I2C bus

### Timing
- Sensor reading: every 1 second
- Firebase upload: every 10 seconds OR when batch reaches 10 items
- LCD update: every 500ms
- WiFi check: every 5 seconds

## Dependencies (platformio.ini)

```ini
lib_deps = 
    mobizt/FirebaseClient           # Firebase Realtime Database
    adafruit/DHT sensor library     # DHT11 temp/humidity
    marcoschwartz/LiquidCrystal_I2C # LCD I2C display
```

## Troubleshooting

### Compile errors
```bash
pio run -v  # Verbose output
```

### Connection issues
- Verify `secrets.h` credentials
- Check serial monitor for WiFi connection attempts
- Ensure Firebase URL format: `https://your-project.firebaseio.com` (no trailing slash)

### Queue full messages
- Increase queue size in `main.cpp` (line ~60)
- Check WiFi stability (slow uploads cause backlog)
- Monitor dropped packet count on LCD

### Watchdog resets
- Ensure all tasks use `vTaskDelay()` not `delay()`
- Check for infinite loops without yields

### Stack overflow
- Uncomment stack monitor in `main.cpp` loop()
- Increase stack size in task creation calls

## Advanced configuration

### Adjust batch size
Edit `esp32/src/tasks/CloudTask.cpp`:
```cpp
#define BATCH_SIZE 10  // Change to 5-20
```

### Change upload interval
Edit `esp32/src/tasks/CloudTask.cpp`:
```cpp
#define UPLOAD_INTERVAL_MS 10000  // Change to 5000-30000
```

### Modify debounce time
Edit `esp32/src/tasks/SensorTask.cpp`:
```cpp
#define EVENT_DEBOUNCE_MS 3000  // Change to 1000-5000
```

## Performance

- **Sensor latency**: 1 second (guaranteed by scheduler)
- **Event response**: <10ms (interrupt to queue)
- **LCD refresh**: 500ms
- **Firebase batch**: 10 seconds or when full
- **Memory overhead**: ~20KB (queues + stacks)

## License

See root repository for license information.

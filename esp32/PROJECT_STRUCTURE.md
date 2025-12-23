# ESP32 Forest Monitor - Project Structure

## Complete File Tree

```
esp32/
├── platformio.ini                    # PlatformIO configuration
├── README.md                         # Original project documentation
├── REFACTORING_GUIDE.md             # This refactoring documentation
│
├── include/
│   ├── DataTypes.h                  # Shared data structures (SensorData, EventData)
│   └── secrets.h                    # WiFi and Firebase credentials
│
├── lib/
│   ├── WiFiManager/
│   │   ├── WiFiManager.h           # WiFi connection management (header)
│   │   └── WiFiManager.cpp         # WiFi implementation with fallback
│   │
│   ├── AnalogSensors/
│   │   ├── AnalogSensors.h         # Analog sensor interface (header)
│   │   └── AnalogSensors.cpp       # ADC1 sensor readings
│   │
│   ├── DigitalSensors/
│   │   ├── DigitalSensors.h        # Digital sensor interface (header)
│   │   └── DigitalSensors.cpp      # DHT11 + interrupt handlers
│   │
│   ├── DisplayManager/
│   │   ├── DisplayManager.h        # LCD display interface (header)
│   │   └── DisplayManager.cpp      # I2C LCD with mutex protection
│   │
│   ├── FirebaseManager/
│   │   ├── FirebaseManager.h       # Firebase interface (header)
│   │   └── FirebaseManager.cpp     # Batch upload + authentication
│   │
│   └── PushId/
│       ├── PushId.h                # Firebase push ID generator (header)
│       └── PushId.cpp              # Local unique ID generation
│
└── src/
    ├── main.cpp                     # Entry point: setup() and loop()
    │
    └── tasks/
        ├── SensorTask.cpp           # Core 1, Priority 2: Sensor reading
        ├── CloudTask.cpp            # Core 0, Priority 1: WiFi + Firebase
        └── UITask.cpp               # Core 1, Priority 1: LCD updates
```

## File Responsibilities

### Main Entry Point
- **main.cpp** (138 lines)
  - Creates FreeRTOS queues and mutex
  - Initializes manager objects
  - Creates three tasks with `xTaskCreatePinnedToCore()`
  - Minimal `loop()` with just `vTaskDelay()`

### Core Data Structures
- **DataTypes.h** (49 lines)
  - `SensorData`: 9 sensor values + timestamps + validity flags
  - `EventType`: MOTION, VIBRATION enum
  - `EventData`: Event type + timestamp

### Module Libraries

#### WiFiManager (114 lines total)
- **WiFiManager.h**: Class interface with connection methods
- **WiFiManager.cpp**: 
  - WPA2-Personal connection (primary)
  - WPA2-Enterprise connection (secondary)
  - Exponential backoff reconnection
  - Status checking methods

#### AnalogSensors (68 lines total)
- **AnalogSensors.h**: Sensor pin definitions + interface
- **AnalogSensors.cpp**:
  - Read light, gas, flame, soil moisture sensors
  - Sound value sampling with `taskYIELD()`
  - All use ADC1 pins (WiFi-safe)

#### DigitalSensors (92 lines total)
- **DigitalSensors.h**: Interrupt bit masks + interface
- **DigitalSensors.cpp**:
  - DHT11 temperature/humidity reading
  - PIR and vibration ISR handlers
  - `xTaskNotifyFromISR()` for event notification
  - Minimal ISR implementation

#### DisplayManager (121 lines total)
- **DisplayManager.h**: LCD configuration + interface
- **DisplayManager.cpp**:
  - Custom character registration (WiFi, IP, Firebase, Sync icons)
  - Mutex-protected LCD operations
  - Status display with WiFi, IP, Firebase, sync info
  - Dropped packet counter display

#### FirebaseManager (154 lines total)
- **FirebaseManager.h**: Firebase methods + interface
- **FirebaseManager.cpp**:
  - Firebase initialization and authentication
  - Batch JSON building for multiple sensor readings
  - Single atomic update for entire batch
  - Immediate event uploads (motion/vibration)
  - Server-side timestamp injection

### Task Implementations

#### SensorTask.cpp (110 lines)
- Runs on Core 1, Priority 2 (highest)
- Reads all 5 analog sensors every 1 second
- Reads DHT11 with I2C mutex protection
- Packages data into `SensorData` struct
- Non-blocking queue send with drop detection
- Handles interrupt notifications from ISRs
- Applies 3-second debouncing to events
- Sends events to event queue

#### CloudTask.cpp (87 lines)
- Runs on Core 0, Priority 1
- Initializes WiFi and Firebase on task start
- Maintains Firebase connection with `app.loop()`
- Checks WiFi every 5 seconds
- Receives sensor data with 100ms timeout
- Accumulates batch of up to 10 readings
- Uploads every 10 seconds OR when batch full
- Processes event queue for immediate uploads

#### UITask.cpp (38 lines)
- Runs on Core 1, Priority 1
- Updates LCD every 500ms (prevents flicker)
- Gets status from WiFiManager and FirebaseManager
- Displays WiFi SSID, IP, Firebase status, sync time
- Shows dropped packet count
- Mutex protection handled by DisplayManager

## Dependencies (platformio.ini)

```ini
[env:nodemcu-32s]
platform = espressif32
board = nodemcu-32s
framework = arduino

lib_deps = 
    mobizt/FirebaseClient          # Firebase Realtime Database
    adafruit/DHT sensor library    # DHT11 temp/humidity
    marcoschwartz/LiquidCrystal_I2C # LCD display

monitor_speed = 115200
```

## Memory Usage

### RAM Allocation
- **Queues**:
  - sensorDataQueue: 10 × 52 bytes = 520 bytes
  - eventQueue: 20 × 16 bytes = 320 bytes
- **Task Stacks**:
  - SensorTask: 4096 bytes
  - CloudTask: 8192 bytes
  - UITask: 2048 bytes
- **Total**: ~15 KB for FreeRTOS overhead

### Flash Usage
- Modules: ~12 KB
- Tasks: ~6 KB
- Total added: ~18 KB over original

## Build and Deploy

```bash
# Build the project
pio run

# Upload to ESP32
pio run -t upload

# Upload and monitor serial output
pio run -t upload -t monitor

# Clean build
pio run -t clean
```

## Serial Monitor Output Example

```
=== ESP32 Forest Monitor - FreeRTOS Version ===
Queues and mutex created successfully.
Sensor Task created on Core 1 (Priority 2)
Cloud Task created on Core 0 (Priority 1)
UI Task created on Core 1 (Priority 1)

=== All tasks started successfully ===

Cloud Task started on Core 0
Attempting primary WiFi (WPA2-Personal)...
SSID: MyHomeNetwork
....................
Connected to primary WiFi
IP address: 192.168.1.100
Firebase Client v4.x.x
Initializing Firebase app...
Firebase initialized.

Sensor Task started on Core 1
Analog sensors initialized (ADC1 pins)
DHT11 sensor initialized.
PIR sensor initialized.
Vibration sensor initialized.
Digital sensor interrupts attached.

UI Task started on Core 1

Sensor data queued: Light=1234, Gas=567, Flame=890, Soil=2345, Sound=123
Temperature: 25.5°C, Humidity: 60.0%
Added to batch (1/10)

[... every 1 second ...]
Sensor data queued: Light=1240, Gas=570, Flame=885, Soil=2350, Sound=120
Temperature: 25.6°C, Humidity: 59.8%
Added to batch (2/10)

[... after 10 seconds ...]
--------------------------------
Uploading batch of 10 sensor readings...
Batch sensor data pushed successfully.
Batch uploaded successfully!

Motion event queued.
Motion event detected! Uploading...
motion event uploaded successfully.
```

## Configuration

All sensitive credentials are in `include/secrets.h`:

```cpp
// Primary WiFi (WPA2-Personal)
#define PRIMARY_WIFI_SSID "YourHomeNetwork"
#define PRIMARY_WIFI_PASSWORD "YourPassword"

// Secondary WiFi (WPA2-Enterprise)
#define SECONDARY_WIFI_SSID "UniversityNetwork"
#define SECONDARY_WIFI_IDENTITY "your@university.edu"
#define SECONDARY_WIFI_USERNAME "your@university.edu"
#define SECONDARY_WIFI_PASSWORD "YourPassword"

// Firebase
#define FIREBASE_HOST_URL "https://your-project.firebaseio.com"
#define FIREBASE_AUTH_TOKEN "your-legacy-token-here"
```

## Testing Checklist

- [ ] Compile without errors
- [ ] All tasks start successfully
- [ ] WiFi connects (primary or fallback)
- [ ] Firebase initializes
- [ ] Sensors read every 1 second
- [ ] LCD updates every 500ms
- [ ] Batch upload every 10 seconds
- [ ] Motion detection triggers immediate upload
- [ ] Vibration detection triggers immediate upload
- [ ] Queue full message appears when overloaded
- [ ] LCD shows dropped packet count
- [ ] WiFi reconnection works after disconnect
- [ ] No watchdog resets
- [ ] Sound sensor sampling doesn't block

## Troubleshooting Commands

```bash
# Check compile errors
pio run

# Clean and rebuild
pio run -t clean && pio run

# Monitor serial output only
pio device monitor

# Get detailed build output
pio run -v

# List available boards
pio boards espressif32
```

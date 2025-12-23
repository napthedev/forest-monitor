# ESP32 Forest Monitor - FreeRTOS Refactoring

## Overview

This project has been refactored from a monolithic single-loop architecture to a professional multi-core, multi-task FreeRTOS system. The refactoring improves responsiveness, prevents blocking operations from affecting sensors, and separates concerns into logical modules.

## Architecture

### Multi-Core Task Distribution

| Task Name | Core | Priority | Stack | Responsibility |
|-----------|------|----------|-------|----------------|
| **SensorTask** | 1 | 2 (High) | 4096 | Read all sensors, handle interrupts, debouncing |
| **CloudTask** | 0 | 1 (Low) | 8192 | WiFi management, Firebase uploads |
| **UITask** | 1 | 1 (Low) | 2048 | LCD display updates |

### Timing Intervals

- **Analog Sensors**: Read every 1 second
- **Digital Sensors**: Interrupt-driven (instant response)
- **Firebase Upload**: Every 10 seconds (batch mode)
- **LCD Update**: Every 500ms
- **WiFi Check**: Every 5 seconds

## Module Structure

### Data Types (`include/DataTypes.h`)
- `SensorData` struct: Holds all 9 sensor values with validity flags
- `EventType` enum: MOTION, VIBRATION
- `EventData` struct: Event type and timestamp

### WiFi Manager (`lib/WiFiManager/`)
- Dual WiFi support (WPA2-Personal + WPA2-Enterprise)
- Automatic fallback mechanism
- Exponential backoff reconnection (500ms → 1s → 2s → 4s)
- Non-blocking connection checks

### Analog Sensors (`lib/AnalogSensors/`)
- Light sensor (GPIO36 - ADC1_CH0)
- Gas sensor (GPIO39 - ADC1_CH3)
- Flame sensor (GPIO34 - ADC1_CH6)
- Soil moisture (GPIO35 - ADC1_CH7)
- Sound sensor (GPIO32 - ADC1_CH4)
- All use ADC1 (WiFi-safe)

### Digital Sensors (`lib/DigitalSensors/`)
- PIR motion sensor (GPIO23) - Interrupt-driven
- Vibration sensor (GPIO19) - Interrupt-driven
- DHT11 temp/humidity (GPIO18) - I2C with mutex protection
- ISR handlers use `xTaskNotifyFromISR()` for minimal interrupt time

### Display Manager (`lib/DisplayManager/`)
- LCD I2C (20x4) with custom characters
- Mutex-protected I2C operations
- Shows WiFi status, IP, Firebase status, sync time, dropped packets

### Firebase Manager (`lib/FirebaseManager/`)
- Batch upload (6-10 readings per upload)
- Immediate event uploads (motion/vibration)
- Server-side timestamps
- Encapsulated Firebase objects

## Inter-Task Communication

### Queues
- **sensorDataQueue**: Size 10, holds `SensorData` packets
- **eventQueue**: Size 20, holds `EventData` for motion/vibration

### Mutex
- **i2cMutex**: Protects I2C bus shared by LCD and DHT11

### Queue Full Detection
- When sensor queue is full, data is dropped with counter increment
- LCD displays dropped packet count
- Serial logs dropped packets for debugging

## Task Details

### Sensor Task (Core 1, Priority 2)
1. Reads all 5 analog sensors every 1 second
2. Reads DHT11 temperature/humidity (with I2C mutex)
3. Packages data into `SensorData` struct
4. Attempts to send to queue (non-blocking)
5. On queue full: increments drop counter, logs warning
6. Checks for interrupt notifications from digital sensors
7. Applies 3-second debouncing to motion/vibration events
8. Sends valid events to event queue

### Cloud Task (Core 0, Priority 1)
1. Initializes WiFi on task start (not in `setup()`)
2. Initializes Firebase authentication
3. Checks WiFi connection every 5 seconds
4. Receives `SensorData` from queue with 100ms timeout
5. Accumulates data into batch (up to 10 readings)
6. Uploads batch every 10 seconds OR when batch is full
7. Processes event queue for immediate uploads
8. Maintains Firebase connection with `app.loop()`

### UI Task (Core 1, Priority 1)
1. Updates LCD every 500ms
2. Takes I2C mutex before LCD operations
3. Displays WiFi SSID and IP address
4. Shows Firebase connection status
5. Shows time since last successful sync
6. Shows dropped packet count (if any)

## Key Improvements

### 1. No More Blocking
- WiFi connection happens in Cloud Task on Core 0
- If WiFi hangs, sensors continue reading on Core 1
- Sound sampling uses `taskYIELD()` to prevent watchdog

### 2. Proper Resource Sharing
- I2C mutex prevents bus conflicts between LCD and DHT11
- Queue-based communication prevents data races

### 3. Queue Overflow Handling
- Non-blocking queue send with timeout
- Dropped packet counter for diagnostics
- LCD displays when data loss occurs

### 4. Interrupt-Driven Events
- PIR and vibration use hardware interrupts
- ISRs are minimal (read GPIO, notify task)
- Debouncing moved to task context (safe)
- `portYIELD_FROM_ISR()` ensures responsiveness

### 5. Batch Uploads
- Reduces HTTPS overhead by 10x
- Single atomic Firebase update per batch
- Immediate upload for critical events (motion/vibration)

### 6. ADC Pin Safety
- All analog sensors on ADC1 (GPIO 32, 34, 35, 36, 39)
- ADC2 avoided (WiFi conflict)
- Input-only pins used correctly (34, 35, 36, 39)

### 7. Exponential Backoff
- WiFi reconnection delays increase: 500ms → 1s → 2s → 4s
- Prevents connection spam during outages
- Automatic restart after 10 failed attempts

## Building and Flashing

```bash
cd esp32
pio run -t upload -t monitor
```

## Monitoring

Serial output shows:
- Task creation confirmations
- Sensor readings every 1 second
- Batch uploads every 10 seconds
- Queue status (drops, batch size)
- WiFi reconnection attempts
- Event detections (motion, vibration)

## Troubleshooting

### Stack Overflow
- Uncomment stack monitor in `loop()`
- Check high water marks for each task
- Increase stack size if needed

### Queue Full Messages
- Increase queue size in `main.cpp`
- Speed up Firebase uploads
- Check WiFi connection stability

### Watchdog Resets
- Ensure all tasks use `vTaskDelay()` not `delay()`
- Check for infinite loops without yields
- Verify `taskYIELD()` in sound sampling

### I2C Bus Errors
- Verify mutex is created before tasks start
- Check mutex timeout values
- Ensure all I2C operations are mutex-protected

## Performance Characteristics

- **Sensor Responsiveness**: 1 second (guaranteed by FreeRTOS scheduler)
- **Event Response Time**: <10ms (interrupt to queue)
- **LCD Update Latency**: 500ms max
- **Firebase Batch Interval**: 10 seconds (or when full)
- **WiFi Check Interval**: 5 seconds
- **Memory Overhead**: ~15KB for queues and stacks

## Future Enhancements

1. Add OTA (Over-The-Air) updates task
2. Implement task watchdog monitoring
3. Add deep sleep mode for battery operation
4. Create web configuration portal
5. Add SD card logging fallback
6. Implement sensor calibration task
7. Add time synchronization (NTP)

#include "AnalogSensors.h"
#include "DigitalSensors.h"
#include <Arduino.h>
#include <DataTypes.h>

// External references to global objects (defined in main.cpp)
extern QueueHandle_t sensorDataQueue;
extern QueueHandle_t eventQueue;
extern SemaphoreHandle_t i2cMutex;
extern uint32_t droppedPacketCount;

// Sensor objects
AnalogSensors analogSensors;
DigitalSensors digitalSensors;

// Debounce tracking
#define EVENT_DEBOUNCE_MS 3000
unsigned long lastMotionEventTime = 0;
unsigned long lastVibrationEventTime = 0;

// Task function declaration
void sensorTask(void *parameter);

// Handle event notifications from ISRs with debouncing
void handleEventNotifications(uint32_t notificationValue) {
  unsigned long now = millis();

  // Check for motion event
  if (notificationValue & MOTION_EVENT_BIT) {
    // Apply debouncing
    if (now - lastMotionEventTime >= EVENT_DEBOUNCE_MS) {
      lastMotionEventTime = now;

      // Create event data
      EventData event(MOTION, now);

      // Try to send to event queue (non-blocking)
      if (xQueueSend(eventQueue, &event, 0) != pdTRUE) {
        Serial.println("Event queue full! Motion event dropped.");
      } else {
        Serial.println("Motion event queued.");
      }
    }
  }

  // Check for vibration event
  if (notificationValue & VIBRATION_EVENT_BIT) {
    // Apply debouncing
    if (now - lastVibrationEventTime >= EVENT_DEBOUNCE_MS) {
      lastVibrationEventTime = now;

      // Create event data
      EventData event(VIBRATION, now);

      // Try to send to event queue (non-blocking)
      if (xQueueSend(eventQueue, &event, 0) != pdTRUE) {
        Serial.println("Event queue full! Vibration event dropped.");
      } else {
        Serial.println("Vibration event queued.");
      }
    }
  }
}

// Sensor task: Reads all sensors and pushes to queue
void sensorTask(void *parameter) {
  Serial.println("Sensor Task started on Core 1");

  // Initialize sensors
  analogSensors.begin();
  digitalSensors.begin();

  // Setup interrupts (this task's handle is already available)
  digitalSensors.setupInterrupts(xTaskGetCurrentTaskHandle());

  TickType_t lastWakeTime = xTaskGetTickCount();
  const TickType_t readInterval = pdMS_TO_TICKS(1000); // 1 second

  while (true) {
    // Read all analog sensors
    SensorData data;
    data.lightValue = analogSensors.readLight();
    data.gasValue = analogSensors.readGas();
    data.flameValue = analogSensors.readFlame();
    data.soilMoistureValue = analogSensors.readSoilMoisture();
    data.soundValue = analogSensors.readSoundValue();

    // Read DHT11 sensor (single-wire protocol, no mutex needed)
    data.temperature = digitalSensors.readTemperature();
    data.humidity = digitalSensors.readHumidity();

    // Validate readings
    data.temperatureValid = digitalSensors.isValidReading(data.temperature);
    data.humidityValid = digitalSensors.isValidReading(data.humidity);

    data.timestamp = millis();

    // Try to send to queue (non-blocking, implement queue full detection)
    if (xQueueSend(sensorDataQueue, &data, 0) != pdTRUE) {
      // Queue is full, drop data and increment counter
      droppedPacketCount++;
      Serial.printf(
          "Sensor data queue full! Packet dropped. Total dropped: %u\n",
          droppedPacketCount);
    } else {
      Serial.printf(
          "Sensor data queued: Light=%d, Gas=%d, Flame=%d, Soil=%d, Sound=%d\n",
          data.lightValue, data.gasValue, data.flameValue,
          data.soilMoistureValue, data.soundValue);
      if (data.temperatureValid && data.humidityValid) {
        Serial.printf("Temperature: %.1f°C, Humidity: %.1f%%\n",
                      data.temperature, data.humidity);
      }
    }

    // Check for event notifications from ISRs (non-blocking)
    uint32_t notificationValue = 0;
    if (xTaskNotifyWait(0, 0xFFFFFFFF, &notificationValue, 0) == pdTRUE) {
      handleEventNotifications(notificationValue);
    }

    // Wait for next read interval (precise timing)
    vTaskDelayUntil(&lastWakeTime, readInterval);
  }
}

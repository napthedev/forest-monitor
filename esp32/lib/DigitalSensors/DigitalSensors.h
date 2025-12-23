#ifndef DIGITAL_SENSORS_H
#define DIGITAL_SENSORS_H

#include "../../include/DataTypes.h"
#include <Arduino.h>
#include <DHT.h>

// Pin definitions
#define PIR_SENSOR_PIN 23
#define VIBRATION_SENSOR_PIN 19
#define DHT_SENSOR_PIN 18
#define DHTTYPE DHT11

// Task notification bits for events
#define MOTION_EVENT_BIT (1 << 0)
#define VIBRATION_EVENT_BIT (1 << 1)

class DigitalSensors {
public:
  // Constructor
  DigitalSensors();

  // Initialize sensors and setup interrupts
  void begin();

  // Setup interrupts with task handle for notifications
  void setupInterrupts(TaskHandle_t sensorTaskHandle);

  // Read DHT11 temperature
  float readTemperature();

  // Read DHT11 humidity
  float readHumidity();

  // Check if temperature/humidity readings are valid
  bool isValidReading(float value);

  // Get DHT sensor object (for direct access if needed)
  DHT &getDHT();

private:
  DHT _dht;

  // ISR handlers (must be static)
  static void IRAM_ATTR pirISR();
  static void IRAM_ATTR vibrationISR();

  // Static task handle for ISR notifications
  static TaskHandle_t _sensorTaskHandle;
};

#endif // DIGITAL_SENSORS_H

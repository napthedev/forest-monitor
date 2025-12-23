#ifndef DATA_TYPES_H
#define DATA_TYPES_H

#include <Arduino.h>

// Sensor data structure to pass between tasks
struct SensorData {
  // Analog sensor values (12-bit ADC: 0-4095)
  int lightValue;
  int gasValue;
  int flameValue;
  int soilMoistureValue;
  int soundAmplitude;

  // DHT11 sensor values
  float temperature;
  float humidity;

  // Timestamp when data was captured
  unsigned long timestamp;

  // Validity flags
  bool temperatureValid;
  bool humidityValid;

  // Constructor with default values
  SensorData()
      : lightValue(0), gasValue(0), flameValue(0), soilMoistureValue(0),
        soundAmplitude(0), temperature(0.0f), humidity(0.0f), timestamp(0),
        temperatureValid(false), humidityValid(false) {}
};

// Event types for digital sensors
enum EventType { MOTION, VIBRATION };

// Event data structure for digital sensor events
struct EventData {
  EventType type;
  unsigned long timestamp;

  EventData() : type(MOTION), timestamp(0) {}
  EventData(EventType t, unsigned long ts) : type(t), timestamp(ts) {}
};

#endif // DATA_TYPES_H

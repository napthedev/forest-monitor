#ifndef ANALOG_SENSORS_H
#define ANALOG_SENSORS_H

#include <Arduino.h>

// Pin definitions for analog sensors (ADC1 only - WiFi safe)
#define LIGHT_SENSOR_PIN 36         // ADC1_CH0
#define GAS_SENSOR_PIN 39           // ADC1_CH3
#define FLAME_SENSOR_PIN 34         // ADC1_CH6
#define SOIL_MOISTURE_SENSOR_PIN 35 // ADC1_CH7
#define SOUND_SENSOR_PIN 32         // ADC1_CH4

// Sound sensor sampling window duration (100ms)
#define SOUND_SAMPLING_DURATION_MS 100

class AnalogSensors {
public:
  // Constructor
  AnalogSensors();

  // Initialize sensors (if needed)
  void begin();

  // Read individual sensor values
  int readLight();
  int readGas();
  int readFlame();
  int readSoilMoisture();

  // Read sound amplitude over sampling window (non-blocking with yields)
  int readSoundAmplitude();

private:
  // No state needed for basic analog reads
};

#endif // ANALOG_SENSORS_H

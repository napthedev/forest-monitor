#include "AnalogSensors.h"

AnalogSensors::AnalogSensors() {
  // Constructor
}

void AnalogSensors::begin() {
  // ADC pins are input by default, no setup needed
  Serial.println("Analog sensors initialized (ADC1 pins)");
}

int AnalogSensors::readLight() { return analogRead(LIGHT_SENSOR_PIN); }

int AnalogSensors::readGas() { return analogRead(GAS_SENSOR_PIN); }

int AnalogSensors::readFlame() { return analogRead(FLAME_SENSOR_PIN); }

int AnalogSensors::readSoilMoisture() {
  return analogRead(SOIL_MOISTURE_SENSOR_PIN);
}

int AnalogSensors::readSoundAmplitude() {
  unsigned long startTime = millis();
  int minValue = 4095;
  int maxValue = 0;

  // Sample for 100ms with periodic yields to prevent watchdog
  while (millis() - startTime < SOUND_SAMPLING_DURATION_MS) {
    int currentValue = analogRead(SOUND_SENSOR_PIN);
    if (currentValue < minValue) {
      minValue = currentValue;
    }
    if (currentValue > maxValue) {
      maxValue = currentValue;
    }

    // Yield to other tasks periodically (every ~10 samples)
    // This prevents watchdog timer from triggering
    taskYIELD();
  }

  // Calculate peak-to-peak amplitude
  int amplitude = maxValue - minValue;

  Serial.printf("Sound: min=%d, max=%d, amplitude=%d\n", minValue, maxValue,
                amplitude);

  return amplitude;
}

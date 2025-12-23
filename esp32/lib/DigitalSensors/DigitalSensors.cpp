#include "DigitalSensors.h"

// Initialize static member
TaskHandle_t DigitalSensors::_sensorTaskHandle = NULL;

DigitalSensors::DigitalSensors() : _dht(DHT_SENSOR_PIN, DHTTYPE) {
  // Constructor
}

void DigitalSensors::begin() {
  // Initialize DHT11 sensor
  _dht.begin();
  Serial.println("DHT11 sensor initialized.");

  // Initialize PIR sensor pin
  pinMode(PIR_SENSOR_PIN, INPUT);
  Serial.println("PIR sensor initialized.");

  // Initialize vibration sensor pin
  pinMode(VIBRATION_SENSOR_PIN, INPUT);
  Serial.println("Vibration sensor initialized.");
}

void DigitalSensors::setupInterrupts(TaskHandle_t sensorTaskHandle) {
  _sensorTaskHandle = sensorTaskHandle;

  // Attach interrupts for digital sensors (rising edge)
  attachInterrupt(digitalPinToInterrupt(PIR_SENSOR_PIN), pirISR, RISING);
  attachInterrupt(digitalPinToInterrupt(VIBRATION_SENSOR_PIN), vibrationISR,
                  RISING);

  Serial.println("Digital sensor interrupts attached.");
}

float DigitalSensors::readTemperature() { return _dht.readTemperature(); }

float DigitalSensors::readHumidity() { return _dht.readHumidity(); }

bool DigitalSensors::isValidReading(float value) { return !isnan(value); }

DHT &DigitalSensors::getDHT() { return _dht; }

// ISR for PIR motion sensor
void IRAM_ATTR DigitalSensors::pirISR() {
  if (_sensorTaskHandle != NULL) {
    BaseType_t xHigherPriorityTaskWoken = pdFALSE;

    // Notify sensor task about motion event
    xTaskNotifyFromISR(_sensorTaskHandle, MOTION_EVENT_BIT, eSetBits,
                       &xHigherPriorityTaskWoken);

    // Yield if a higher priority task was woken
    if (xHigherPriorityTaskWoken) {
      portYIELD_FROM_ISR();
    }
  }
}

// ISR for vibration sensor
void IRAM_ATTR DigitalSensors::vibrationISR() {
  if (_sensorTaskHandle != NULL) {
    BaseType_t xHigherPriorityTaskWoken = pdFALSE;

    // Notify sensor task about vibration event
    xTaskNotifyFromISR(_sensorTaskHandle, VIBRATION_EVENT_BIT, eSetBits,
                       &xHigherPriorityTaskWoken);

    // Yield if a higher priority task was woken
    if (xHigherPriorityTaskWoken) {
      portYIELD_FROM_ISR();
    }
  }
}

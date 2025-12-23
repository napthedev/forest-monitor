#include "DisplayManager.h"
#include "FirebaseManager.h"
#include "WiFiManager.h"
#include <Arduino.h>

// External references to global objects (defined in main.cpp)
extern SemaphoreHandle_t i2cMutex;
extern DisplayManager displayManager;
extern WiFiManager wifiManager;
extern FirebaseManager firebaseManager;
extern unsigned long lastSuccessfulSync;
extern uint32_t droppedPacketCount;

// Task function declaration
void uiTask(void *parameter);

// UI task: LCD display updates
void uiTask(void *parameter) {
  Serial.println("UI Task started on Core 1");

  TickType_t lastWakeTime = xTaskGetTickCount();
  const TickType_t updateInterval = pdMS_TO_TICKS(500); // 500ms

  while (true) {
    // Get current status information
    String ssid = wifiManager.isConnected() ? wifiManager.getSSID() : "";
    String ip = wifiManager.isConnected() ? wifiManager.getIP() : "";
    bool firebaseReady = firebaseManager.isReady();

    // Update display (mutex is handled inside DisplayManager)
    displayManager.updateStatus(ssid, ip, firebaseReady, lastSuccessfulSync,
                                droppedPacketCount);

    // Wait for next update interval (precise timing)
    vTaskDelayUntil(&lastWakeTime, updateInterval);
  }
}

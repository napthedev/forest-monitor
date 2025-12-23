#include "FirebaseManager.h"
#include "WiFiManager.h"
#include "secrets.h"
#include <Arduino.h>
#include <DataTypes.h>

// External references to global objects (defined in main.cpp)
extern QueueHandle_t sensorDataQueue;
extern QueueHandle_t eventQueue;
extern WiFiManager wifiManager;
extern FirebaseManager firebaseManager;
extern unsigned long lastSuccessfulSync;

// Batch configuration
#define BATCH_SIZE 10
#define UPLOAD_INTERVAL_MS 10000 // 10 seconds

// Task function declaration
void cloudTask(void *parameter);

// Cloud task: WiFi management and Firebase uploads
void cloudTask(void *parameter) {
  Serial.println("Cloud Task started on Core 0");

  // Initialize WiFi
  wifiManager.connectWithFallback();

  // Initialize Firebase
  firebaseManager.begin();

  // Batch storage
  SensorData batchData[BATCH_SIZE];
  int batchCount = 0;

  unsigned long lastUploadTime = millis();
  unsigned long lastWifiCheck = millis();

  while (true) {
    // Maintain Firebase connection
    firebaseManager.loop();

    // Check WiFi connection every 5 seconds
    if (millis() - lastWifiCheck >= 5000) {
      lastWifiCheck = millis();
      wifiManager.checkConnection();
    }

    // Try to receive sensor data (non-blocking with timeout)
    SensorData data;
    if (xQueueReceive(sensorDataQueue, &data, pdMS_TO_TICKS(100)) == pdTRUE) {
      // Add to batch
      if (batchCount < BATCH_SIZE) {
        batchData[batchCount++] = data;
        Serial.printf("Added to batch (%d/%d)\n", batchCount, BATCH_SIZE);
      }
    }

    // Upload batch when:
    // 1. Batch is full, OR
    // 2. 10 seconds have passed since last upload (and batch has data)
    bool batchFull = (batchCount >= BATCH_SIZE);
    bool uploadIntervalPassed =
        (millis() - lastUploadTime >= UPLOAD_INTERVAL_MS);

    if (batchCount > 0 && (batchFull || uploadIntervalPassed)) {
      if (firebaseManager.isReady()) {
        Serial.printf("Uploading batch of %d readings...\n", batchCount);

        if (firebaseManager.uploadBatch(batchData, batchCount,
                                        lastSuccessfulSync)) {
          Serial.println("Batch uploaded successfully!");
          batchCount = 0; // Clear batch
          lastUploadTime = millis();
        } else {
          Serial.println("Batch upload failed, will retry.");
        }
      } else {
        Serial.println("Firebase not ready, skipping upload.");
      }

      // Reset upload timer even if upload failed to prevent continuous retry
      // spam
      if (uploadIntervalPassed) {
        lastUploadTime = millis();
      }
    }

    // Process event queue (non-blocking)
    EventData event;
    while (xQueueReceive(eventQueue, &event, 0) == pdTRUE) {
      // Upload events immediately (not batched)
      if (firebaseManager.isReady()) {
        firebaseManager.uploadEvent(event);
      } else {
        Serial.println("Firebase not ready, event dropped.");
      }
    }

    // Small delay to prevent tight loop
    vTaskDelay(pdMS_TO_TICKS(50));
  }
}

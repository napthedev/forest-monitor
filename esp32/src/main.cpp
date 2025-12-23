// Include necessary libraries for Arduino and FreeRTOS
#include "secrets.h"
#include <Arduino.h>

// Include custom modules
#include "DisplayManager.h"
#include "FirebaseManager.h"
#include "WiFiManager.h"
#include <DataTypes.h>

// Task function declarations
extern void sensorTask(void *parameter);
extern void cloudTask(void *parameter);
extern void uiTask(void *parameter);

// FreeRTOS Queue and Mutex handles
QueueHandle_t sensorDataQueue;
QueueHandle_t eventQueue;
SemaphoreHandle_t i2cMutex;

// Global manager objects
WiFiManager wifiManager(PRIMARY_WIFI_SSID, PRIMARY_WIFI_PASSWORD,
                        SECONDARY_WIFI_SSID, SECONDARY_WIFI_IDENTITY,
                        SECONDARY_WIFI_USERNAME, SECONDARY_WIFI_PASSWORD);
FirebaseManager firebaseManager(FIREBASE_HOST_URL, FIREBASE_AUTH_TOKEN);
DisplayManager displayManager;

// Shared state variables
unsigned long lastSuccessfulSync = 0;
uint32_t droppedPacketCount = 0;

// Setup function: Initialize FreeRTOS resources and create tasks
void setup() {
  // Initialize serial communication for debugging
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n\n=== ESP32 Forest Monitor - FreeRTOS Version ===");

  // Create I2C mutex for LCD display on I2C bus (SDA=21, SCL=22)
  i2cMutex = xSemaphoreCreateMutex();
  if (i2cMutex == NULL) {
    Serial.println("ERROR: Failed to create I2C mutex!");
    while (true) {
      delay(1000);
    }
  }

  // Initialize display manager
  displayManager.begin(i2cMutex);
  displayManager.showInitMessage();

  // Create sensor data queue (size 100)
  sensorDataQueue = xQueueCreate(100, sizeof(SensorData));
  if (sensorDataQueue == NULL) {
    Serial.println("ERROR: Failed to create sensor data queue!");
    while (true) {
      delay(1000);
    }
  }

  // Create event queue (size 100)
  eventQueue = xQueueCreate(100, sizeof(EventData));
  if (eventQueue == NULL) {
    Serial.println("ERROR: Failed to create event queue!");
    while (true) {
      delay(1000);
    }
  }

  Serial.println("Queues and mutex created successfully.");

  // Create Sensor Task (Core 1, Priority 2, Stack 4096)
  BaseType_t sensorTaskResult =
      xTaskCreatePinnedToCore(sensorTask,   // Task function
                              "SensorTask", // Task name
                              4096,         // Stack size (bytes)
                              NULL,         // Parameters
                              2,            // Priority
                              NULL,         // Task handle
                              1             // Core ID (Core 1)
      );

  if (sensorTaskResult != pdPASS) {
    Serial.println("ERROR: Failed to create Sensor Task!");
    while (true) {
      delay(1000);
    }
  }
  Serial.println("Sensor Task created on Core 1 (Priority 2)");

  // Create Cloud Task (Core 0, Priority 1, Stack 8192)
  BaseType_t cloudTaskResult =
      xTaskCreatePinnedToCore(cloudTask,   // Task function
                              "CloudTask", // Task name
                              8192,        // Stack size (bytes)
                              NULL,        // Parameters
                              1,           // Priority
                              NULL,        // Task handle
                              0            // Core ID (Core 0)
      );

  if (cloudTaskResult != pdPASS) {
    Serial.println("ERROR: Failed to create Cloud Task!");
    while (true) {
      delay(1000);
    }
  }
  Serial.println("Cloud Task created on Core 0 (Priority 1)");

  // Create UI Task (Core 1, Priority 1, Stack 2048)
  BaseType_t uiTaskResult = xTaskCreatePinnedToCore(uiTask,   // Task function
                                                    "UITask", // Task name
                                                    2048, // Stack size (bytes)
                                                    NULL, // Parameters
                                                    1,    // Priority
                                                    NULL, // Task handle
                                                    1     // Core ID (Core 1)
  );

  if (uiTaskResult != pdPASS) {
    Serial.println("ERROR: Failed to create UI Task!");
    while (true) {
      delay(1000);
    }
  }
  Serial.println("UI Task created on Core 1 (Priority 1)");

  Serial.println("\n=== All tasks started successfully ===\n");
}

// Loop function: All work is done by tasks, just yield
void loop() {
  // All functionality is now handled by FreeRTOS tasks
  // Just delay to yield CPU time to other tasks
  vTaskDelay(pdMS_TO_TICKS(1000));

  // Optional: Monitor task stack usage (for debugging)
  // Uncomment to see stack high water marks periodically
  /*
  static unsigned long lastStackCheck = 0;
  if (millis() - lastStackCheck > 30000) { // Every 30 seconds
    lastStackCheck = millis();
    Serial.println("\n=== Stack Usage Report ===");
    // Note: Would need task handles to check stack usage
    Serial.println("==========================\n");
  }
  */
}

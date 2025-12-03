// Include necessary libraries for Arduino, WiFi, and Firebase
#include "PushId.h"
#include "esp_wpa2.h" // Include WPA2 Enterprise library
#include "secrets.h"
#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h> // Include WiFiClientSecure

// Define build options for Firebase library
#define ENABLE_DATABASE
#define ENABLE_LEGACY_TOKEN
#include <FirebaseClient.h>

// Primary WiFi configuration (WPA2-Personal)
const char *primarySsid = PRIMARY_WIFI_SSID;
const char *primaryPassword = PRIMARY_WIFI_PASSWORD;

// Secondary WiFi configuration (WPA2-Enterprise - fallback)
const char *secondarySsid = SECONDARY_WIFI_SSID;
const char *secondaryIdentity = SECONDARY_WIFI_IDENTITY;
const char *secondaryUsername = SECONDARY_WIFI_USERNAME;
const char *secondaryPassword = SECONDARY_WIFI_PASSWORD;

// Track which network is currently connected
bool usingPrimaryWiFi = false;

// Firebase configuration settings
#define FIREBASE_HOST FIREBASE_HOST_URL
#define FIREBASE_AUTH FIREBASE_AUTH_TOKEN

// Sensor configuration
#define LIGHT_SENSOR_PIN 36
#define PIR_SENSOR_PIN 23
#define VIBRATION_SENSOR_PIN 22
#define GAS_SENSOR_PIN 39
#define FLAME_SENSOR_PIN 34
#define SOIL_MOISTURE_SENSOR_PIN 35
#define SOUND_SENSOR_PIN 32
#define SYNC_INTERVAL 10000 // 10 seconds

// Debounce interval for event-based sensors (3 seconds)
#define EVENT_DEBOUNCE_MS 3000

// PIR sensor state tracking
int pirState = LOW;
int pirValue = 0;
unsigned long lastMotionEventTime = 0;

// Vibration sensor state tracking
int vibrationState = LOW;
int vibrationValue = 0;
unsigned long lastVibrationEventTime = 0;

// Firebase client objects and authentication
WiFiClientSecure ssl_client;
using AsyncClient = AsyncClientClass;
AsyncClient aClient(ssl_client);
LegacyToken legacy_token(FIREBASE_AUTH);
FirebaseApp app;
RealtimeDatabase Database;

// Function to connect to primary WiFi (WPA2-Personal)
bool connectPrimaryWiFi() {
  Serial.println("Attempting primary WiFi (WPA2-Personal)...");
  Serial.print("SSID: ");
  Serial.println(primarySsid);

  WiFi.disconnect(true);
  WiFi.mode(WIFI_STA);
  WiFi.begin(primarySsid, primaryPassword);

  int attempts = 20; // 10 seconds (20 * 500ms)
  while (WiFi.status() != WL_CONNECTED && attempts-- > 0) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  return WiFi.status() == WL_CONNECTED;
}

// Function to connect to secondary WiFi (WPA2-Enterprise)
bool connectSecondaryWiFi() {
  Serial.println("Attempting secondary WiFi (WPA2-Enterprise)...");
  Serial.print("SSID: ");
  Serial.println(secondarySsid);

  WiFi.disconnect(true);
  WiFi.mode(WIFI_STA);

  esp_wifi_sta_wpa2_ent_set_identity((uint8_t *)secondaryIdentity,
                                     strlen(secondaryIdentity));
  esp_wifi_sta_wpa2_ent_set_username((uint8_t *)secondaryUsername,
                                     strlen(secondaryUsername));
  esp_wifi_sta_wpa2_ent_set_password((uint8_t *)secondaryPassword,
                                     strlen(secondaryPassword));
  esp_wifi_sta_wpa2_ent_enable();

  WiFi.begin(secondarySsid);

  int attempts = 40; // 20 seconds (40 * 500ms)
  while (WiFi.status() != WL_CONNECTED && attempts-- > 0) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  return WiFi.status() == WL_CONNECTED;
}

// Main connection function with fallback
void connectWiFiWithFallback() {
  if (connectPrimaryWiFi()) {
    usingPrimaryWiFi = true;
    Serial.println("Connected to primary WiFi");
  } else if (connectSecondaryWiFi()) {
    usingPrimaryWiFi = false;
    Serial.println("Connected to secondary WiFi (enterprise)");
  } else {
    Serial.println("All WiFi connections failed. Restarting...");
    ESP.restart();
  }
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

// Setup function: Initialize serial, WiFi, and Firebase
void setup() {
  // Initialize serial communication for debugging
  Serial.begin(115200);
  delay(1000);

  // Initialize PIR sensor pin
  pinMode(PIR_SENSOR_PIN, INPUT);

  // Initialize vibration sensor pin
  pinMode(VIBRATION_SENSOR_PIN, INPUT);

  // Connect to WiFi with fallback
  connectWiFiWithFallback();

  // Firebase Setup
  Serial.printf("Firebase Client v%s\n", FIREBASE_CLIENT_VERSION);

  ssl_client.setInsecure();

  Serial.println("Initializing app...");
  initializeApp(aClient, app, getAuth(legacy_token));

  app.getApp<RealtimeDatabase>(Database);
  Database.url(FIREBASE_HOST);
}

// Loop function: Read sensor data, sync to Firebase, handle WiFi reconnection
void loop() {
  // Maintain Firebase tasks
  app.loop();

  // Read PIR sensor and push to Firebase when motion is detected (with
  // debounce)
  pirValue = digitalRead(PIR_SENSOR_PIN);
  if (pirValue == HIGH) {
    if (pirState == LOW) {
      // Motion detected (transition from LOW to HIGH)
      pirState = HIGH;

      // Check debounce: only push if enough time has passed since last event
      if (millis() - lastMotionEventTime >= EVENT_DEBOUNCE_MS) {
        Serial.println("PIR: Motion detected!");
        lastMotionEventTime = millis();

        // Push motion event to Firebase with timestamp using local unique ID
        if (app.ready()) {
          String motionKey = generatePushId();
          String motionJson = "{\"/sensors/motion/" + motionKey +
                              "\":{\"timestamp\":{\".sv\":\"timestamp\"}}}";
          Database.update<object_t>(aClient, "", object_t(motionJson));
        }
      }
    }
  } else {
    if (pirState == HIGH) {
      pirState = LOW;
    }
  }

  // Read vibration sensor and push to Firebase when vibration is detected (with
  // debounce)
  vibrationValue = digitalRead(VIBRATION_SENSOR_PIN);
  if (vibrationValue == HIGH) {
    if (vibrationState == LOW) {
      // Vibration detected (transition from LOW to HIGH)
      vibrationState = HIGH;

      // Check debounce: only push if enough time has passed since last event
      if (millis() - lastVibrationEventTime >= EVENT_DEBOUNCE_MS) {
        Serial.println("Vibration: Vibration detected!");
        lastVibrationEventTime = millis();

        // Push vibration event to Firebase with timestamp using local unique ID
        if (app.ready()) {
          String vibrationKey = generatePushId();
          String vibrationJson = "{\"/sensors/vibration/" + vibrationKey +
                                 "\":{\"timestamp\":{\".sv\":\"timestamp\"}}}";
          Database.update<object_t>(aClient, "", object_t(vibrationJson));
        }
      }
    }
  } else {
    if (vibrationState == HIGH) {
      vibrationState = LOW;
    }
  }

  // Read sensor and sync to Firebase every SYNC_INTERVAL
  static unsigned long lastSyncTime = 0;
  if (app.ready() && (millis() - lastSyncTime >= SYNC_INTERVAL)) {
    lastSyncTime = millis();

    // Read all analog sensor values
    int lightValue = analogRead(LIGHT_SENSOR_PIN);
    int gasValue = analogRead(GAS_SENSOR_PIN);
    int flameValue = analogRead(FLAME_SENSOR_PIN);
    int soilMoistureValue = analogRead(SOIL_MOISTURE_SENSOR_PIN);
    int soundValue = analogRead(SOUND_SENSOR_PIN);

    Serial.printf("Light: %d, Gas: %d, Flame: %d, Soil: %d, Sound: %d\n",
                  lightValue, gasValue, flameValue, soilMoistureValue,
                  soundValue);

    // Generate unique IDs locally for each sensor record
    String lightKey = generatePushId();
    String gasKey = generatePushId();
    String flameKey = generatePushId();
    String soilKey = generatePushId();
    String soundKey = generatePushId();

    // Build batch update JSON string with all sensor records
    // Using multi-path update format: { "path1": value1, "path2": value2, ... }
    String batchJson = "{";
    batchJson += "\"/sensors/light/" + lightKey +
                 "\":{\"value\":" + String(lightValue) +
                 ",\"timestamp\":{\".sv\":\"timestamp\"}},";
    batchJson += "\"/sensors/gas/" + gasKey +
                 "\":{\"value\":" + String(gasValue) +
                 ",\"timestamp\":{\".sv\":\"timestamp\"}},";
    batchJson += "\"/sensors/flame/" + flameKey +
                 "\":{\"value\":" + String(flameValue) +
                 ",\"timestamp\":{\".sv\":\"timestamp\"}},";
    batchJson += "\"/sensors/soil-moisture/" + soilKey +
                 "\":{\"value\":" + String(soilMoistureValue) +
                 ",\"timestamp\":{\".sv\":\"timestamp\"}},";
    batchJson += "\"/sensors/sound/" + soundKey +
                 "\":{\"value\":" + String(soundValue) +
                 ",\"timestamp\":{\".sv\":\"timestamp\"}}";
    batchJson += "}";

    // Execute single atomic batch update
    Database.update<object_t>(aClient, "", object_t(batchJson));
    Serial.println("Batch sensor data pushed.");
  }

  // Check WiFi connection status periodically (every 5 seconds)
  static unsigned long lastWifiCheck = 0;
  if (millis() - lastWifiCheck > 5000) {
    lastWifiCheck = millis();
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("WiFi connection lost. Reconnecting...");
      connectWiFiWithFallback();
    }
  }
}

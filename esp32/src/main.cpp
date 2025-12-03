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

// WiFi configuration for WPA2 Enterprise connection
const char *ssid = WIFI_SSID;
const char *identity = WIFI_IDENTITY;
const char *username = WIFI_USERNAME;
const char *password = WIFI_PASSWORD;

// Firebase configuration settings
#define FIREBASE_HOST FIREBASE_HOST_URL
#define FIREBASE_AUTH FIREBASE_AUTH_TOKEN

// Sensor configuration
#define LIGHT_SENSOR_PIN 36
#define PIR_SENSOR_PIN 23
#define GAS_SENSOR_PIN 39
#define FLAME_SENSOR_PIN 34
#define SOIL_MOISTURE_SENSOR_PIN 35
#define SOUND_SENSOR_PIN 32
#define SYNC_INTERVAL 10000 // 10 seconds

// PIR sensor state tracking
int pirState = LOW;
int pirValue = 0;

// Firebase client objects and authentication
WiFiClientSecure ssl_client;
using AsyncClient = AsyncClientClass;
AsyncClient aClient(ssl_client);
LegacyToken legacy_token(FIREBASE_AUTH);
FirebaseApp app;
RealtimeDatabase Database;

// Setup function: Initialize serial, WiFi, and Firebase
void setup() {
  // Initialize serial communication for debugging
  Serial.begin(115200);
  delay(1000);

  // Initialize PIR sensor pin
  pinMode(PIR_SENSOR_PIN, INPUT);

  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  // Reset WiFi settings and set mode to Station (client)
  WiFi.disconnect(true);
  WiFi.mode(WIFI_STA);

  // Configure WPA2 Enterprise parameters
  // Set identity, username, and password for authentication
  esp_wifi_sta_wpa2_ent_set_identity((uint8_t *)identity, strlen(identity));
  esp_wifi_sta_wpa2_ent_set_username((uint8_t *)username, strlen(username));
  esp_wifi_sta_wpa2_ent_set_password((uint8_t *)password, strlen(password));
  esp_wifi_sta_wpa2_ent_enable(); // Enable WPA2 Enterprise mode

  // Start connection to the access point
  WiFi.begin(ssid);

  // Wait for connection with timeout handling
  int counter = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    counter++;
    if (counter > 60) { // Timeout after 30s (60 * 500ms)
      Serial.println("\nConnection failed. Retrying...");
      counter = 0;
      WiFi.disconnect(true);
      WiFi.begin(ssid);
    }
  }

  // Print connection details upon success
  Serial.println("");
  Serial.println("WiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

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

  // Read PIR sensor and push to Firebase when motion is detected
  pirValue = digitalRead(PIR_SENSOR_PIN);
  if (pirValue == HIGH) {
    if (pirState == LOW) {
      // Motion detected (transition from LOW to HIGH)
      Serial.println("PIR: Motion detected!");
      pirState = HIGH;

      // Push motion event to Firebase with timestamp using local unique ID
      if (app.ready()) {
        String motionKey = generatePushId();
        String motionJson = "{\"/sensors/motion/" + motionKey +
                            "\":{\"timestamp\":{\".sv\":\"timestamp\"}}}";
        Database.update<object_t>(aClient, "", object_t(motionJson));
      }
    }
  } else {
    if (pirState == HIGH) {
      pirState = LOW;
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
      WiFi.disconnect(true);
      WiFi.mode(WIFI_STA);

      // Re-configure WPA2 Enterprise settings
      esp_wifi_sta_wpa2_ent_set_identity((uint8_t *)identity, strlen(identity));
      esp_wifi_sta_wpa2_ent_set_username((uint8_t *)username, strlen(username));
      esp_wifi_sta_wpa2_ent_set_password((uint8_t *)password, strlen(password));
      esp_wifi_sta_wpa2_ent_enable();
      WiFi.begin(ssid);

      // Wait until reconnected
      while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
      }
      Serial.println("\nReconnected.");
      Serial.print("IP address: ");
      Serial.println(WiFi.localIP());
    }
  }
}

// Include necessary libraries for Arduino, WiFi, and Firebase
#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h> // Include WiFiClientSecure
#include "esp_wpa2.h" // Include WPA2 Enterprise library

// Define build options for Firebase library
#define ENABLE_DATABASE
#define ENABLE_LEGACY_TOKEN
#include <FirebaseClient.h>

// WiFi configuration for WPA2 Enterprise connection
const char* ssid = "VinUni Students";
const char* identity = "25phong.na@vinuni.edu.vn";
const char* username = "25phong.na@vinuni.edu.vn";
const char* password = "Go2thegym*23*";

// Firebase configuration settings
#define FIREBASE_HOST "https://gen-lang-client-0454005386-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH "lIiTstCCnOImKMwvPMZkr80uZwn2BwcvjufR3zZn"
const char* FIREBASE_PATH = "/control/isLedOn";

#define LED_PIN 2

// Firebase client objects and authentication
WiFiClientSecure ssl_client, stream_ssl_client; // Use WiFiClientSecure directly
using AsyncClient = AsyncClientClass;
AsyncClient aClient(ssl_client), streamClient(stream_ssl_client);
LegacyToken legacy_token(FIREBASE_AUTH);
FirebaseApp app;
RealtimeDatabase Database;

// Callback function to handle Firebase stream data and control LED
void processData(AsyncResult &aResult) {
    if (aResult.isEvent()) {
        Serial.printf("Event task: %s, msg: %s, code: %d\n", aResult.uid().c_str(), aResult.eventLog().message().c_str(), aResult.eventLog().code());
    }

    if (aResult.isDebug()) {
        Serial.printf("Debug task: %s, msg: %s\n", aResult.uid().c_str(), aResult.debug().c_str());
    }

    if (aResult.isError()) {
        Serial.printf("Error task: %s, msg: %s, code: %d\n", aResult.uid().c_str(), aResult.error().message().c_str(), aResult.error().code());
    }

    if (aResult.available()) {
        RealtimeDatabaseResult &stream = aResult.to<RealtimeDatabaseResult>();
        if (stream.isStream()) {
            Serial.println("----------------------------");
            String streamData = stream.to<String>();
            Serial.printf("Stream Data: %s\n", streamData.c_str());
            Serial.printf("Path: %s\n", stream.dataPath().c_str());

            if (streamData == "null") {
                Serial.println("Received null data, ignoring...");
                return;
            }
            
            bool isLedOn = stream.to<bool>();
            Serial.printf("LED State: %s\n", isLedOn ? "ON" : "OFF");
            digitalWrite(LED_PIN, isLedOn ? HIGH : LOW);
        } else {
            Serial.println("----------------------------");
            Serial.printf("task: %s, payload: %s\n", aResult.uid().c_str(), aResult.c_str());
        }
    }
}

// Setup function: Initialize serial, LED, WiFi, and Firebase
void setup() {
  // Initialize serial communication for debugging
  Serial.begin(115200);
  delay(1000);

  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

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
  stream_ssl_client.setInsecure();

  Serial.println("Initializing app...");
  initializeApp(aClient, app, getAuth(legacy_token));
  
  app.getApp<RealtimeDatabase>(Database);
  Database.url(FIREBASE_HOST);
  
  // Start streaming
  Database.get(streamClient, FIREBASE_PATH, processData, true /* SSE mode */);
}

// Loop function: Maintain Firebase authentication and stream, handle WiFi reconnection
void loop() {
  // Maintain Firebase tasks
  app.loop();

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

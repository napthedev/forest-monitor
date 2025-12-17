// Include necessary libraries for Arduino, WiFi, and Firebase
#include "PushId.h"
#include "esp_wpa2.h" // Include WPA2 Enterprise library
#include "secrets.h"
#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h> // Include WiFiClientSecure

// LCD Display library
#include <LiquidCrystal_I2C.h>
#include <Wire.h>

// DHT11 Temperature & Humidity sensor library
#include <DHT.h>

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
#define VIBRATION_SENSOR_PIN 19
#define GAS_SENSOR_PIN 39
#define FLAME_SENSOR_PIN 34
#define SOIL_MOISTURE_SENSOR_PIN 35
#define SOUND_SENSOR_PIN 32
#define DHT_SENSOR_PIN 18
#define DHTTYPE DHT11
#define SYNC_INTERVAL 10000 // 10 seconds

// Debounce interval for event-based sensors (3 seconds)
#define EVENT_DEBOUNCE_MS 3000

// Sound sensor sampling window duration (100ms)
#define SOUND_SAMPLING_DURATION_MS 100

// LCD Display configuration
#define LCD_COLS 20
#define LCD_ROWS 4
#define LCD_ADDRESS 0x27
#define DISPLAY_UPDATE_INTERVAL 1000 // 1 second

// Custom character indices
#define CHAR_WIFI 0
#define CHAR_IP 1
#define CHAR_FIREBASE 2
#define CHAR_SYNC 3

// Custom character bitmaps (5x8 pixels)
// WiFi antenna icon
byte wifiChar[8] = {0b00000, 0b01110, 0b10001, 0b00100,
                    0b01010, 0b00000, 0b00100, 0b00000};

// IP/Network icon (grid pattern)
byte ipChar[8] = {0b11111, 0b10001, 0b10001, 0b11111,
                  0b10001, 0b10001, 0b11111, 0b00000};

// Firebase/Cloud icon
byte firebaseChar[8] = {0b00000, 0b01110, 0b11111, 0b11111,
                        0b11111, 0b01110, 0b00000, 0b00000};

// Sync/Clock icon
byte syncChar[8] = {0b00000, 0b01110, 0b10101, 0b10111,
                    0b10001, 0b01110, 0b00000, 0b00000};

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

// LCD Display object
LiquidCrystal_I2C lcd(LCD_ADDRESS, LCD_COLS, LCD_ROWS);

// DHT sensor object
DHT dht(DHT_SENSOR_PIN, DHTTYPE);

// Display timing variables
unsigned long lastDisplayUpdate = 0;
unsigned long lastSuccessfulSync = 0;

// Function to update LCD display with current status
void updateDisplay() {
  lcd.clear();

  // Row 0: WiFi Status (icon + SSID)
  lcd.setCursor(0, 0);
  lcd.write(CHAR_WIFI);
  lcd.print(" ");
  if (WiFi.status() == WL_CONNECTED) {
    String ssid = WiFi.SSID();
    lcd.print(ssid.substring(0, 18)); // Truncate to fit
  } else {
    lcd.print("Disconnected");
  }

  // Row 1: IP Address (icon + IP)
  lcd.setCursor(0, 1);
  lcd.write(CHAR_IP);
  lcd.print(" ");
  if (WiFi.status() == WL_CONNECTED) {
    lcd.print(WiFi.localIP());
  } else {
    lcd.print("N/A");
  }

  // Row 2: Firebase Status (icon + status)
  lcd.setCursor(0, 2);
  lcd.write(CHAR_FIREBASE);
  lcd.print(" Firebase:");
  lcd.print(app.ready() ? "OK" : "NO");

  // Row 3: Last Sync Time (icon + time)
  lcd.setCursor(0, 3);
  lcd.write(CHAR_SYNC);
  lcd.print(" Sync:");
  if (lastSuccessfulSync == 0) {
    lcd.print("Never");
  } else {
    unsigned long elapsed = (millis() - lastSuccessfulSync) / 1000;
    if (elapsed == 0) {
      lcd.print("Just now");
    } else {
      lcd.print(elapsed);
      lcd.print("s ago");
    }
  }
}

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

// Function to read sound sensor amplitude over a 100ms sampling window
// Calculates peak-to-peak amplitude (max - min) for accurate sound level
// measurement
int readSoundAmplitude() {
  unsigned long startTime = millis();
  int minValue = 4095;
  int maxValue = 0;

  // Sample for 100ms
  while (millis() - startTime < SOUND_SAMPLING_DURATION_MS) {
    int currentValue = analogRead(SOUND_SENSOR_PIN);
    if (currentValue < minValue) {
      minValue = currentValue;
    }
    if (currentValue > maxValue) {
      maxValue = currentValue;
    }
  }

  // Calculate peak-to-peak amplitude
  int amplitude = maxValue - minValue;

  Serial.printf("Sound: min=%d, max=%d, amplitude=%d\n", minValue, maxValue,
                amplitude);

  return amplitude;
}

// Setup function: Initialize serial, WiFi, and Firebase
void setup() {
  // Initialize serial communication for debugging
  Serial.begin(115200);
  delay(1000);

  // Initialize LCD display
  Wire.begin(21, 22); // SDA=21, SCL=22
  delay(250);         // Wait for display to power up

  lcd.init();
  lcd.backlight();

  // Register custom characters
  lcd.createChar(CHAR_WIFI, wifiChar);
  lcd.createChar(CHAR_IP, ipChar);
  lcd.createChar(CHAR_FIREBASE, firebaseChar);
  lcd.createChar(CHAR_SYNC, syncChar);

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Initializing...");
  Serial.println("LCD display initialized.");

  // Initialize PIR sensor pin
  pinMode(PIR_SENSOR_PIN, INPUT);

  // Initialize vibration sensor pin
  pinMode(VIBRATION_SENSOR_PIN, INPUT);

  // Initialize DHT11 sensor
  dht.begin();
  Serial.println("DHT11 sensor initialized.");

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

    Serial.println("--------------------------------");

    // Read all analog sensor values
    int lightValue = analogRead(LIGHT_SENSOR_PIN);
    int gasValue = analogRead(GAS_SENSOR_PIN);
    int flameValue = analogRead(FLAME_SENSOR_PIN);
    int soilMoistureValue = analogRead(SOIL_MOISTURE_SENSOR_PIN);
    int soundAmplitude = readSoundAmplitude();

    // Read DHT11 temperature and humidity
    float temperature = dht.readTemperature();
    float humidity = dht.readHumidity();
    bool dhtReadSuccess = !isnan(temperature) && !isnan(humidity);

    Serial.printf("Light: %d, Gas: %d, Flame: %d, Soil: %d\n", lightValue,
                  gasValue, flameValue, soilMoistureValue);
    if (dhtReadSuccess) {
      Serial.printf("Temperature: %.1f°C, Humidity: %.1f%%\n", temperature,
                    humidity);
    } else {
      Serial.println("DHT11 read failed, skipping temperature/humidity.");
    }

    // Generate unique IDs locally for each sensor record
    String lightKey = generatePushId();
    String gasKey = generatePushId();
    String flameKey = generatePushId();
    String soilKey = generatePushId();
    String soundKey = generatePushId();
    String temperatureKey = dhtReadSuccess ? generatePushId() : "";
    String humidityKey = dhtReadSuccess ? generatePushId() : "";

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
                 "\":{\"amplitude\":" + String(soundAmplitude) +
                 ",\"timestamp\":{\".sv\":\"timestamp\"}}";

    // Add temperature and humidity if DHT11 read was successful
    if (dhtReadSuccess) {
      batchJson += ",\"/sensors/temperature/" + temperatureKey +
                   "\":{\"value\":" + String(temperature, 1) +
                   ",\"timestamp\":{\".sv\":\"timestamp\"}}";
      batchJson += ",\"/sensors/humidity/" + humidityKey +
                   "\":{\"value\":" + String(humidity, 1) +
                   ",\"timestamp\":{\".sv\":\"timestamp\"}}";
    }

    batchJson += "}";

    // Execute single atomic batch update
    Database.update<object_t>(aClient, "", object_t(batchJson));
    Serial.println("Batch sensor data pushed.");

    // Update last successful sync time for display
    lastSuccessfulSync = millis();
  }

  // Update LCD display every second
  if (millis() - lastDisplayUpdate >= DISPLAY_UPDATE_INTERVAL) {
    lastDisplayUpdate = millis();
    updateDisplay();
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

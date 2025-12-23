#include "DisplayManager.h"

DisplayManager::DisplayManager()
    : _lcd(LCD_ADDRESS, LCD_COLS, LCD_ROWS), _i2cMutex(NULL) {

  // Initialize custom character bitmaps
  byte wifiChar[8] = {0b00000, 0b01110, 0b10001, 0b00100,
                      0b01010, 0b00000, 0b00100, 0b00000};
  byte ipChar[8] = {0b11111, 0b10001, 0b10001, 0b11111,
                    0b10001, 0b10001, 0b11111, 0b00000};
  byte firebaseChar[8] = {0b00000, 0b01110, 0b11111, 0b11111,
                          0b11111, 0b01110, 0b00000, 0b00000};
  byte syncChar[8] = {0b00000, 0b01110, 0b10101, 0b10111,
                      0b10001, 0b01110, 0b00000, 0b00000};

  memcpy(_wifiChar, wifiChar, 8);
  memcpy(_ipChar, ipChar, 8);
  memcpy(_firebaseChar, firebaseChar, 8);
  memcpy(_syncChar, syncChar, 8);
}

void DisplayManager::begin(SemaphoreHandle_t i2cMutex) {
  _i2cMutex = i2cMutex;

  // Initialize I2C bus
  Wire.begin(21, 22);             // SDA=21, SCL=22
  vTaskDelay(pdMS_TO_TICKS(250)); // Wait for display to power up

  // Initialize LCD
  _lcd.init();
  _lcd.backlight();

  // Register custom characters
  createCustomChars();

  Serial.println("LCD display initialized.");
}

void DisplayManager::createCustomChars() {
  if (takeMutex()) {
    _lcd.createChar(CHAR_WIFI, _wifiChar);
    _lcd.createChar(CHAR_IP, _ipChar);
    _lcd.createChar(CHAR_FIREBASE, _firebaseChar);
    _lcd.createChar(CHAR_SYNC, _syncChar);
    releaseMutex();
  }
}

void DisplayManager::showInitMessage() {
  if (takeMutex()) {
    _lcd.clear();
    _lcd.setCursor(0, 0);
    _lcd.print("Initializing...");
    releaseMutex();
  }
}

void DisplayManager::updateStatus(const String &ssid, const String &ip,
                                  bool firebaseReady,
                                  unsigned long lastSyncTime,
                                  uint32_t droppedPackets) {
  if (!takeMutex()) {
    return; // Skip update if mutex not available
  }

  _lcd.clear();

  // Row 0: WiFi Status (icon + SSID)
  _lcd.setCursor(0, 0);
  _lcd.write(CHAR_WIFI);
  _lcd.print(" ");
  if (ssid.length() > 0) {
    String truncatedSsid = ssid.substring(0, 18); // Truncate to fit
    _lcd.print(truncatedSsid);
  } else {
    _lcd.print("Disconnected");
  }

  // Row 1: IP Address (icon + IP)
  _lcd.setCursor(0, 1);
  _lcd.write(CHAR_IP);
  _lcd.print(" ");
  if (ip.length() > 0) {
    _lcd.print(ip);
  } else {
    _lcd.print("N/A");
  }

  // Row 2: Firebase Status (icon + status) + Dropped packets
  _lcd.setCursor(0, 2);
  _lcd.write(CHAR_FIREBASE);
  if (droppedPackets > 0) {
    _lcd.print(" FB:");
    _lcd.print(firebaseReady ? "OK" : "NO");
    _lcd.print(" Drop:");
    _lcd.print(droppedPackets);
  } else {
    _lcd.print(" Firebase:");
    _lcd.print(firebaseReady ? "OK" : "NO");
  }

  // Row 3: Last Sync Time (icon + time)
  _lcd.setCursor(0, 3);
  _lcd.write(CHAR_SYNC);
  _lcd.print(" Sync:");
  if (lastSyncTime == 0) {
    _lcd.print("Never");
  } else {
    unsigned long elapsed = (millis() - lastSyncTime) / 1000;
    if (elapsed == 0) {
      _lcd.print("Just now");
    } else {
      _lcd.print(elapsed);
      _lcd.print("s ago");
    }
  }

  releaseMutex();
}

bool DisplayManager::takeMutex(uint32_t timeoutMs) {
  if (_i2cMutex == NULL) {
    return true; // No mutex configured, proceed anyway
  }
  return xSemaphoreTake(_i2cMutex, pdMS_TO_TICKS(timeoutMs)) == pdTRUE;
}

void DisplayManager::releaseMutex() {
  if (_i2cMutex != NULL) {
    xSemaphoreGive(_i2cMutex);
  }
}

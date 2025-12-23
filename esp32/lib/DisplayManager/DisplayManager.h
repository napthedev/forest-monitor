#ifndef DISPLAY_MANAGER_H
#define DISPLAY_MANAGER_H

#include <Arduino.h>
#include <LiquidCrystal_I2C.h>
#include <Wire.h>

// LCD Display configuration
#define LCD_COLS 20
#define LCD_ROWS 4
#define LCD_ADDRESS 0x27

// Custom character indices
#define CHAR_WIFI 0
#define CHAR_IP 1
#define CHAR_FIREBASE 2
#define CHAR_SYNC 3

class DisplayManager {
public:
  // Constructor
  DisplayManager();

  // Initialize LCD display with custom characters
  void begin(SemaphoreHandle_t i2cMutex);

  // Update display with current status (mutex-protected)
  void updateStatus(const String &ssid, const String &ip, bool firebaseReady,
                    unsigned long lastSyncTime, uint32_t droppedPackets);

  // Show initialization message
  void showInitMessage();

private:
  LiquidCrystal_I2C _lcd;
  SemaphoreHandle_t _i2cMutex;

  // Custom character bitmaps
  byte _wifiChar[8];
  byte _ipChar[8];
  byte _firebaseChar[8];
  byte _syncChar[8];

  // Register custom characters
  void createCustomChars();

  // Take I2C mutex with timeout
  bool takeMutex(uint32_t timeoutMs = 100);

  // Release I2C mutex
  void releaseMutex();
};

#endif // DISPLAY_MANAGER_H

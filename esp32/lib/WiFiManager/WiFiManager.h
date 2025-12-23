#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

#include "esp_wpa2.h"
#include <Arduino.h>
#include <WiFi.h>

class WiFiManager {
public:
  // Constructor
  WiFiManager(const char *primarySsid, const char *primaryPassword,
              const char *secondarySsid, const char *secondaryIdentity,
              const char *secondaryUsername, const char *secondaryPassword);

  // Connect to WiFi with fallback (primary -> secondary -> restart)
  void connectWithFallback();

  // Check connection and reconnect if needed
  void checkConnection();

  // Check if currently connected
  bool isConnected();

  // Get current SSID
  String getSSID();

  // Get current IP address
  String getIP();

  // Check if using primary network
  bool isUsingPrimary();

private:
  // WiFi credentials
  const char *_primarySsid;
  const char *_primaryPassword;
  const char *_secondarySsid;
  const char *_secondaryIdentity;
  const char *_secondaryUsername;
  const char *_secondaryPassword;

  // Connection state
  bool _usingPrimaryWiFi;
  unsigned long _lastConnectionAttempt;
  int _reconnectDelay;

  // Connect to primary WiFi (WPA2-Personal)
  bool connectPrimary();

  // Connect to secondary WiFi (WPA2-Enterprise)
  bool connectSecondary();

  // Reset reconnect delay for exponential backoff
  void resetReconnectDelay();

  // Get next reconnect delay with exponential backoff
  int getNextReconnectDelay();
};

#endif // WIFI_MANAGER_H

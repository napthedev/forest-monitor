#include "WiFiManager.h"

WiFiManager::WiFiManager(const char *primarySsid, const char *primaryPassword,
                         const char *secondarySsid,
                         const char *secondaryIdentity,
                         const char *secondaryUsername,
                         const char *secondaryPassword)
    : _primarySsid(primarySsid), _primaryPassword(primaryPassword),
      _secondarySsid(secondarySsid), _secondaryIdentity(secondaryIdentity),
      _secondaryUsername(secondaryUsername),
      _secondaryPassword(secondaryPassword), _usingPrimaryWiFi(false),
      _lastConnectionAttempt(0), _reconnectDelay(500) {}

void WiFiManager::connectWithFallback() {
  if (connectPrimary()) {
    _usingPrimaryWiFi = true;
    Serial.println("Connected to primary WiFi");
    resetReconnectDelay();
  } else if (connectSecondary()) {
    _usingPrimaryWiFi = false;
    Serial.println("Connected to secondary WiFi (enterprise)");
    resetReconnectDelay();
  } else {
    Serial.println("All WiFi connections failed. Restarting...");
    vTaskDelay(pdMS_TO_TICKS(1000));
    ESP.restart();
  }
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void WiFiManager::checkConnection() {
  if (WiFi.status() != WL_CONNECTED) {
    unsigned long now = millis();
    if (now - _lastConnectionAttempt >= _reconnectDelay) {
      _lastConnectionAttempt = now;
      Serial.println("WiFi connection lost. Reconnecting...");
      connectWithFallback();

      // If still not connected, increase delay for next attempt
      if (WiFi.status() != WL_CONNECTED) {
        _reconnectDelay = getNextReconnectDelay();
      }
    }
  }
}

bool WiFiManager::isConnected() { return WiFi.status() == WL_CONNECTED; }

String WiFiManager::getSSID() { return WiFi.SSID(); }

String WiFiManager::getIP() { return WiFi.localIP().toString(); }

bool WiFiManager::isUsingPrimary() { return _usingPrimaryWiFi; }

bool WiFiManager::connectPrimary() {
  Serial.println("Attempting primary WiFi (WPA2-Personal)...");
  Serial.print("SSID: ");
  Serial.println(_primarySsid);

  WiFi.disconnect(true);
  WiFi.mode(WIFI_STA);
  WiFi.begin(_primarySsid, _primaryPassword);

  int attempts = 20; // 10 seconds (20 * 500ms)
  while (WiFi.status() != WL_CONNECTED && attempts-- > 0) {
    vTaskDelay(pdMS_TO_TICKS(500));
    Serial.print(".");
  }
  Serial.println();
  return WiFi.status() == WL_CONNECTED;
}

bool WiFiManager::connectSecondary() {
  Serial.println("Attempting secondary WiFi (WPA2-Enterprise)...");
  Serial.print("SSID: ");
  Serial.println(_secondarySsid);

  WiFi.disconnect(true);
  WiFi.mode(WIFI_STA);

  esp_wifi_sta_wpa2_ent_set_identity((uint8_t *)_secondaryIdentity,
                                     strlen(_secondaryIdentity));
  esp_wifi_sta_wpa2_ent_set_username((uint8_t *)_secondaryUsername,
                                     strlen(_secondaryUsername));
  esp_wifi_sta_wpa2_ent_set_password((uint8_t *)_secondaryPassword,
                                     strlen(_secondaryPassword));
  esp_wifi_sta_wpa2_ent_enable();

  WiFi.begin(_secondarySsid);

  int attempts = 40; // 20 seconds (40 * 500ms)
  while (WiFi.status() != WL_CONNECTED && attempts-- > 0) {
    vTaskDelay(pdMS_TO_TICKS(500));
    Serial.print(".");
  }
  Serial.println();
  return WiFi.status() == WL_CONNECTED;
}

void WiFiManager::resetReconnectDelay() { _reconnectDelay = 500; }

int WiFiManager::getNextReconnectDelay() {
  // Exponential backoff: 500ms -> 1s -> 2s -> 4s (max)
  int nextDelay = _reconnectDelay * 2;
  return (nextDelay > 4000) ? 4000 : nextDelay;
}

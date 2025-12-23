#ifndef FIREBASE_MANAGER_H
#define FIREBASE_MANAGER_H

#include <Arduino.h>
#include <WiFiClientSecure.h>

// Define build options for Firebase library
#define ENABLE_DATABASE
#define ENABLE_LEGACY_TOKEN
#include <FirebaseClient.h>

#include "../../include/DataTypes.h"
#include "PushId.h"

class FirebaseManager {
public:
  // Constructor
  FirebaseManager(const char *firebaseHost, const char *firebaseAuth);

  // Initialize Firebase connection (must be called from task, not setup)
  void begin();

  // Check if Firebase is ready
  bool isReady();

  // Maintain Firebase connection (call regularly)
  void loop();

  // Upload batch of sensor data to Firebase
  bool uploadBatch(SensorData *dataArray, int count,
                   unsigned long &lastSyncTime);

  // Upload single event to Firebase
  bool uploadEvent(const EventData &event);

private:
  const char *_firebaseHost;
  const char *_firebaseAuth;

  // Firebase objects
  WiFiClientSecure _sslClient;
  AsyncClientClass _aClient;
  LegacyToken _legacyToken;
  FirebaseApp _app;
  RealtimeDatabase _database;

  // Build JSON for batch update
  String buildBatchJson(SensorData *dataArray, int count);

  // Build JSON for single event
  String buildEventJson(const EventData &event, const String &key);
};

#endif // FIREBASE_MANAGER_H

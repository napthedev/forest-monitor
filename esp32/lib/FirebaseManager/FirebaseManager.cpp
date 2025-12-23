#include "FirebaseManager.h"

FirebaseManager::FirebaseManager(const char *firebaseHost,
                                 const char *firebaseAuth)
    : _firebaseHost(firebaseHost), _firebaseAuth(firebaseAuth),
      _aClient(_sslClient), _legacyToken(firebaseAuth) {
  // Constructor
}

void FirebaseManager::begin() {
  Serial.printf("Firebase Client v%s\n", FIREBASE_CLIENT_VERSION);

  // Set SSL client to insecure mode (no certificate validation)
  _sslClient.setInsecure();

  Serial.println("Initializing Firebase app...");
  initializeApp(_aClient, _app, getAuth(_legacyToken));

  _app.getApp<RealtimeDatabase>(_database);
  _database.url(_firebaseHost);

  Serial.println("Firebase initialized.");
}

bool FirebaseManager::isReady() { return _app.ready(); }

void FirebaseManager::loop() { _app.loop(); }

bool FirebaseManager::uploadBatch(SensorData *dataArray, int count,
                                  unsigned long &lastSyncTime) {
  if (!isReady() || count == 0) {
    return false;
  }

  Serial.println("--------------------------------");
  Serial.printf("Uploading batch of %d sensor readings...\n", count);

  // Build batch JSON
  String batchJson = buildBatchJson(dataArray, count);

  // Execute atomic batch update
  bool success = _database.update<object_t>(_aClient, "", object_t(batchJson));

  if (success) {
    Serial.println("Batch sensor data pushed successfully.");
    lastSyncTime = millis();
  } else {
    Serial.println("Failed to push batch sensor data.");
  }

  return success;
}

bool FirebaseManager::uploadEvent(const EventData &event) {
  if (!isReady()) {
    return false;
  }

  String eventKey = generatePushId();
  String eventJson = buildEventJson(event, eventKey);

  const char *eventTypeName = (event.type == MOTION) ? "motion" : "vibration";
  Serial.printf("%s event detected! Uploading...\n", eventTypeName);

  bool success = _database.update<object_t>(_aClient, "", object_t(eventJson));

  if (success) {
    Serial.printf("%s event uploaded successfully.\n", eventTypeName);
  } else {
    Serial.printf("Failed to upload %s event.\n", eventTypeName);
  }

  return success;
}

String FirebaseManager::buildBatchJson(SensorData *dataArray, int count) {
  String batchJson = "{";

  for (int i = 0; i < count; i++) {
    SensorData &data = dataArray[i];

    // Generate unique keys for each sensor record
    String lightKey = generatePushId();
    String gasKey = generatePushId();
    String flameKey = generatePushId();
    String soilKey = generatePushId();
    String soundKey = generatePushId();

    // Add analog sensor data
    if (i > 0)
      batchJson += ",";

    batchJson += "\"/sensors/light/" + lightKey +
                 "\":{\"value\":" + String(data.lightValue) +
                 ",\"timestamp\":{\".sv\":\"timestamp\"}},";

    batchJson += "\"/sensors/gas/" + gasKey +
                 "\":{\"value\":" + String(data.gasValue) +
                 ",\"timestamp\":{\".sv\":\"timestamp\"}},";

    batchJson += "\"/sensors/flame/" + flameKey +
                 "\":{\"value\":" + String(data.flameValue) +
                 ",\"timestamp\":{\".sv\":\"timestamp\"}},";

    batchJson += "\"/sensors/soil-moisture/" + soilKey +
                 "\":{\"value\":" + String(data.soilMoistureValue) +
                 ",\"timestamp\":{\".sv\":\"timestamp\"}},";

    batchJson += "\"/sensors/sound/" + soundKey +
                 "\":{\"amplitude\":" + String(data.soundAmplitude) +
                 ",\"timestamp\":{\".sv\":\"timestamp\"}}";

    // Add temperature and humidity if valid
    if (data.temperatureValid) {
      String tempKey = generatePushId();
      batchJson += ",\"/sensors/temperature/" + tempKey +
                   "\":{\"value\":" + String(data.temperature, 1) +
                   ",\"timestamp\":{\".sv\":\"timestamp\"}}";
    }

    if (data.humidityValid) {
      String humKey = generatePushId();
      batchJson += ",\"/sensors/humidity/" + humKey +
                   "\":{\"value\":" + String(data.humidity, 1) +
                   ",\"timestamp\":{\".sv\":\"timestamp\"}}";
    }
  }

  batchJson += "}";
  return batchJson;
}

String FirebaseManager::buildEventJson(const EventData &event,
                                       const String &key) {
  const char *eventPath = (event.type == MOTION) ? "motion" : "vibration";

  String eventJson = "{\"/sensors/" + String(eventPath) + "/" + key +
                     "\":{\"timestamp\":{\".sv\":\"timestamp\"}}}";

  return eventJson;
}

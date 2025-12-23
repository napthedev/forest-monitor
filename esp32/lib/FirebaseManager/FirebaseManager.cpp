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
  // Calculate averages and max values across the batch
  unsigned long lightSum = 0, gasSum = 0, flameSum = 0, soilSum = 0;
  unsigned int soundMax = 0;
  float tempSum = 0.0, humSum = 0.0;
  int tempValidCount = 0, humValidCount = 0;

  for (int i = 0; i < count; i++) {
    SensorData &data = dataArray[i];

    // Sum analog sensor values
    lightSum += data.lightValue;
    gasSum += data.gasValue;
    flameSum += data.flameValue;
    soilSum += data.soilMoistureValue;

    // Track maximum sound value (peak-to-peak)
    if (data.soundValue > soundMax) {
      soundMax = data.soundValue;
    }

    // Sum valid temperature and humidity readings
    if (data.temperatureValid) {
      tempSum += data.temperature;
      tempValidCount++;
    }
    if (data.humidityValid) {
      humSum += data.humidity;
      humValidCount++;
    }
  }

  // Calculate averages
  unsigned int lightAvg = lightSum / count;
  unsigned int gasAvg = gasSum / count;
  unsigned int flameAvg = flameSum / count;
  unsigned int soilAvg = soilSum / count;
  float tempAvg = (tempValidCount > 0) ? (tempSum / tempValidCount) : 0.0;
  float humAvg = (humValidCount > 0) ? (humSum / humValidCount) : 0.0;

  // Build JSON with averaged values (one record per sensor type)
  String batchJson = "{";

  // Generate unique keys for each sensor type
  String lightKey = generatePushId();
  String gasKey = generatePushId();
  String flameKey = generatePushId();
  String soilKey = generatePushId();
  String soundKey = generatePushId();

  // Add analog sensor data with averaged values
  batchJson += "\"/sensors/light/" + lightKey +
               "\":{\"value\":" + String(lightAvg) +
               ",\"timestamp\":{\".sv\":\"timestamp\"}},";

  batchJson += "\"/sensors/gas/" + gasKey + "\":{\"value\":" + String(gasAvg) +
               ",\"timestamp\":{\".sv\":\"timestamp\"}},";

  batchJson += "\"/sensors/flame/" + flameKey +
               "\":{\"value\":" + String(flameAvg) +
               ",\"timestamp\":{\".sv\":\"timestamp\"}},";

  batchJson += "\"/sensors/soil-moisture/" + soilKey +
               "\":{\"value\":" + String(soilAvg) +
               ",\"timestamp\":{\".sv\":\"timestamp\"}},";

  batchJson += "\"/sensors/sound/" + soundKey +
               "\":{\"value\":" + String(soundMax) +
               ",\"timestamp\":{\".sv\":\"timestamp\"}}";

  // Add temperature if any valid readings exist
  if (tempValidCount > 0) {
    String tempKey = generatePushId();
    batchJson += ",\"/sensors/temperature/" + tempKey +
                 "\":{\"value\":" + String(tempAvg, 1) +
                 ",\"timestamp\":{\".sv\":\"timestamp\"}}";
  }

  // Add humidity if any valid readings exist
  if (humValidCount > 0) {
    String humKey = generatePushId();
    batchJson += ",\"/sensors/humidity/" + humKey +
                 "\":{\"value\":" + String(humAvg, 1) +
                 ",\"timestamp\":{\".sv\":\"timestamp\"}}";
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

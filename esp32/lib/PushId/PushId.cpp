#include "PushId.h"

// Characters used for generating unique push IDs (Firebase-style)
static const char PUSH_CHARS[] =
    "-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz";
static unsigned long lastPushTime = 0;
static int lastRandChars[12];

String generatePushId() {
  unsigned long now = millis();
  bool duplicateTime = (now == lastPushTime);
  lastPushTime = now;

  char timeStampChars[9];
  for (int i = 7; i >= 0; i--) {
    timeStampChars[i] = PUSH_CHARS[now % 64];
    now = now / 64;
  }
  timeStampChars[8] = '\0';

  String id = String(timeStampChars);

  if (!duplicateTime) {
    for (int i = 0; i < 12; i++) {
      lastRandChars[i] = random(64);
    }
  } else {
    // Increment the last random chars to ensure uniqueness
    int i;
    for (i = 11; i >= 0 && lastRandChars[i] == 63; i--) {
      lastRandChars[i] = 0;
    }
    if (i >= 0) {
      lastRandChars[i]++;
    }
  }

  for (int i = 0; i < 12; i++) {
    id += PUSH_CHARS[lastRandChars[i]];
  }

  return id;
}

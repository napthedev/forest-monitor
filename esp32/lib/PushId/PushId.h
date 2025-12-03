#ifndef PUSH_ID_H
#define PUSH_ID_H

#include <Arduino.h>

// Generate a unique push ID locally (similar to Firebase push keys)
// Returns a 20-character unique ID string
String generatePushId();

#endif

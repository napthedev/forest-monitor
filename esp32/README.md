# Forest Monitor Project

This project uses an ESP32 to monitor forest conditions and control an LED via Firebase.

## Configuration

To run this project, you need to configure the WiFi and Firebase credentials. These are kept in a `secrets.h` file which is not included in the repository for security reasons.

### Setting up `secrets.h`

1. Navigate to the `include/` directory.
2. Create a new file named `secrets.h`.
3. Copy the following template into `secrets.h` and fill in your credentials:

```cpp
#pragma once

// Primary WiFi Secrets (WPA2-Personal)
#define PRIMARY_WIFI_SSID "YOUR_PRIMARY_WIFI_SSID"
#define PRIMARY_WIFI_PASSWORD "YOUR_PRIMARY_WIFI_PASSWORD"

// Secondary WiFi Secrets (WPA2-Enterprise - fallback)
#define SECONDARY_WIFI_SSID "YOUR_SECONDARY_WIFI_SSID"
#define SECONDARY_WIFI_IDENTITY "YOUR_WIFI_IDENTITY"
#define SECONDARY_WIFI_USERNAME "YOUR_WIFI_USERNAME"
#define SECONDARY_WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// Firebase Secrets
#define FIREBASE_HOST_URL "YOUR_FIREBASE_HOST_URL" // e.g., "https://your-project.firebaseio.com"
#define FIREBASE_AUTH_TOKEN "YOUR_FIREBASE_DATABASE_SECRET"
```

The system will first attempt to connect to the primary WiFi (WPA2-Personal). If that fails after 10 seconds, it will fall back to the secondary WiFi (WPA2-Enterprise) with a 20 second timeout.

## Building and Uploading

1. Open the project in VS Code with the PlatformIO extension.
2. Ensure `include/secrets.h` is created and populated.
3. Build the project using the PlatformIO Build task.
4. Upload to your ESP32 device.

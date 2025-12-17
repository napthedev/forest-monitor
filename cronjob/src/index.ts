import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, remove } from "firebase/database";

// Configuration from environment variables
const FIREBASE_DATABASE_URL = process.env.FIREBASE_DATABASE_URL;
const FIREBASE_AUTH_TOKEN = process.env.FIREBASE_AUTH_TOKEN;

// Sensor paths to clean up
const SENSOR_PATHS = [
  "light",
  "gas",
  "flame",
  "soil-moisture",
  "motion",
  "sound",
  "vibration",
  "humidity",
  "temperature",
];

// Records older than this many days will be deleted
const RETENTION_DAYS = 3;

async function main() {
  // Validate environment variables
  if (!FIREBASE_DATABASE_URL) {
    console.error(
      "Error: FIREBASE_DATABASE_URL environment variable is not set"
    );
    process.exit(1);
  }

  if (!FIREBASE_AUTH_TOKEN) {
    console.error("Error: FIREBASE_AUTH_TOKEN environment variable is not set");
    process.exit(1);
  }

  // Initialize Firebase with legacy token auth
  const app = initializeApp({
    databaseURL: `${FIREBASE_DATABASE_URL}?auth=${FIREBASE_AUTH_TOKEN}`,
  });

  const database = getDatabase(app);

  // Calculate cutoff timestamp (3 days ago)
  const cutoffTimestamp = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  console.log(
    `Deleting records older than ${new Date(cutoffTimestamp).toISOString()}`
  );

  let totalDeleted = 0;
  let hasError = false;

  for (const sensorPath of SENSOR_PATHS) {
    try {
      console.log(`\nProcessing sensor: ${sensorPath}`);

      const sensorRef = ref(database, `sensors/${sensorPath}`);
      const snapshot = await get(sensorRef);

      if (!snapshot.exists()) {
        console.log(`  No data found for ${sensorPath}`);
        continue;
      }

      const data = snapshot.val() as Record<string, { timestamp: number }>;
      const recordIds = Object.keys(data);
      console.log(`  Found ${recordIds.length} records`);

      let deletedCount = 0;

      // Filter and delete old records
      for (const recordId of recordIds) {
        const record = data[recordId];

        if (record.timestamp && record.timestamp < cutoffTimestamp) {
          const recordRef = ref(database, `sensors/${sensorPath}/${recordId}`);
          await remove(recordRef);
          deletedCount++;
        }
      }

      console.log(`  Deleted ${deletedCount} old records from ${sensorPath}`);
      totalDeleted += deletedCount;
    } catch (error) {
      console.error(`  Error processing ${sensorPath}:`, error);
      hasError = true;
    }
  }

  console.log(`\n========================================`);
  console.log(`Total records deleted: ${totalDeleted}`);
  console.log(`========================================`);

  if (hasError) {
    console.error("\nCompleted with errors");
    process.exit(1);
  }

  console.log("\nCompleted successfully");
  process.exit(0);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

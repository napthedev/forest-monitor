# Cronjob Setup Guide

This cronjob deletes sensor records older than 3 days from Firebase Realtime Database. It runs daily via GitHub Actions.

## Prerequisites

- Access to your Firebase project console
- Admin access to the GitHub repository

## Step 1: Get Firebase Database URL

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Realtime Database** in the left sidebar
4. Copy the database URL (e.g., `https://your-project-default-rtdb.firebaseio.com`)

## Step 2: Get Firebase Database Secret (Legacy Token)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the **gear icon** ⚙️ next to "Project Overview" and select **Project settings**
4. Go to the **Service accounts** tab
5. Scroll down to find **Database secrets** section
6. Click **Show** to reveal the secret, then copy it

> **Note**: Database secrets are legacy tokens. If you don't see this option, you may need to enable it or use a service account instead.

## Step 3: Configure GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add the following secrets:

| Secret Name | Value |
|-------------|-------|
| `FIREBASE_DATABASE_URL` | Your Firebase Realtime Database URL (e.g., `https://your-project-default-rtdb.firebaseio.com`) |
| `FIREBASE_AUTH_TOKEN` | Your Firebase Database Secret (legacy token) |

## Step 4: Enable GitHub Actions

The workflow file is already set up at `.github/workflows/delete-old-records.yml`. It will:

- Run automatically every day at 00:00 UTC
- Can also be triggered manually from the Actions tab

## Manual Trigger

To run the cronjob manually:

1. Go to your repository on GitHub
2. Click on the **Actions** tab
3. Select **Delete Old Sensor Records** workflow
4. Click **Run workflow** button

## Local Testing

To test the script locally:

1. Navigate to the cronjob directory:
   ```bash
   cd cronjob
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set environment variables:
   ```bash
   export FIREBASE_DATABASE_URL="your-database-url"
   export FIREBASE_AUTH_TOKEN="your-auth-token"
   ```

4. Run the script:
   ```bash
   npm start
   ```

## Configuration

You can modify the following in `src/index.ts`:

- `RETENTION_DAYS`: Number of days to retain records (default: 3)
- `SENSOR_PATHS`: Array of sensor paths to clean up

## Troubleshooting

### Permission Denied Error
- Ensure your Firebase Database Secret is correct
- Check that your database rules allow read/write access with the token

### No Records Deleted
- Verify that records have a `timestamp` field
- Check that the timestamp is in milliseconds (Unix epoch)

### Workflow Not Running
- Ensure GitHub Actions is enabled for your repository
- Check that the secrets are correctly configured

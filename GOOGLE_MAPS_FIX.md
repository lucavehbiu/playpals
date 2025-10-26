# Fix Google Maps API RefererNotAllowedMapError

## Problem
```
Google Maps JavaScript API error: RefererNotAllowedMapError
Your site URL to be authorized: http://localhost:5000/events/create
```

This error occurs because your Google Maps API key has referrer restrictions that don't include localhost.

## Solution

### Option 1: Add Localhost to Existing Key (Recommended for Development)

1. Go to [Google Cloud Console - API Credentials](https://console.cloud.google.com/apis/credentials?project=robust-radar-430916-p3)

2. Find your **Maps JavaScript API key**: `AIzaSyAec-E2nWO9J91iMWzI3vVRSVg3oyAuw6I`

3. Click the key name to edit it

4. Scroll to **"Set an application restriction"** section

5. If you see "HTTP referrers (web sites)", click "Add an item" and add these URLs:
   ```
   http://localhost:5000/*
   http://127.0.0.1:5000/*
   ```

6. Click **"Save"** at the bottom

7. Wait 1-2 minutes for changes to propagate

8. Refresh your browser at `http://localhost:5000/events/create`

### Option 2: Create a Separate Development API Key

If you want to keep your production key restricted:

1. Go to [Google Cloud Console - API Credentials](https://console.cloud.google.com/apis/credentials?project=robust-radar-430916-p3)

2. Click **"+ CREATE CREDENTIALS"** > **"API key"**

3. A new key will be created - copy it

4. Click on the new key to configure it:
   - Name it: "Maps API - Local Development"
   - Under "API restrictions", select "Restrict key"
   - Choose: "Maps JavaScript API", "Places API", "Geocoding API"
   - Under "Website restrictions", add:
     ```
     http://localhost:5000/*
     http://127.0.0.1:5000/*
     ```

5. Click **"Save"**

6. Update your `.env` file:
   ```bash
   VITE_GOOGLE_MAPS_API_KEY="YOUR_NEW_DEV_KEY_HERE"
   ```

7. Restart your dev server:
   ```bash
   npm run dev
   ```

### Option 3: Remove Restrictions (NOT Recommended for Production)

⚠️ **Security Warning**: Only do this for local development keys!

1. Go to your API key settings
2. Under "Application restrictions", select **"None"**
3. Click "Save"

This removes all security restrictions. Never use an unrestricted key in production!

## Verify the Fix

1. Open browser console (F12)
2. Navigate to `http://localhost:5000/events/create`
3. You should see the Google Maps autocomplete working
4. No more "RefererNotAllowedMapError" in console

## Additional Configuration

Make sure these APIs are enabled in your Google Cloud project:
- ✅ Maps JavaScript API
- ✅ Places API
- ✅ Geocoding API

Enable them at: https://console.cloud.google.com/apis/library?project=robust-radar-430916-p3

## Troubleshooting

### Error persists after adding referrer
- Wait 2-5 minutes for Google's servers to propagate changes
- Clear browser cache and hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)
- Check that you edited the correct API key

### Wrong API key error
- Verify the key in `.env` matches the one in Google Cloud Console
- Make sure the key starts with `AIza`
- Restart your development server after changing `.env`

### API not enabled error
- Make sure Maps JavaScript API is enabled
- Go to: https://console.cloud.google.com/apis/library/maps-backend.googleapis.com?project=robust-radar-430916-p3
- Click "Enable" if it's not already enabled

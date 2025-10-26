# Google Cloud Storage Image Setup

## Overview

All images for PlayPals are now stored in Google Cloud Storage (GCS) bucket: `gs://playpals`

## Image Storage Structure

Images are organized into subfolders:

```
gs://playpals/
├── profiles/        # User profile images
├── covers/          # User cover/banner images
├── events/          # Event images
├── team-posts/      # Team post images
└── tournaments/     # Tournament images
```

## Configuration

### Environment Variables

Add to your `.env` file:

```bash
# Google Cloud Storage Configuration
GCS_BUCKET_NAME="playpals"
GCP_PROJECT_ID="your-project-id"    # Get from GCP Console
# GCP_KEYFILE_PATH=""                # Optional: path to service account key
```

### Authentication

Two options:

**Option 1: Application Default Credentials (Recommended for local dev)**

```bash
# Install gcloud CLI if not already installed
# https://cloud.google.com/sdk/docs/install

# Authenticate with your Google account
gcloud auth application-default login

# Set the project
gcloud config set project YOUR_PROJECT_ID
```

**Option 2: Service Account Key**

1. Go to GCP Console > IAM & Admin > Service Accounts
2. Create a service account with "Storage Admin" role
3. Download the JSON key file
4. Set `GCP_KEYFILE_PATH` in `.env` to the path of the key file

## API Endpoints

### Upload Images

All upload endpoints require authentication and use `multipart/form-data` with field name `image`.

**Profile Image:**

```bash
POST /api/users/:userId/profile-image
Content-Type: multipart/form-data
Field: image (file)

# Example with curl:
curl -X POST http://localhost:5000/api/users/4/profile-image \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -F "image=@/path/to/profile.jpg"
```

**Cover Image:**

```bash
POST /api/users/:userId/cover-image
Content-Type: multipart/form-data
Field: image (file)
```

**Event Image:**

```bash
POST /api/events/:eventId/image
Content-Type: multipart/form-data
Field: image (file)
```

**Team Post Image:**

```bash
POST /api/teams/:teamId/posts/:postId/image
Content-Type: multipart/form-data
Field: image (file)
```

**Tournament Image:**

```bash
POST /api/tournaments/:tournamentId/image
Content-Type: multipart/form-data
Field: image (file)
```

### Response Format

All upload endpoints return:

```json
{
  "imageUrl": "https://storage.googleapis.com/playpals/profiles/user-4-1234567890.jpg",
  "user": { ... }  // or event/post/tournament object
}
```

## Image Constraints

- **Max file size:** 5MB
- **Allowed formats:** JPEG, PNG, GIF, WebP
- **Access:** Public (anyone with URL can view)
- **Cache:** 1 year (images are immutable)

## Frontend Integration

### React Example (using fetch)

```typescript
async function uploadProfileImage(userId: number, imageFile: File) {
  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await fetch(`/api/users/${userId}/profile-image`, {
    method: 'POST',
    body: formData,
    credentials: 'include', // Important for session cookies
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  const data = await response.json();
  return data.imageUrl;
}
```

### React Hook

```typescript
import { useMutation } from '@tanstack/react-query';

function useUploadProfileImage(userId: number) {
  return useMutation({
    mutationFn: async (imageFile: File) => {
      const formData = new FormData();
      formData.append('image', imageFile);

      const res = await fetch(`/api/users/${userId}/profile-image`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Upload failed');
      }

      return res.json();
    },
    onSuccess: (data) => {
      // Invalidate queries to refresh UI
      queryClient.invalidateQueries([`/api/users/${userId}`]);
    },
  });
}
```

## Database Schema

Image URLs are stored as text fields:

```sql
-- users table
profile_image TEXT           -- User profile picture URL
profile_image_url TEXT       -- Google OAuth profile picture
cover_image TEXT             -- User cover/banner image URL

-- events table
event_image TEXT             -- Event image URL

-- team_posts table
image TEXT                   -- Post image URL

-- tournaments table
tournament_image TEXT        -- Tournament image URL
```

## GCS Bucket Setup (for deployment)

### Create Bucket (if not exists)

```bash
# Create the bucket
gsutil mb -p YOUR_PROJECT_ID -l us-east1 gs://playpals

# Make it public (for public image access)
gsutil iam ch allUsers:objectViewer gs://playpals

# Set CORS for web uploads
cat > cors.json << EOF
[
  {
    "origin": ["http://localhost:5000", "https://your-production-domain.com"],
    "method": ["GET", "POST", "PUT", "DELETE"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
EOF

gsutil cors set cors.json gs://playpals
```

### Lifecycle Rules (Optional - auto-delete old files)

```bash
cat > lifecycle.json << EOF
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {"age": 365}
      }
    ]
  }
}
EOF

gsutil lifecycle set lifecycle.json gs://playpals
```

## Security Considerations

1. **File Validation:** All uploads are validated for:
   - File type (only images allowed)
   - File size (max 5MB)
   - User authorization

2. **Old Image Cleanup:** When updating an image, the old image is automatically deleted from GCS

3. **Public Access:** Images are publicly accessible by URL. Don't upload sensitive information.

4. **Rate Limiting:** Consider adding rate limiting to upload endpoints in production

## Monitoring

View storage usage and costs:

```bash
# Check bucket size
gsutil du -sh gs://playpals

# List recent uploads
gsutil ls -lh gs://playpals/profiles/ | tail -10
```

## Troubleshooting

### "Permission denied" errors

```bash
# Re-authenticate
gcloud auth application-default login

# Verify your account has Storage Admin role
gcloud projects get-iam-policy YOUR_PROJECT_ID
```

### "Bucket not found" errors

```bash
# Verify bucket exists
gsutil ls -p YOUR_PROJECT_ID | grep playpals

# Check you're using correct project
gcloud config get-value project
```

### Images not loading

1. Verify image URL format: `https://storage.googleapis.com/playpals/folder/filename`
2. Check bucket is public: `gsutil iam get gs://playpals`
3. Verify CORS is configured: `gsutil cors get gs://playpals`

## Migration from Replit Storage

To migrate existing images from Replit:

1. Export all image URLs from database
2. Download images from Replit URLs
3. Upload to GCS using the upload endpoints
4. Update database with new GCS URLs

Script example:

```bash
# Get all events with images
psql $DATABASE_URL -c "SELECT id, event_image FROM events WHERE event_image IS NOT NULL" -t > events.txt

# Process each image (pseudocode)
while read -r line; do
  event_id=$(echo $line | awk '{print $1}')
  old_url=$(echo $line | awk '{print $2}')

  # Download image
  wget "$old_url" -O "/tmp/event-${event_id}.jpg"

  # Upload to GCS via API
  curl -X POST "http://localhost:5000/api/events/${event_id}/image" \
    -H "Cookie: connect.sid=$SESSION" \
    -F "image=@/tmp/event-${event_id}.jpg"
done < events.txt
```

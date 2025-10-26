import { Storage } from '@google-cloud/storage';
import multer from 'multer';
import { Request } from 'express';
import path from 'path';

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  // If you have a service account key file, specify it:
  // keyFilename: process.env.GCP_KEYFILE_PATH,
});

const bucketName = process.env.GCS_BUCKET_NAME || 'playpals';
const bucket = storage.bucket(bucketName);

// Image upload configuration
export const imageConfig = {
  buckets: {
    profiles: 'profiles',      // User profile images
    covers: 'covers',          // User cover images
    events: 'events',          // Event images
    teamPosts: 'team-posts',   // Team post images
    tournaments: 'tournaments', // Tournament images
  },
  maxSize: 5 * 1024 * 1024, // 5MB max file size
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ],
};

// Multer memory storage configuration
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: imageConfig.maxSize,
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (imageConfig.allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: ${imageConfig.allowedMimeTypes.join(', ')}`));
    }
  },
});

/**
 * Upload an image to Google Cloud Storage
 * @param file - Multer file object
 * @param folder - Subfolder in the bucket (e.g., 'profiles', 'events')
 * @param fileName - Optional custom filename (auto-generated if not provided)
 * @returns Public URL of the uploaded image
 */
export async function uploadImageToGCS(
  file: Express.Multer.File,
  folder: string,
  fileName?: string
): Promise<string> {
  try {
    // Generate unique filename if not provided
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = fileName || `${timestamp}-${Math.random().toString(36).substring(7)}${ext}`;
    const gcsFileName = `${folder}/${name}`;

    // Create a blob in the bucket
    const blob = bucket.file(gcsFileName);
    const blobStream = blob.createWriteStream({
      resumable: false,
      metadata: {
        contentType: file.mimetype,
        cacheControl: 'public, max-age=31536000', // Cache for 1 year
      },
    });

    return new Promise((resolve, reject) => {
      blobStream.on('error', (err) => {
        console.error('GCS upload error:', err);
        reject(err);
      });

      blobStream.on('finish', async () => {
        // Return the public URL (bucket has uniform bucket-level access enabled)
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${gcsFileName}`;
        console.log('Image uploaded to GCS:', publicUrl);
        resolve(publicUrl);
      });

      blobStream.end(file.buffer);
    });
  } catch (error) {
    console.error('Error uploading to GCS:', error);
    throw error;
  }
}

/**
 * Delete an image from Google Cloud Storage
 * @param imageUrl - Full GCS URL of the image
 * @returns True if deleted successfully
 */
export async function deleteImageFromGCS(imageUrl: string): Promise<boolean> {
  try {
    // Extract filename from URL
    // Format: https://storage.googleapis.com/playpals/folder/filename.jpg
    const urlParts = imageUrl.split(`${bucketName}/`);
    if (urlParts.length < 2) {
      console.error('Invalid GCS URL format:', imageUrl);
      return false;
    }

    const fileName = urlParts[1];
    const file = bucket.file(fileName);

    await file.delete();
    console.log('Image deleted from GCS:', fileName);
    return true;
  } catch (error) {
    console.error('Error deleting from GCS:', error);
    return false;
  }
}

/**
 * Check if a file exists in GCS
 * @param imageUrl - Full GCS URL of the image
 * @returns True if file exists
 */
export async function imageExistsInGCS(imageUrl: string): Promise<boolean> {
  try {
    const urlParts = imageUrl.split(`${bucketName}/`);
    if (urlParts.length < 2) return false;

    const fileName = urlParts[1];
    const file = bucket.file(fileName);
    const [exists] = await file.exists();
    return exists;
  } catch (error) {
    console.error('Error checking file existence:', error);
    return false;
  }
}

/**
 * Get a signed URL for temporary access (if needed for private files)
 * @param fileName - File path in bucket
 * @param expirationMinutes - URL expiration time in minutes
 * @returns Signed URL
 */
export async function getSignedUrl(
  fileName: string,
  expirationMinutes: number = 60
): Promise<string> {
  const file = bucket.file(fileName);
  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + expirationMinutes * 60 * 1000,
  });
  return url;
}

/**
 * Upload profile image for a user
 */
export async function uploadProfileImage(
  file: Express.Multer.File,
  userId: number
): Promise<string> {
  return uploadImageToGCS(file, imageConfig.buckets.profiles, `user-${userId}-${Date.now()}`);
}

/**
 * Upload cover image for a user
 */
export async function uploadCoverImage(
  file: Express.Multer.File,
  userId: number
): Promise<string> {
  return uploadImageToGCS(file, imageConfig.buckets.covers, `user-${userId}-${Date.now()}`);
}

/**
 * Upload event image
 */
export async function uploadEventImage(
  file: Express.Multer.File,
  eventId: number
): Promise<string> {
  return uploadImageToGCS(file, imageConfig.buckets.events, `event-${eventId}-${Date.now()}`);
}

/**
 * Upload team post image
 */
export async function uploadTeamPostImage(
  file: Express.Multer.File,
  postId: number
): Promise<string> {
  return uploadImageToGCS(file, imageConfig.buckets.teamPosts, `post-${postId}-${Date.now()}`);
}

/**
 * Upload tournament image
 */
export async function uploadTournamentImage(
  file: Express.Multer.File,
  tournamentId: number
): Promise<string> {
  return uploadImageToGCS(file, imageConfig.buckets.tournaments, `tournament-${tournamentId}-${Date.now()}`);
}

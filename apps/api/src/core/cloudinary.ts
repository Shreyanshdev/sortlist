import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

export { cloudinary };

/**
 * Upload a buffer to Cloudinary as a raw file (PDF/DOCX).
 * Returns the secure URL for downloading.
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  filename: string
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        folder,
        public_id: filename,
        overwrite: false,
        access_mode: 'public',
        type: 'upload',
      },
      (error, result) => {
        if (error || !result) return reject(error || new Error('Cloudinary upload failed'));
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
}

/**
 * Download a raw file from Cloudinary using API credentials.
 * This bypasses all delivery restrictions (PDF/ZIP blocking, ACL, etc.)
 * by using the authenticated Admin API instead of public URLs.
 */
export async function downloadFromCloudinary(publicId: string): Promise<Buffer> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  // First, get the resource details using Admin API (authenticated)
  const resource = await cloudinary.api.resource(publicId, {
    resource_type: 'raw',
    type: 'upload',
  });

  // The secure_url from Admin API is the direct download link
  const downloadUrl = resource.secure_url;
  console.log(`[Cloudinary] Downloading via Admin API: ${downloadUrl}`);

  // Download the actual file bytes using Basic Auth
  const response = await axios.get(downloadUrl, {
    responseType: 'arraybuffer',
    auth: { username: apiKey || '', password: apiSecret || '' },
    timeout: 30000,
  });

  return Buffer.from(response.data);
}

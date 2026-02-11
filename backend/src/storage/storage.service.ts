import { Injectable } from '@nestjs/common';
import { S3Client, DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';

/** Build virtual-hosted-style base URL: https://bucket-name.endpoint-host (no trailing slash) */
function buildVirtualHostedBaseUrl(endpoint: string, bucket: string): string {
  const url = new URL(endpoint);
  return `${url.protocol}//${bucket}.${url.host}`;
}

const AVATAR_SIZE = 500;
const AVATAR_QUALITY = 85;
/** Presigned URL expiry for private buckets (e.g. Railway). */
const PRESIGNED_AVATAR_EXPIRY_SECONDS = 3600; // 1 hour

@Injectable()
export class StorageService {
  private readonly s3: S3Client | null = null;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor() {
    const bucket = process.env.AWS_S3_BUCKET_NAME;
    const endpoint = process.env.AWS_ENDPOINT_URL;
    const region = process.env.AWS_DEFAULT_REGION ?? 'auto';
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const publicUrlOverride = process.env.S3_PUBLIC_URL;

    this.bucket = bucket ?? '';
    // Virtual-hosted-style URL: https://bucket-name.endpoint-host (required for public access on many S3-compatible providers)
    this.publicBaseUrl =
      publicUrlOverride?.replace(/\/$/, '') ??
      (endpoint && bucket ? buildVirtualHostedBaseUrl(endpoint, bucket) : '');

    if (bucket && endpoint && accessKeyId && secretAccessKey) {
      this.s3 = new S3Client({
        endpoint,
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
        forcePathStyle: false, // virtual-hosted-style for API calls
      });
    }
  }

  isConfigured(): boolean {
    return this.s3 != null && this.bucket.length > 0;
  }

  /**
   * For private buckets (e.g. Railway), returns a presigned GET URL so the client can load the avatar.
   * If avatarUrl is not our storage URL, returns the original URL. Returns null if not configured.
   */
  async getPresignedAvatarUrl(avatarUrl: string | null): Promise<string | null> {
    if (!avatarUrl || !this.s3 || !this.bucket || !this.publicBaseUrl) {
      return avatarUrl;
    }
    const prefix = `${this.publicBaseUrl}/`;
    if (!avatarUrl.startsWith(prefix)) {
      return avatarUrl; // external URL (e.g. S3_PUBLIC_URL override)
    }
    const key = avatarUrl.slice(prefix.length);
    const url = await getSignedUrl(
      this.s3,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: PRESIGNED_AVATAR_EXPIRY_SECONDS },
    );
    return url;
  }

  /**
   * Resize image to max 500x500 (fit inside, keep aspect ratio), convert to WebP, then upload to S3.
   * Returns public URL of the uploaded avatar or null if storage is not configured.
   */
  async uploadAvatar(buffer: Buffer, userId: string): Promise<string | null> {
    if (!this.s3 || !this.bucket) {
      return null;
    }

    const resized = await sharp(buffer)
      .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: AVATAR_QUALITY })
      .toBuffer();

    const key = `avatars/${userId}.webp`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: resized,
        ContentType: 'image/webp',
      }),
    );

    return `${this.publicBaseUrl}/${key}`;
  }

  /**
   * Delete avatar object from S3 if avatarUrl points to our bucket.
   * Does nothing if URL is external or storage is not configured.
   */
  async deleteAvatar(avatarUrl: string | null): Promise<void> {
    if (!avatarUrl || !this.s3 || !this.bucket || !this.publicBaseUrl) {
      return;
    }
    const prefix = `${this.publicBaseUrl}/`;
    if (!avatarUrl.startsWith(prefix)) {
      return; // external URL, do not delete
    }
    const key = avatarUrl.slice(prefix.length);
    await this.s3.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }
}

import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';

const AVATAR_SIZE = 500;
const AVATAR_QUALITY = 85;

@Injectable()
export class StorageService {
  private readonly s3: S3Client | null = null;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor() {
    const bucket = process.env.S3_BUCKET;
    const endpoint = process.env.S3_ENDPOINT;
    const region = process.env.S3_REGION ?? 'auto';
    const accessKeyId = process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
    const publicUrlOverride = process.env.S3_PUBLIC_URL;

    this.bucket = bucket ?? '';
    this.publicBaseUrl =
      publicUrlOverride?.replace(/\/$/, '') ??
      (endpoint && bucket ? `${endpoint}/${bucket}` : '');

    if (bucket && endpoint && accessKeyId && secretAccessKey) {
      this.s3 = new S3Client({
        endpoint,
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
        forcePathStyle: true,
      });
    }
  }

  isConfigured(): boolean {
    return this.s3 != null && this.bucket.length > 0;
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
}

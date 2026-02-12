import { Injectable } from '@nestjs/common';
import { Readable } from 'stream';
import {
  S3Client,
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';
import { PRESIGNED_IMAGE_EXPIRY_SECONDS } from './constants';
import type { ImageUploadConfig } from './storage.types';

export type { ImageUploadConfig } from './storage.types';

/** Build virtual-hosted-style base URL: https://bucket-name.endpoint-host (no trailing slash) */
function buildVirtualHostedBaseUrl(endpoint: string, bucket: string): string {
  const url = new URL(endpoint);
  return `${url.protocol}//${bucket}.${url.host}`;
}

@Injectable()
export class StorageService {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor() {
    const bucket = process.env.AWS_S3_BUCKET_NAME;
    const endpoint = process.env.AWS_ENDPOINT_URL;
    const region = process.env.AWS_DEFAULT_REGION ?? 'auto';
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (bucket && endpoint && accessKeyId && secretAccessKey && region) {
      this.bucket = bucket;
      this.publicBaseUrl = buildVirtualHostedBaseUrl(endpoint, bucket);

      this.s3 = new S3Client({
        endpoint,
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
    } else {
      throw new Error('S3 is not configured');
    }
  }

  /** Whether S3 storage is available (constructor did not throw). */
  isConfigured(): boolean {
    return !!this.s3 && !!this.bucket;
  }

  async uploadImage(
    buffer: Buffer,
    identifier: string,
    config: ImageUploadConfig,
  ): Promise<string | null> {
    const { path, size, quality, width, height } = config;
    let pipeline = sharp(buffer);

    if (width != null && height != null) {
      pipeline = pipeline.resize(width, height, { fit: 'cover' });
    } else {
      pipeline = pipeline.resize(size, size, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    const resized = await pipeline.webp({ quality }).toBuffer();
    const key = `${path}/${identifier}.webp`;

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

  async getImage(imageUrl: string | null): Promise<Buffer | null> {
    if (!imageUrl) {
      return null;
    }
    const prefix = `${this.publicBaseUrl}/`;
    if (!imageUrl.startsWith(prefix)) {
      return null;
    }
    const pathPart = imageUrl.split('?')[0];
    const key = pathPart.slice(prefix.length);
    if (!key) return null;
    try {
      const res = await this.s3.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      if (!res.Body) return null;
      const stream = Readable.from(res.Body as NodeJS.ReadableStream);
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      return Buffer.concat(chunks);
    } catch {
      return null;
    }
  }

  async deleteImage(imageUrl: string | null): Promise<void> {
    if (!imageUrl || !this.s3 || !this.bucket || !this.publicBaseUrl) {
      return;
    }
    const prefix = `${this.publicBaseUrl}/`;
    if (!imageUrl.startsWith(prefix)) {
      return;
    }
    const pathPart = imageUrl.split('?')[0];
    const key = pathPart.slice(prefix.length);
    await this.s3.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  async getPresignedImageUrl(
    imageUrl: string | null,
    expiresInSeconds: number = PRESIGNED_IMAGE_EXPIRY_SECONDS,
  ): Promise<string | null> {
    if (!imageUrl || !this.s3 || !this.bucket || !this.publicBaseUrl) {
      return imageUrl;
    }
    const prefix = `${this.publicBaseUrl}/`;
    if (!imageUrl.startsWith(prefix)) {
      return imageUrl;
    }
    const pathPart = imageUrl.split('?')[0];
    const key = pathPart.slice(prefix.length);
    const url = await getSignedUrl(
      this.s3,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: expiresInSeconds },
    );
    return url;
  }

  // --- Avatar (backward-compatible wrappers) ---

  private static readonly AVATAR_CONFIG: ImageUploadConfig = {
    path: 'avatars',
    size: 500,
    quality: 85,
  };

  async getAvatarBuffer(avatarUrl: string | null): Promise<Buffer | null> {
    return this.getImage(avatarUrl);
  }

  async getPresignedAvatarUrl(
    avatarUrl: string | null,
  ): Promise<string | null> {
    return this.getPresignedImageUrl(avatarUrl);
  }

  async uploadAvatar(buffer: Buffer, userId: string): Promise<string | null> {
    return this.uploadImage(buffer, userId, StorageService.AVATAR_CONFIG);
  }

  async deleteAvatar(avatarUrl: string | null): Promise<void> {
    return this.deleteImage(avatarUrl);
  }

  // --- Cover photo (for profiles) ---

  private static readonly COVER_CONFIG: ImageUploadConfig = {
    path: 'covers',
    size: 1200,
    quality: 85,
  };

  async getPresignedCoverUrl(
    coverPhotoUrl: string | null,
  ): Promise<string | null> {
    return this.getPresignedImageUrl(coverPhotoUrl);
  }

  async uploadCoverPhoto(
    buffer: Buffer,
    profileId: string,
  ): Promise<string | null> {
    return this.uploadImage(buffer, profileId, StorageService.COVER_CONFIG);
  }

  async deleteCoverPhoto(coverPhotoUrl: string | null): Promise<void> {
    return this.deleteImage(coverPhotoUrl);
  }
}

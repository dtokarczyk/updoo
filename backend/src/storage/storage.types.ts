/** Config for image upload: path prefix, dimensions and WebP quality. */
export interface ImageUploadConfig {
  /** S3 key prefix (e.g. "avatars", "covers"). Key becomes `${path}/${identifier}.webp`. */
  path: string;
  /** Max dimension for fit 'inside' (keep aspect). Ignored when width/height are set. */
  size: number;
  /** WebP quality 1–100. */
  quality: number;
  /** Optional: exact width for fit 'cover'. */
  width?: number;
  /** Optional: exact height for fit 'cover'. When both width and height set, uses fit 'cover'. */
  height?: number;
}

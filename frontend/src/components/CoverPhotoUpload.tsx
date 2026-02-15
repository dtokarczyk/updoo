'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  VisuallyHidden,
} from '@/components/ui/dialog';
import { Camera, Trash2 } from 'lucide-react';
import {
  uploadProfileCover,
  removeProfileCover,
  type Profile,
} from '@/lib/api';
import { getCroppedImg, type PixelCrop } from '@/lib/crop-image';
import { cn } from '@/lib/utils';

const COVER_ASPECT = 16 / 9;

interface CoverPhotoUploadProps {
  profileId: string;
  coverPhotoUrl: string | null;
  onCoverUpdated: (profile: Profile) => void;
  disabled?: boolean;
  /** Translation function */
  t: (key: string) => string;
  /** Optional cache buster for cover URL (e.g. after upload) */
  coverCacheBuster?: number | null;
}

export function CoverPhotoUpload({
  profileId,
  coverPhotoUrl,
  onCoverUpdated,
  disabled = false,
  t,
  coverCacheBuster,
}: CoverPhotoUploadProps) {
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(
    null,
  );
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const coverDisplayUrl = coverPhotoUrl
    ? `${coverPhotoUrl}${coverCacheBuster ? `?v=${coverCacheBuster}` : ''}`
    : null;

  const onCropComplete = useCallback((_croppedArea: Area, pixels: Area) => {
    setCroppedAreaPixels({
      x: Math.round(pixels.x),
      y: Math.round(pixels.y),
      width: Math.round(pixels.width),
      height: Math.round(pixels.height),
    });
  }, []);

  // Set initial 16:9 center crop when image loads so Confirm is enabled without user interaction
  useEffect(() => {
    if (!imageSrc) return;
    const img = document.createElement('img');
    img.onload = () => {
      const { naturalWidth: w, naturalHeight: h } = img;
      const aspect = 16 / 9;
      let cropW: number;
      let cropH: number;
      if (w / h > aspect) {
        cropH = h;
        cropW = h * aspect;
      } else {
        cropW = w;
        cropH = w / aspect;
      }
      const x = (w - cropW) / 2;
      const y = (h - cropH) / 2;
      setCroppedAreaPixels({
        x: Math.round(x),
        y: Math.round(y),
        width: Math.round(cropW),
        height: Math.round(cropH),
      });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  const openFilePicker = () => {
    setError('');
    fileInputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      setError(
        t('profile.coverUploadFailed') ||
          'Nieprawidłowy format. Użyj JPEG, PNG, WebP lub GIF.',
      );
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
      setCropModalOpen(true);
      setError('');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const closeCropModal = () => {
    setCropModalOpen(false);
    setImageSrc(null);
    setCroppedAreaPixels(null);
  };

  const confirmCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setUploading(true);
    setError('');
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const updated = await uploadProfileCover(profileId, blob);
      onCoverUpdated(updated);
      closeCropModal();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('profile.coverUploadFailed') || 'Nie udało się wgrać zdjęcia',
      );
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveCover = async () => {
    setRemoving(true);
    setError('');
    try {
      const updated = await removeProfileCover(profileId);
      onCoverUpdated(updated);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('profile.coverUploadFailed') || 'Nie udało się usunąć zdjęcia',
      );
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* 16:9 preview / placeholder */}
      <div
        className={cn(
          'relative w-full overflow-hidden rounded-lg border bg-muted',
          COVER_ASPECT && 'aspect-video', // 16:9
        )}
      >
        {coverDisplayUrl ? (
          <Image
            src={coverDisplayUrl}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 896px"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <span className="text-sm">
              {t('profile.coverPlaceholder') || 'Zdjęcie w tle (16:9)'}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          disabled={disabled}
          onChange={onFileChange}
          aria-label={t('profile.changeCover') || 'Zmień zdjęcie w tle'}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || uploading || removing}
          onClick={openFilePicker}
          className="w-fit"
        >
          <Camera className="size-4" />
          {coverPhotoUrl
            ? t('profile.changeCover') || 'Zmień zdjęcie'
            : t('profile.addCover') || 'Dodaj zdjęcie w tle'}
        </Button>
        {coverPhotoUrl && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || uploading || removing}
            onClick={handleRemoveCover}
            className="w-fit text-destructive hover:text-destructive"
          >
            <Trash2 className="size-4" />
            {removing
              ? t('common.saving')
              : t('profile.removeCover') || 'Usuń zdjęcie'}
          </Button>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Crop modal */}
      <Dialog
        open={cropModalOpen}
        onOpenChange={(open) => !open && closeCropModal()}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>
              {t('profile.cropCover') || 'Kadruj zdjęcie (16:9)'}
            </DialogTitle>
            <VisuallyHidden>
              <p>
                {t('profile.cropCoverDesc') ||
                  'Przesuń i powiększ, aby wybrać fragment zdjęcia.'}
              </p>
            </VisuallyHidden>
          </DialogHeader>
          <div className="relative h-[50vh] w-full bg-black">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={COVER_ASPECT}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                objectFit="contain"
              />
            )}
          </div>
          <DialogFooter className="p-4">
            <Button
              type="button"
              variant="outline"
              onClick={closeCropModal}
              disabled={uploading}
            >
              {t('common.cancel') || 'Anuluj'}
            </Button>
            <Button
              type="button"
              onClick={confirmCrop}
              disabled={uploading || !croppedAreaPixels}
            >
              {uploading
                ? t('common.saving')
                : t('common.confirm') || 'Zatwierdź'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

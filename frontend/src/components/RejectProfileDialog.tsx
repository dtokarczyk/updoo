'use client';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const REJECT_REASON_MIN_LENGTH = 10;
const REJECT_REASON_MAX_LENGTH = 2000;

export interface RejectProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason: string;
  onReasonChange: (value: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export function RejectProfileDialog({
  open,
  onOpenChange,
  reason,
  onReasonChange,
  onSubmit,
  submitting,
  t,
}: RejectProfileDialogProps) {
  const canSubmit =
    reason.trim().length >= REJECT_REASON_MIN_LENGTH && !submitting;

  function handleClose() {
    if (!submitting) onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('company.rejectProfileTitle')}</DialogTitle>
          <DialogDescription>
            {t('company.rejectProfileDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="reject-profile-reason">
            {t('jobs.rejectReasonLabel')}
          </label>
          <Textarea
            id="reject-profile-reason"
            placeholder={t('company.rejectReasonPlaceholder')}
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            minLength={REJECT_REASON_MIN_LENGTH}
            maxLength={REJECT_REASON_MAX_LENGTH}
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            {t('jobs.rejectReasonHint')}
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={onSubmit}
            disabled={!canSubmit}
          >
            {submitting ? t('jobs.rejecting') : t('jobs.reject')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

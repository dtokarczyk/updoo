'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { JobForm } from '@/components/JobForm';
import { createProposal } from '@/lib/api';
import type { CreateJobPayload, CreateProposalPayload, ProposalReason } from '@/lib/api';
import { useTranslations } from '@/hooks/useTranslations';

const PROPOSAL_REASONS: ProposalReason[] = ['FB_GROUP'];

export default function AdminProposalsNewPage() {
  const router = useRouter();
  const { t } = useTranslations();
  const [step, setStep] = useState<1 | 2>(1);
  const [jobData, setJobData] = useState<CreateJobPayload | null>(null);
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState<ProposalReason>('FB_GROUP');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJobSubmit = async (data: CreateJobPayload) => {
    setJobData(data);
    setStep(2);
  };

  const handleProposalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobData) return;
    setError(null);
    setSubmitting(true);
    try {
      const payload: CreateProposalPayload = {
        ...jobData,
        email: email.trim(),
        reason,
      };
      await createProposal(payload);
      router.push('/admin/proposals');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.proposals.createFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.proposals.newTitle')}</CardTitle>
          <CardDescription>{t('admin.proposals.newDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 ? (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                {t('admin.proposals.step1Description')}
              </p>
              <JobForm mode="create" onSubmit={handleJobSubmit} />
            </>
          ) : (
            <form onSubmit={handleProposalSubmit} className="space-y-6">
              <p className="text-sm text-muted-foreground">
                {t('admin.proposals.step2Description')}
              </p>
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
              <div className="space-y-2">
                <Label htmlFor="proposal-email">{t('admin.proposals.emailLabel')}</Label>
                <Input
                  id="proposal-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                  disabled={submitting}
                  className="max-w-md"
                />
              </div>
              <div className="space-y-2 max-w-md">
                <Label htmlFor="proposal-reason">{t('admin.proposals.reasonLabel')}</Label>
                <Select
                  value={reason}
                  onValueChange={(v) => setReason(v as ProposalReason)}
                  disabled={submitting}
                >
                  <SelectTrigger id="proposal-reason">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPOSAL_REASONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r === 'FB_GROUP' ? t('admin.proposals.reasonFbGroup') : r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  disabled={submitting}
                >
                  {t('common.back')}
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? t('common.submitting') : t('admin.proposals.sendInvitation')}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

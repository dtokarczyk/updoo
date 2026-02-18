'use client';

import { useCallback, useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  getProposalByToken,
  acceptProposal,
  rejectProposal,
} from '@/lib/api';
import type { ProposalByTokenResponse } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useTranslations } from '@/hooks/useTranslations';

type ViewState = 'loading' | 'invalid' | 'pending' | 'accepted' | 'rejected';

function InvitationContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const rejectParam = searchParams.get('reject');
  const { t } = useTranslations();
  const [state, setState] = useState<ViewState>('loading');
  const [proposal, setProposal] = useState<ProposalByTokenResponse | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadProposal = useCallback(async () => {
    if (!token.trim()) {
      setState('invalid');
      return;
    }
    try {
      const data = await getProposalByToken(token);
      if (!data) {
        setState('invalid');
        return;
      }
      setProposal(data);
      if (data.status !== 'PENDING') {
        setState('invalid');
        return;
      }
      setState('pending');
    } catch {
      setState('invalid');
    }
  }, [token]);

  useEffect(() => {
    loadProposal();
  }, [loadProposal]);

  useEffect(() => {
    if (state === 'pending' && rejectParam === '1') {
      setActionLoading(true);
      rejectProposal(token)
        .then((res) => {
          setMessage(res.message);
          setState('rejected');
        })
        .catch((err) => setError(err instanceof Error ? err.message : 'Reject failed'))
        .finally(() => setActionLoading(false));
    }
  }, [state, rejectParam, token]);

  const handleAccept = async () => {
    setError(null);
    setActionLoading(true);
    try {
      const res = await acceptProposal(token);
      setMessage(res.message);
      setState('accepted');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Accept failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    setError(null);
    setActionLoading(true);
    try {
      const res = await rejectProposal(token);
      setMessage(res.message);
      setState('rejected');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reject failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  if (state === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{t('invitation.title')}</CardTitle>
            <CardDescription>{t('invitation.invalidLink')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/login">{t('invitation.goToLogin')}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state === 'accepted' || state === 'rejected') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{t('invitation.title')}</CardTitle>
            <CardDescription>
              {message ?? (state === 'accepted' ? t('invitation.acceptSuccess') : t('invitation.rejectSuccess'))}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/login">{t('invitation.goToLogin')}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const introText =
    proposal?.reason === 'FB_GROUP'
      ? t('invitation.introFbGroup', { title: proposal?.title ?? '' })
      : proposal?.title
        ? t('invitation.introFbGroup', { title: proposal.title })
        : t('invitation.introFbGroup', { title: '' });

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('invitation.title')}</CardTitle>
          <CardDescription>{introText}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <p className="text-destructive text-sm">{error}</p>
          )}
          <div className="flex gap-2">
            <Button
              onClick={handleAccept}
              disabled={actionLoading}
            >
              {actionLoading ? t('common.submitting') : t('invitation.agree')}
            </Button>
            <Button
              variant="outline"
              onClick={handleReject}
              disabled={actionLoading}
            >
              {t('invitation.reject')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function InvitationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center p-4"><p className="text-muted-foreground">Loading…</p></div>}>
      <InvitationContent />
    </Suspense>
  );
}

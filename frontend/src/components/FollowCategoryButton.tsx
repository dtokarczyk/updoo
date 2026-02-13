'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  getFollowedCategories,
  followCategory,
  unfollowCategory,
} from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from '@/hooks/useTranslations';
import { Bell, BellOff } from 'lucide-react';

export function FollowCategoryButton({
  categoryId,
  title,
}: {
  categoryId: string;
  title?: string;
}) {
  const { user } = useAuth();
  const { t } = useTranslations();
  const [followedIds, setFollowedIds] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFollowing = followedIds !== null && followedIds.includes(categoryId);

  useEffect(() => {
    if (!user) {
      setFollowedIds(null);
      return;
    }
    let cancelled = false;
    getFollowedCategories()
      .then((ids) => {
        if (!cancelled) setFollowedIds(ids);
      })
      .catch(() => {
        if (!cancelled) setFollowedIds([]);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleClick = async () => {
    if (!user || loading) return;
    setError(null);
    setLoading(true);
    try {
      const nextIds = isFollowing
        ? await unfollowCategory(categoryId)
        : await followCategory(categoryId);
      setFollowedIds(nextIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;
  if (followedIds === null) return null; // still loading initial state

  const label = isFollowing ? t('jobs.unfollowCategory') : t('jobs.followCategory');
  const loadingLabel = isFollowing
    ? t('jobs.unfollowingCategory')
    : t('jobs.followingCategory');

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        variant={isFollowing ? 'secondary' : 'default'}
        size="sm"
        onClick={handleClick}
        disabled={loading}
        aria-label={title ? `${label} – ${title}` : label}
        title={t('jobs.categoryNewsletterDescription')}
        className="shrink-0"
      >
        {isFollowing ? (
          <BellOff className="mr-1.5 h-4 w-4 shrink-0" aria-hidden />
        ) : (
          <Bell className="mr-1.5 h-4 w-4 shrink-0" aria-hidden />
        )}
        {loading ? loadingLabel : label}
      </Button>
      {error && (
        <span className="text-sm text-destructive" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

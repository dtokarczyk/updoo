'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getCategories,
  getLocations,
  getPopularSkillsForCategory,
  getSkills,
} from '@/lib/api';
import { queryKeys } from './keys';

export function useCategoriesQuery() {
  return useQuery({
    queryKey: queryKeys.categories(),
    queryFn: getCategories,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLocationsQuery() {
  return useQuery({
    queryKey: queryKeys.locations(),
    queryFn: getLocations,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSkillsQuery() {
  return useQuery({
    queryKey: queryKeys.skills(),
    queryFn: getSkills,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePopularSkillsForCategoryQuery(categoryId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.popularSkills(categoryId ?? ''),
    queryFn: () => getPopularSkillsForCategory(categoryId!),
    enabled: !!categoryId,
    staleTime: 2 * 60 * 1000,
  });
}

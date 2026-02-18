'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { getProposals } from '@/lib/api';
import type { ProposalListItem } from '@/lib/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useTranslations } from '@/hooks/useTranslations';

export default function AdminProposalsPage() {
  const { t } = useTranslations();
  const [items, setItems] = useState<ProposalListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProposals(1, 20)
      .then((list) => {
        setItems(list.items);
        setTotal(list.total);
      })
      .catch(() => {
        setItems([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('admin.proposals.title')}</CardTitle>
        <CardDescription>{t('admin.proposals.description')}</CardDescription>
        <div className="pt-2">
          <Button asChild variant="default">
            <Link href="/admin/proposals/new">
              {t('admin.proposals.addProposal')}
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground py-4">
            {t('common.loading')}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">{t('admin.proposals.tableTitle')}</TableHead>
                <TableHead className="w-[180px]">{t('admin.proposals.tableEmail')}</TableHead>
                <TableHead>{t('admin.proposals.tableReason')}</TableHead>
                <TableHead>{t('admin.proposals.tableStatus')}</TableHead>
                <TableHead className="text-right">{t('admin.proposals.tableCreated')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-8"
                  >
                    {t('admin.proposals.noProposals')}
                  </TableCell>
                </TableRow>
              ) : (
                items.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.title}</TableCell>
                    <TableCell>{p.email}</TableCell>
                    <TableCell>{p.reason === 'FB_GROUP' ? t('admin.proposals.reasonFbGroup') : p.reason}</TableCell>
                    <TableCell>{p.status}</TableCell>
                    <TableCell className="text-right">
                      {format(new Date(p.createdAt), 'dd.MM.yyyy HH:mm')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

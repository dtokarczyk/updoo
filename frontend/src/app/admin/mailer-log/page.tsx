'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { getAdminMailerLogs, type AdminMailerLogItem } from '@/lib/api';
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
import { useTranslations } from '@/hooks/useTranslations';

function truncate(str: string, maxLen: number) {
  if (!str) return '–';
  return str.length <= maxLen ? str : str.slice(0, maxLen) + '…';
}

export default function AdminMailerLogPage() {
  useTranslations();
  const [logs, setLogs] = useState<AdminMailerLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminMailerLogs()
      .then(setLogs)
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mailer log</CardTitle>
        <CardDescription>
          Historia wysłanych e-maili (MailerSend), od najnowszych
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground py-4">
            Ładowanie listy mailer log...
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Wysyłka</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[200px]">Do (To)</TableHead>
                <TableHead className="min-w-[180px]">Temat (Subject)</TableHead>
                <TableHead>Treść</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-8"
                  >
                    Brak wpisów w mailer log
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => {
                  const sentAt = log.sentAt
                    ? format(new Date(log.sentAt), 'dd.MM.yyyy HH:mm')
                    : '–';
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {sentAt}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            log.status === 'SENT' || log.status === 'DELIVERED'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : log.status === 'FAILED' ||
                                  log.status === 'BOUNCED'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {log.status}
                        </span>
                      </TableCell>
                      <TableCell
                        className="max-w-[200px] truncate font-medium"
                        title={log.recipientEmail}
                      >
                        {log.recipientEmail}
                      </TableCell>
                      <TableCell
                        className="min-w-[180px] max-w-[280px] truncate"
                        title={log.subject}
                      >
                        {log.subject}
                      </TableCell>
                      <TableCell
                        className="max-w-[320px] truncate text-muted-foreground"
                        title={log.content || undefined}
                      >
                        {truncate(log.content, 120)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

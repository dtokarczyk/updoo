import { Injectable, BadRequestException } from '@nestjs/common';
import type { SearchResultRow } from './regon-contact.util';
import {
  BIR11_REPORT_LEGAL,
  BIR11_REPORT_NATURAL_CEIDG,
} from './regon.constants';

export type { SearchResultRow };

export interface RegonCompanyData {
  searchResult: SearchResultRow[];
  /** Reports parsed to JSON (e.g. BIR11OsFizycznaDzialalnoscCeidg, BIR11OsPrawna) */
  reports: Record<string, Record<string, unknown>>;
}

@Injectable()
export class RegonService {
  /**
   * Fetch company data by NIP, REGON, or KRS using bir1 library (GUS REGON client).
   * Uses report BIR11OsFizycznaDzialalnoscCeidg for natural persons, BIR11OsPrawna for legal.
   */
  async getCompanyDataByNipRegonOrKrs(
    nip?: string,
    regon?: string,
    krs?: string,
  ): Promise<RegonCompanyData> {
    const identifier = nip ?? regon ?? krs;
    if (!identifier || String(identifier).trim() === '') {
      throw new BadRequestException('Provide one of: nip, regon, krs');
    }

    const apiKey = process.env.REGON_API_KEY;
    if (!apiKey) {
      throw new BadRequestException(
        'REGON API key is not configured. Set REGON_API_KEY in environment.',
      );
    }

    const normalized = String(identifier).replace(/\s/g, '');

    // bir1 is ESM-only; dynamic import in CJS NestJS
    const { default: Bir } = await import('bir1');
    const bir = new Bir({ key: apiKey });

    try {
      const query = nip
        ? { nip: normalized }
        : regon
          ? { regon: normalized }
          : { krs: normalized };
      const rawSearch = await bir.search(query);

      const searchResult: SearchResultRow[] = rawSearch
        ? [normalizeSearchRow(rawSearch as Record<string, unknown>)]
        : [];

      if (searchResult.length === 0) {
        return { searchResult: [], reports: {} };
      }

      const typ = searchResult[0].Typ;
      const mainRegon = searchResult[0].Regon;
      const reportName =
        typ === 'P' ? BIR11_REPORT_LEGAL : BIR11_REPORT_NATURAL_CEIDG;

      const reportData = await bir.report({
        regon: mainRegon,
        report: reportName,
      });

      const reportObj: Record<string, unknown> | undefined =
        reportData != null && typeof reportData === 'object'
          ? Array.isArray(reportData)
            ? (reportData[0] as Record<string, unknown>)
            : (reportData as Record<string, unknown>)
          : undefined;

      const reports: Record<string, Record<string, unknown>> = {};
      if (reportObj) {
        reports[reportName] = reportObj;
      }

      return { searchResult, reports };
    } finally {
      await bir.logout();
    }
  }
}

function normalizeSearchRow(row: Record<string, unknown>): SearchResultRow {
  return {
    Regon: String(row.Regon ?? ''),
    Nip: String(row.Nip ?? ''),
    StatusNip: row.StatusNip != null ? String(row.StatusNip) : undefined,
    Nazwa: String(row.Nazwa ?? ''),
    Wojewodztwo: row.Wojewodztwo != null ? String(row.Wojewodztwo) : undefined,
    Powiat: row.Powiat != null ? String(row.Powiat) : undefined,
    Gmina: row.Gmina != null ? String(row.Gmina) : undefined,
    Miejscowosc: row.Miejscowosc != null ? String(row.Miejscowosc) : undefined,
    KodPocztowy: row.KodPocztowy != null ? String(row.KodPocztowy) : undefined,
    Ulica: row.Ulica != null ? String(row.Ulica) : undefined,
    NrNieruchomosci:
      row.NrNieruchomosci != null ? String(row.NrNieruchomosci) : undefined,
    NrLokalu: row.NrLokalu != null ? String(row.NrLokalu) : undefined,
    Typ: String(row.Typ ?? ''),
    SilosID: row.SilosID != null ? String(row.SilosID) : undefined,
    DataZakonczeniaDzialalnosci:
      row.DataZakonczeniaDzialalnosci != null
        ? String(row.DataZakonczeniaDzialalnosci)
        : undefined,
  };
}

import { Injectable, BadRequestException } from '@nestjs/common';
import { GUS_REPORT_NAMES } from './regon.constants';
import type { RegonCompanyData, SearchResultRow } from './regon.types';

export type { RegonCompanyData, SearchResultRow } from './regon.types';

/** GUS BIR error code: no data found for the specified search criteria. */
const GUS_ERROR_CODE_NO_DATA = '4';

@Injectable()
export class RegonService {
  /**
   * Fetch company data by NIP, REGON, or KRS using bir1 library (GUS REGON client).
   * Fetches all GUS reports (GUS_REPORT_NAMES) for the main REGON; reports that don't apply are skipped.
   * @throws BadRequestException when GUS returns no data for the given identifier (messages.companyNotFoundInGus)
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
    const { default: Bir, BirError } = await import('bir1');
    const bir = new Bir({ key: apiKey });

    try {
      const query = nip
        ? { nip: normalized }
        : regon
          ? { regon: normalized }
          : { krs: normalized };
      let rawSearch: unknown;
      try {
        rawSearch = await bir.search(query);
      } catch (err) {
        if (err instanceof BirError && err.response?.ErrorCode === GUS_ERROR_CODE_NO_DATA) {
          throw new BadRequestException('messages.companyNotFoundInGus');
        }
        throw err;
      }

      const searchResult: SearchResultRow[] = rawSearch
        ? [normalizeSearchRow(rawSearch as Record<string, unknown>)]
        : [];

      if (searchResult.length === 0) {
        throw new BadRequestException('messages.companyNotFoundInGus');
      }

      const mainRegon = searchResult[0].Regon;

      const reports: Record<string, Record<string, unknown>> = {};
      for (const reportName of GUS_REPORT_NAMES) {
        try {
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
          if (reportObj) {
            reports[reportName] = reportObj;
          }
        } catch {
          // Report not applicable for this entity (e.g. wrong type) or no data – skip
        }
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

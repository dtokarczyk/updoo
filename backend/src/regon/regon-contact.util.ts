/**
 * Search result type for REGON (bir1) – keys as in GUS API (DaneSzukajPodmioty).
 */

export interface SearchResultRow {
  Regon: string;
  Nip: string;
  StatusNip?: string;
  Nazwa: string;
  Wojewodztwo?: string;
  Powiat?: string;
  Gmina?: string;
  Miejscowosc?: string;
  KodPocztowy?: string;
  Ulica?: string;
  NrNieruchomosci?: string;
  NrLokalu?: string;
  Typ: string;
  SilosID?: string;
  DataZakonczeniaDzialalnosci?: string;
}

/**
 * REGON API (used with node-regon).
 * Sandbox: https://wyszukiwarkaregontest.stat.gov.pl/wsBIR/UslugaBIRzewnPubl.svc
 * Production: https://wyszukiwarkaregon.stat.gov.pl/wsBIR/UslugaBIRzewnPubl.svc
 */

export const REGON_API_URL =
  process.env.REGON_API_URL ||
  'https://wyszukiwarkaregon.stat.gov.pl/wsBIR/UslugaBIRzewnPubl.svc';

/**
 * All GUS BIR report names for bir1.report() (DanePobierzPelnyRaport).
 * We request all with main REGON; reports that don't apply (e.g. wrong entity type) are skipped.
 */
export const GUS_REPORT_NAMES = [
  'PublDaneRaportFizycznaOsoba',
  'PublDaneRaportDzialalnoscFizycznejCeidg',
  'PublDaneRaportDzialalnoscFizycznejRolnicza',
  'PublDaneRaportDzialalnoscFizycznejPozostala',
  'PublDaneRaportDzialalnoscFizycznejWKrupgn',
  'PublDaneRaportDzialalnosciFizycznej',
  'PublDaneRaportLokalneFizycznej',
  'PublDaneRaportLokalnaFizycznej',
  'PublDaneRaportDzialalnosciLokalnejFizycznej',
  'PublDaneRaportPrawna',
  'PublDaneRaportDzialalnosciPrawnej',
  'PublDaneRaportLokalnePrawnej',
  'PublDaneRaportLokalnaPrawnej',
  'PublDaneRaportDzialalnosciLokalnejPrawnej',
  'PublDaneRaportWspolnicyPrawnej',
  'PublDaneRaportTypJednostki',
  'BIR11OsFizycznaDaneOgolne',
  'BIR11OsFizycznaDzialalnoscCeidg',
  'BIR11OsFizycznaDzialalnoscRolnicza',
  'BIR11OsFizycznaDzialalnoscPozostala',
  'BIR11OsFizycznaDzialalnoscSkreslonaDo20141108',
  'BIR11OsFizycznaPkd',
  'BIR11OsFizycznaListaJednLokalnych',
  'BIR11JednLokalnaOsFizycznej',
  'BIR11JednLokalnaOsFizycznejPkd',
  'BIR11OsPrawna',
  'BIR11OsPrawnaPkd',
  'BIR11OsPrawnaListaJednLokalnych',
  'BIR11JednLokalnaOsPrawnej',
  'BIR11JednLokalnaOsPrawnejPkd',
  'BIR11OsPrawnaSpCywilnaWspolnicy',
  'BIR11TypPodmiotu',
] as const;

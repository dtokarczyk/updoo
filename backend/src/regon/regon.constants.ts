/**
 * REGON API (used with node-regon).
 * Sandbox: https://wyszukiwarkaregontest.stat.gov.pl/wsBIR/UslugaBIRzewnPubl.svc
 * Production: https://wyszukiwarkaregon.stat.gov.pl/wsBIR/UslugaBIRzewnPubl.svc
 */

export const REGON_API_URL =
  process.env.REGON_API_URL ||
  'https://wyszukiwarkaregon.stat.gov.pl/wsBIR/UslugaBIRzewnPubl.svc';

/** Report names for bir1.report() – BIR11 for full data including email, www, phone. */
export const BIR11_REPORT_LEGAL = 'BIR11OsPrawna';
export const BIR11_REPORT_NATURAL_CEIDG = 'BIR11OsFizycznaDzialalnoscCeidg';

/**
 * REGON API (used with node-regon).
 * Sandbox: https://wyszukiwarkaregontest.stat.gov.pl/wsBIR/UslugaBIRzewnPubl.svc
 * Production: https://wyszukiwarkaregon.stat.gov.pl/wsBIR/UslugaBIRzewnPubl.svc
 */

export const REGON_API_URL =
  process.env.REGON_API_URL ||
  'https://wyszukiwarkaregon.stat.gov.pl/wsBIR/UslugaBIRzewnPubl.svc';

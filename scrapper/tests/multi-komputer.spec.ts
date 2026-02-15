import { test, chromium } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs/promises';

const userDataDir = path.join(__dirname, '../.playwright-chrome-data');
const outputDir = path.join(__dirname, '../output');

let sharedContext: Awaited<ReturnType<typeof chromium.launchPersistentContext>> | null = null;

function isContextValid(context: Awaited<ReturnType<typeof chromium.launchPersistentContext>> | null): boolean {
  if (!context) return false;
  try {
    const browser = context.browser();
    if (browser === null) return false;
    context.pages();
    return true;
  } catch {
    return false;
  }
}

async function forceRecreateContext() {
  console.log('Force closing and recreating browser context...');
  if (sharedContext) {
    try {
      await sharedContext.close();
    } catch {
      // ignore
    }
    sharedContext = null;
  }
  await safeWait(1000);
  return await getBrowserContext();
}

async function getBrowserContext() {
  if (!isContextValid(sharedContext)) {
    if (sharedContext) {
      try {
        await sharedContext.close();
      } catch {
        // ignore
      }
      sharedContext = null;
    }

    console.log('Creating new browser context (Chrome with your session data)...');
    sharedContext = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      channel: 'chrome',
      viewport: { width: 1920, height: 1080 },
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
      ],
    });
    await fs.mkdir(outputDir, { recursive: true });

    sharedContext.on('close', () => {
      console.log('Browser context was closed, will recreate on next use');
      sharedContext = null;
    });
  }
  return sharedContext!;
}

async function getPage(
  context: Awaited<ReturnType<typeof chromium.launchPersistentContext>>,
  retryCount = 0
): Promise<Awaited<ReturnType<typeof context.newPage>>> {
  const maxRetries = 3;
  try {
    const pages = context.pages();
    if (pages.length > 0 && !pages[0].isClosed()) {
      return pages[0];
    }
    return await context.newPage();
  } catch (error: unknown) {
    const err = error as { message?: string };
    if (
      err?.message?.includes('Failed to open') ||
      err?.message?.includes('Protocol error') ||
      retryCount >= maxRetries
    ) {
      console.log(`Failed to get/create page (attempt ${retryCount + 1}), forcing context recreation...`);
      const newContext = await forceRecreateContext();
      if (retryCount < maxRetries) {
        await safeWait(1000);
        return await getPage(newContext, retryCount + 1);
      }
      throw error;
    }
    await safeWait(1000);
    return await getPage(context, retryCount + 1);
  }
}

function safeWait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Run a promise with a short timeout; on timeout or error returns null. */
async function withShortTimeout<T>(ms: number, fn: () => Promise<T>): Promise<T | null> {
  try {
    return await Promise.race([
      fn(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
    ]);
  } catch {
    return null;
  }
}

// Types for scraped data
interface CompanyContact {
  profileUrl: string;
  name: string | null;
  address: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
}

interface PageResult {
  pageNumber: number;
  listingUrl: string;
  companies: CompanyContact[];
}

interface MultiKomputerScrapeResult {
  scrapedAt: string;
  baseUrl: string;
  startPage: number;
  totalPages: number;
  pages: PageResult[];
}

const BASE_URL = 'https://www.multi-komputer.pl';
const LISTING_PATH = '/firmy/polska/komputery%20-%20oprogramowanie';
const START_PAGE = 1177; // e.g. 10 to start from page 10
const TOTAL_PAGES = 2546;
const MAX_COMPANIES = 99999999999999; // only first company (for quick test)

const endPage = START_PAGE + TOTAL_PAGES - 1;
/** Prefix for per-page files (no extension). One file per page: {prefix}-page-{num}.json */
let runOutputPrefix: string | null = null;

test.afterAll(async () => {
  if (sharedContext) {
    await sharedContext.close();
    sharedContext = null;
  }
});

async function scrapeOnePage(
  pageNum: number,
  context: Awaited<ReturnType<typeof chromium.launchPersistentContext>>,
  page: Awaited<ReturnType<typeof context.newPage>>
): Promise<PageResult> {
  const listingUrl =
    pageNum === 1
      ? `${BASE_URL}${LISTING_PATH}`
      : `${BASE_URL}${LISTING_PATH}?page=${pageNum}`;

  const pageResult: PageResult = { pageNumber: pageNum, listingUrl, companies: [] };

  if (page.isClosed() || !isContextValid(context)) {
    return pageResult;
  }

  try {
    await page.goto(listingUrl, { waitUntil: 'networkidle', timeout: 30000 });
  } catch (navErr) {
    console.error(`Navigation failed for page ${pageNum}:`, navErr);
    return pageResult;
  }

  const companyCards = await page.locator('.company').all();
  if (companyCards.length === 0) {
    console.log(`No .company found on page ${pageNum}`);
    return pageResult;
  }

  const profileUrls: string[] = [];
  for (let i = 0; i < companyCards.length; i++) {
    const card = companyCards[i];
    const headingLink = card.locator('h2 a[href], h3 a[href]').first();
    let href: string | null = null;
    if ((await headingLink.count()) > 0) {
      href = await headingLink.getAttribute('href');
    }
    if (!href) {
      const links = await card.locator('a[href]').all();
      for (const a of links) {
        const text = (await a.textContent())?.trim() ?? '';
        if (text === 'Strona www') continue;
        href = await a.getAttribute('href');
        if (href) break;
      }
    }
    if (href && !href.startsWith('javascript:')) {
      const fullUrl = href.startsWith('http') ? href : new URL(href, BASE_URL).href;
      if (fullUrl.includes('multi-komputer.pl')) {
        profileUrls.push(fullUrl);
      }
    }
  }

  const listingUrlNormalized = listingUrl.replace(/\?.*$/, '');
  const urlsToVisit = [...new Set(profileUrls)].filter(
    (url) => url !== listingUrl && !url.startsWith(listingUrlNormalized + '?')
  );
  const urlsToProcess = urlsToVisit.slice(0, MAX_COMPANIES);
  console.log(`Found ${urlsToVisit.length} company profiles on page ${pageNum}, processing ${urlsToProcess.length}`);

  for (let i = 0; i < urlsToProcess.length; i++) {
    const profileUrl = urlsToProcess[i];
    try {
      if (page.isClosed() || !isContextValid(context)) break;
      console.log(`  Company ${i + 1}/${urlsToProcess.length}: ${profileUrl}`);

      let navOk = false;
      for (let retry = 0; retry <= 2 && !navOk; retry++) {
        try {
          await page.goto(profileUrl, { waitUntil: 'networkidle', timeout: 30000 });
          navOk = true;
        } catch {
          if (retry < 2) {
            await safeWait(1500);
          } else {
            throw new Error(`Failed to open profile: ${profileUrl}`);
          }
        }
      }

      const box = page.locator('#box-company');
      let name: string | null = null;
      let address: string | null = null;
      let website: string | null = null;
      let phone: string | null = null;
      let email: string | null = null;

      if ((await box.count()) > 0) {
        const h1 = page.locator('xpath=//*[@id="box-company"]/div[1]/div/div[1]/div/h1');
        if ((await h1.count()) > 0) name = (await h1.textContent())?.trim() ?? null;
        if (!name) name = (await box.locator('h1').first().textContent())?.trim() ?? null;

        const addressP = page.locator('xpath=//*[@id="box-company"]/div[1]/div/div[1]/div/p');
        if ((await addressP.count()) > 0) address = (await addressP.textContent())?.trim() ?? null;
        if (!address) address = (await box.locator('p').first().textContent())?.trim() ?? null;
        if (address) address = address.replace(/\s+/g, ' ').trim();

        const li1 = page.locator('xpath=//*[@id="box-company"]/div[1]/div/div[2]/ul/li[1]');
        if ((await li1.count()) > 0) {
          const websiteLink = li1.locator('a').first();
          if ((await websiteLink.count()) > 0) {
            const w = await websiteLink.getAttribute('href');
            website = (w ?? (await websiteLink.textContent())?.trim()) || null;
          } else {
            website = (await li1.textContent())?.trim() ?? null;
          }
        }

        const shortTimeout = 4000;
        phone =
          (await withShortTimeout(shortTimeout, async () => {
            const phoneBtn = page.locator('#box-company .company-phone').first();
            if ((await phoneBtn.count()) === 0) {
              const li2Link = page.locator('xpath=//*[@id="box-company"]/div[1]/div/div[2]/ul/li[2]//a').first();
              if ((await li2Link.count()) === 0) return null;
              await li2Link.click();
            } else {
              await phoneBtn.click();
            }
            await safeWait(1000 + Math.random() * 500);
            const phoneLocator = page.locator('#box-company .company-phone').first();
            if ((await phoneLocator.count()) === 0) {
              const li2 = page.locator('xpath=//*[@id="box-company"]/div[1]/div/div[2]/ul/li[2]');
              const href = await li2.locator('a').first().getAttribute('href');
              const text = (await li2.locator('a').first().textContent())?.trim();
              return (href?.replace(/^tel:/i, '').trim()) || text || null;
            }
            const phoneHref = await phoneLocator.getAttribute('href');
            const phoneText = (await phoneLocator.textContent())?.trim();
            return (phoneHref?.replace(/^tel:/i, '').trim()) || phoneText || null;
          })) ?? null;

        email =
          (await withShortTimeout(shortTimeout, async () => {
            const emailBtn = page.locator('#box-company .company-email').first();
            if ((await emailBtn.count()) === 0) return null;
            await emailBtn.click();
            await safeWait(1000 + Math.random() * 500);
            const mailto = await emailBtn.getAttribute('href');
            const text = (await emailBtn.textContent())?.trim();
            return (mailto?.replace(/^mailto:/i, '').trim()) || text || null;
          })) ?? null;
      }

      pageResult.companies.push({ profileUrl, name, address, website, phone, email });
      await safeWait(800 + Math.random() * 700);
    } catch (err) {
      console.error(`  Error processing company ${i + 1}/${urlsToProcess.length}:`, err);
      if (err instanceof Error && err.message.includes('has been closed')) {
        try {
          await getBrowserContext();
          await getPage(sharedContext!);
        } catch {
          // ignore
        }
      }
      pageResult.companies.push({
        profileUrl,
        name: null,
        address: null,
        website: null,
        phone: null,
        email: null,
      });
      await safeWait(1000);
    }
  }

  return pageResult;
}

test.describe.serial('scrape multi-komputer.pl companies', () => {
  test.beforeAll(async () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    runOutputPrefix = path.join(outputDir, `multi-komputer-companies-${timestamp}`);
    await fs.mkdir(outputDir, { recursive: true });
    console.log(`Run output prefix: ${runOutputPrefix}-page-N.json`);
  });

  for (let pageNum = START_PAGE; pageNum <= endPage; pageNum++) {
    test(`page ${pageNum}/${endPage}`, async () => {
      test.setTimeout(10 * 60 * 1000); // 10 min per page
      const context = await getBrowserContext();
      const page = await getPage(context);

      console.log(`\n=== Page ${pageNum}/${endPage} ===`);

      const pageResult = await scrapeOnePage(pageNum, context, page);

      const pageFile = {
        scrapedAt: new Date().toISOString(),
        baseUrl: BASE_URL,
        startPage: START_PAGE,
        totalPages: TOTAL_PAGES,
        pageNumber: pageResult.pageNumber,
        listingUrl: pageResult.listingUrl,
        companies: pageResult.companies,
      };
      const outputPath = `${runOutputPrefix!}-page-${pageNum}.json`;
      await fs.writeFile(outputPath, JSON.stringify(pageFile, null, 2), 'utf-8');
      console.log(`Saved page ${pageNum} to ${outputPath}`);
    });
  }
});

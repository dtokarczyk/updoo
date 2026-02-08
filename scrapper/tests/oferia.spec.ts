import { test, chromium } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs/promises';

// Use persistent context with your own Chrome browser (session data)
const userDataDir = path.join(__dirname, '../.playwright-chrome-data');

// Output directory for JSON result
const outputDir = path.join(__dirname, '../output');

// Shared browser context
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

// Types for scraped data
interface ContractorContact {
  profileUrl: string;
  phone: string | null;
  email: string | null;
  categoryLinks: string[];
}

interface PageResult {
  pageNumber: number;
  listingUrl: string;
  contractors: ContractorContact[];
}

interface OferiaScrapeResult {
  scrapedAt: string;
  baseUrl: string;
  totalPages: number;
  pages: PageResult[];
}

const BASE_URL = 'https://oferia.com.pl/pl/zleceniobiorcy';
const LISTING_PARAMS = 'category=&city=&q=';
const TOTAL_PAGES = 15;

test.afterAll(async () => {
  if (sharedContext) {
    await sharedContext.close();
    sharedContext = null;
  }
});

test.describe.serial('scrape oferia.com.pl contractors', () => {
  test('scrape contractors from 4 listing pages', async () => {
    test.setTimeout(5 * 60 * 60 * 1000); // 5 hours max per test
    const context = await getBrowserContext();
    let page = await getPage(context);

    const result: OferiaScrapeResult = {
      scrapedAt: new Date().toISOString(),
      baseUrl: BASE_URL,
      totalPages: TOTAL_PAGES,
      pages: [],
    };

    for (let pageNum = 1; pageNum <= TOTAL_PAGES; pageNum++) {
      const listingUrl =
        pageNum === 1
          ? `${BASE_URL}?${LISTING_PARAMS}`
          : `${BASE_URL}?${LISTING_PARAMS}&page=${pageNum}`;

      console.log(`\n=== Page ${pageNum}/${TOTAL_PAGES}: ${listingUrl} ===`);

      if (page.isClosed() || !isContextValid(context)) {
        const newContext = await getBrowserContext();
        page = await getPage(newContext);
      }

      try {
        await page.goto(listingUrl, { waitUntil: 'networkidle', timeout: 30000 });
      } catch (navErr) {
        console.error(`Navigation failed for page ${pageNum}:`, navErr);
        result.pages.push({ pageNumber: pageNum, listingUrl, contractors: [] });
        await safeWait(2000);
        continue;
      }

      const contractorCards = await page.locator('.contractor-card').all();
      if (contractorCards.length === 0) {
        console.log(`No .contractor-card found on page ${pageNum}`);
        result.pages.push({ pageNumber: pageNum, listingUrl, contractors: [] });
        await safeWait(1500);
        continue;
      }

      // Collect all profile URLs while still on listing page (locators become stale after navigation)
      const profileUrls: string[] = [];
      for (let i = 0; i < contractorCards.length; i++) {
        const card = contractorCards[i];
        const href = await card.locator('a[href*="/pl/"]').first().getAttribute('href');
        if (href) {
          profileUrls.push(href.startsWith('http') ? href : new URL(href, BASE_URL).href);
        }
      }

      console.log(`Found ${profileUrls.length} contractor profiles on page ${pageNum}`);

      const pageContractors: ContractorContact[] = [];

      for (let i = 0; i < profileUrls.length; i++) {
        const profileUrl = profileUrls[i];
        try {
          if (page.isClosed() || !isContextValid(context)) {
            const newContext = await getBrowserContext();
            page = await getPage(newContext);
          }

          console.log(`  Contractor ${i + 1}/${profileUrls.length}: ${profileUrl}`);

          let navOk = false;
          for (let retry = 0; retry <= 2 && !navOk; retry++) {
            try {
              await page.goto(profileUrl, { waitUntil: 'networkidle', timeout: 30000 });
              navOk = true;
            } catch {
              if (retry < 2) {
                const newContext = await getBrowserContext();
                page = await getPage(newContext);
                await safeWait(1500);
              } else {
                throw new Error(`Failed to open profile: ${profileUrl}`);
              }
            }
          }

          let phone: string | null = null;
          let email: string | null = null;
          const categoryLinks: string[] = [];

          // .contact-card -> two .contact-item (phone, email)
          const contactCard = page.locator('.contact-card');
          if ((await contactCard.count()) > 0) {
            const contactItems = await contactCard.locator('.contact-item').all();
            const texts: string[] = [];
            for (const item of contactItems) {
              const text = (await item.textContent())?.trim() ?? '';
              const link = await item.locator('a').first().getAttribute('href');
              if (link?.startsWith('mailto:')) {
                email = link.replace(/^mailto:/i, '').trim() || text || null;
              } else if (link?.startsWith('tel:') || (text && /\d[\d\s\-+]{8,}/.test(text))) {
                phone = link?.replace(/^tel:/i, '').trim() || text || null;
              }
              texts.push(text);
            }
            // Fallback: two items = first phone, second email
            if (contactItems.length >= 2 && texts.length >= 2) {
              if (!phone && texts[0]) phone = texts[0].trim() || null;
              if (!email && texts[1]) email = texts[1].trim() || null;
            }
          }

          // .profile-categories -> links to categories
          const profileCategories = page.locator('.profile-categories');
          if ((await profileCategories.count()) > 0) {
            const links = await profileCategories.locator('a[href]').all();
            for (const a of links) {
              const h = await a.getAttribute('href');
              if (h) {
                const full = h.startsWith('http') ? h : new URL(h, BASE_URL).href;
                if (!categoryLinks.includes(full)) {
                  categoryLinks.push(full);
                }
              }
            }
          }

          pageContractors.push({
            profileUrl,
            phone,
            email,
            categoryLinks,
          });

          await safeWait(800 + Math.random() * 700);
        } catch (err) {
          console.error(`  Error processing profile ${i + 1}/${profileUrls.length}:`, err);
          await safeWait(1000);
        }
      }

      result.pages.push({
        pageNumber: pageNum,
        listingUrl,
        contractors: pageContractors,
      });

      await safeWait(2000 + Math.random() * 1500);
    }

    const outputPath = path.join(outputDir, 'oferia-contractors.json');
    await fs.writeFile(outputPath, JSON.stringify(result, null, 2), 'utf-8');
    console.log(`\nSaved result to: ${outputPath}`);
  });
});

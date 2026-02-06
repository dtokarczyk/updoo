import { test, chromium } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs/promises';

// Use persistent context with your own Chrome browser
// This will use your installed Chrome (not Playwright's Chromium) and save cookies
const userDataDir = path.join(__dirname, '../.playwright-chrome-data');

// Create output directory for saving text content
const outputDir = path.join(__dirname, '../output');

// Shared browser context - will be initialized once
let sharedContext: Awaited<ReturnType<typeof chromium.launchPersistentContext>> | null = null;

// Check if context is still valid
function isContextValid(context: Awaited<ReturnType<typeof chromium.launchPersistentContext>> | null): boolean {
  if (!context) return false;
  try {
    // Try to access browser - if it throws or returns null, context is closed
    const browser = context.browser();
    if (browser === null) return false;
    // Try to get pages to verify context is usable
    const pages = context.pages();
    return true;
  } catch {
    return false;
  }
}

// Force close and recreate browser context
async function forceRecreateContext() {
  console.log('Force closing and recreating browser context...');
  if (sharedContext) {
    try {
      await sharedContext.close();
    } catch (e) {
      // Ignore errors when closing already closed context
    }
    sharedContext = null;
  }
  // Wait a bit before recreating
  await safeWait(1000);
  return await getBrowserContext();
}

// Initialize browser context
async function getBrowserContext() {
  if (!isContextValid(sharedContext)) {
    if (sharedContext) {
      try {
        await sharedContext.close();
      } catch (e) {
        // Ignore errors when closing already closed context
      }
      sharedContext = null;
    }

    console.log('Creating new browser context...');
    sharedContext = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      channel: 'chrome', // Use your installed Chrome instead of Playwright's Chromium
      viewport: { width: 1920, height: 1080 },
      args: [
        '--disable-blink-features=AutomationControlled', // Hide automation indicators
        '--disable-dev-shm-usage',
      ],
    });
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    // Listen for context close events
    sharedContext.on('close', () => {
      console.log('Browser context was closed, will recreate on next use');
      sharedContext = null;
    });
  }
  return sharedContext!;
}

// Get or create a valid page with retry logic
async function getPage(context: Awaited<ReturnType<typeof chromium.launchPersistentContext>>, retryCount = 0): Promise<any> {
  const maxRetries = 3;

  try {
    const pages = context.pages();
    if (pages.length > 0 && !pages[0].isClosed()) {
      return pages[0];
    }
    return await context.newPage();
  } catch (error: any) {
    // If we can't create a new page, the context might be broken
    if (error?.message?.includes('Failed to open') || error?.message?.includes('Protocol error') || retryCount >= maxRetries) {
      console.log(`Failed to get/create page (attempt ${retryCount + 1}), forcing context recreation...`);
      // Force recreate context
      const newContext = await forceRecreateContext();
      // Retry getting page from new context
      if (retryCount < maxRetries) {
        await safeWait(1000);
        return await getPage(newContext, retryCount + 1);
      }
      throw error;
    }
    // Wait and retry
    await safeWait(1000);
    return await getPage(context, retryCount + 1);
  }
}

// Safe wait with context check
async function safeWait(timeout: number) {
  return new Promise(resolve => setTimeout(resolve, timeout));
}

// Cleanup browser context after all tests
test.afterAll(async () => {
  if (sharedContext) {
    await sharedContext.close();
    sharedContext = null;
  }
});

// Resume from page 41 (output has pages 2–40 complete, page 41 had only 2 jobs)
const startPage = 41;
const endPage = 2001; // 2000 pages total (from 2 to 2001)
const baseUrl = 'https://useme.com/pl/jobs/';

// Create serial test suite - tests will run one after another
test.describe.serial('scrape useme.com jobs', () => {
  // Generate individual tests for each page
  for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
    test(`scrape page ${pageNum}`, async ({ }, testInfo) => {
      // Set longer timeout for this test (5 minutes)
      test.setTimeout(300000);
      let context = await getBrowserContext();
      let page = await getPage(context);
      const url = `${baseUrl}?page=${pageNum}`;

      try {
        console.log(`\n=== Processing page ${pageNum} ===`);

        // Check if page/context is still valid, recreate if needed
        if (page.isClosed() || !isContextValid(context)) {
          console.log('Page/context was closed, recreating...');
          context = await getBrowserContext();
          page = await getPage(context);
        }

        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

        // Find all job articles
        const jobArticles = await page.locator('article.job').all();

        if (jobArticles.length === 0) {
          console.log(`No jobs found on page ${pageNum}, skipping...`);
          // Add delay before next test
          await safeWait(2000);
          return;
        }

        console.log(`Found ${jobArticles.length} jobs on page ${pageNum}`);

        // Extract links from each job article
        const jobLinks: string[] = [];
        for (const article of jobArticles) {
          const link = await article.locator('a').first().getAttribute('href');
          if (link) {
            const fullLink = link.startsWith('http') ? link : `https://useme.com${link}`;
            jobLinks.push(fullLink);
          }
        }

        console.log(`Found ${jobLinks.length} job links on page ${pageNum}`);

        // Visit each job link
        for (let i = 0; i < jobLinks.length; i++) {
          const jobLink = jobLinks[i];
          try {
            // Check if page/context is still open before each job
            if (page.isClosed() || !isContextValid(context)) {
              console.log('Browser was closed, forcing recreation...');
              try {
                context = await forceRecreateContext();
                page = await getPage(context);
              } catch (recreateError: any) {
                console.error('Failed to recreate browser:', recreateError?.message || recreateError);
                await safeWait(2000);
                // Try one more time
                context = await forceRecreateContext();
                page = await getPage(context);
              }
            }

            console.log(`\n  Processing job ${i + 1}/${jobLinks.length}: ${jobLink}`);

            // Try to navigate with retry logic
            let navigationSuccess = false;
            let retryCount = 0;
            const maxRetries = 2;

            while (!navigationSuccess && retryCount <= maxRetries) {
              try {
                await page.goto(jobLink, { waitUntil: 'networkidle', timeout: 30000 });
                navigationSuccess = true;
              } catch (navError: any) {
                if ((navError?.message?.includes('closed') ||
                  navError?.message?.includes('Target page')) &&
                  retryCount < maxRetries) {
                  console.log(`  Navigation failed (attempt ${retryCount + 1}), recreating context...`);
                  try {
                    context = await forceRecreateContext();
                    page = await getPage(context);
                    retryCount++;
                    await safeWait(2000);
                  } catch (recreateError: any) {
                    console.error('  Failed to recreate during navigation:', recreateError?.message || recreateError);
                    throw navError; // Re-throw original error if recreation fails
                  }
                } else {
                  throw navError; // Re-throw if not a closed browser error or max retries reached
                }
              }
            }

            // Find elements using XPath
            const titleElement = page.locator('xpath=//*[@id="main-content"]/div/div[2]/div[2]/h1');
            const contentElement = page.locator('xpath=//*[@id="main-content"]/div/div[2]/div[3]/div[1]');

            let titleText = '';
            let contentText = '';
            let hasContent = false;

            // Get title text (without HTML tags)
            if (await titleElement.count() > 0) {
              titleText = await titleElement.textContent() || '';
              hasContent = true;
            }

            // Get content text (without HTML tags)
            if (await contentElement.count() > 0) {
              contentText = await contentElement.textContent() || '';
              hasContent = true;
            }

            if (hasContent) {
              // Combine both text elements
              const combinedText = titleText ? `${titleText}\n\n${contentText}` : contentText;

              // Save text content to file (without HTML tags)
              const fileName = `page-${pageNum}-job-${i + 1}.txt`;
              const filePath = path.join(outputDir, fileName);
              await fs.writeFile(filePath, combinedText, 'utf-8');
              console.log(`  Saved text content to: ${filePath}`);

            } else {
              console.log(`  No elements found using XPath on ${jobLink}`);
            }

            // Delay between jobs to avoid overwhelming the server
            await safeWait(1000 + Math.random() * 1000); // Random delay 1-2 seconds
          } catch (error: any) {
            console.error(`  Error processing job ${jobLink}:`, error?.message || error);
            // If page/context was closed or can't create new page, force recreate
            if (error?.message?.includes('closed') ||
              error?.message?.includes('Target page') ||
              error?.message?.includes('Failed to open') ||
              error?.message?.includes('Protocol error')) {
              console.log('  Detected browser issue, forcing context recreation...');
              try {
                context = await forceRecreateContext();
                page = await getPage(context);
                console.log('  Browser context recreated successfully');
              } catch (recreateError: any) {
                console.error('  Failed to recreate browser:', recreateError?.message || recreateError);
                // Wait longer before retrying
                await safeWait(3000);
                // Try one more time
                try {
                  context = await forceRecreateContext();
                  page = await getPage(context);
                  console.log('  Browser context recreated on second attempt');
                } catch (secondError: any) {
                  console.error('  Failed to recreate browser on second attempt:', secondError?.message || secondError);
                }
              }
            }
            // Continue with next job instead of failing entire test
            await safeWait(1000); // Wait before continuing
            continue;
          }
        }

        // Delay between pages - longer delay to avoid detection
        await safeWait(2000 + Math.random() * 2000); // Random delay 2-4 seconds
      } catch (error: any) {
        console.error(`Error processing page ${pageNum}:`, error?.message || error);
        // If page/context was closed or can't create new page, force recreate
        if (error?.message?.includes('closed') ||
          error?.message?.includes('Target page') ||
          error?.message?.includes('Failed to open') ||
          error?.message?.includes('Protocol error')) {
          console.log('Detected browser issue, forcing context recreation...');
          try {
            context = await forceRecreateContext();
            page = await getPage(context);
            console.log('Browser context recreated successfully');
          } catch (recreateError: any) {
            console.error('Failed to recreate browser:', recreateError?.message || recreateError);
            // Wait longer before retrying
            await safeWait(3000);
          }
        }
        // Add delay even on error
        await safeWait(2000);
      }
    });
  }
});
